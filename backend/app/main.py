from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from .data import (
    get_dashboard_stats as build_dashboard_stats,
    list_regulation_summaries,
    load_regulations,
)
from .models import (
    DashboardStats,
    NewsResponse,
    RegulationDetail,
    RegulationSummary,
)
from .news import LOOKBACK_DAYS, fetch_all_rss_articles, fetch_regulation_news
from .intelligence_router import router as intelligence_router

logger = logging.getLogger(__name__)


def _crawl_once() -> None:
    """모든 규제 쿼리를 순회하며 raw_articles 를 적재한다."""
    try:
        from .data import load_regulations as _load
        from .news import fetch_articles_by_query
        from .intelligence_db import upsert_raw_article

        regulations = _load()
        total = 0
        for reg in regulations:
            for query in (reg.get("search_queries") or []):
                articles = fetch_articles_by_query(query, max_results=50)
                for art in articles:
                    upsert_raw_article(art)
                    total += 1
        logger.info("[scheduler] crawl_once 완료 — %d건 처리", total)
    except Exception:
        logger.exception("[scheduler] crawl_once 실패")


def _run_pipeline() -> None:
    """키워드 필터 → LLM 가공 배치를 1회 실행한다."""
    try:
        from .intelligence_pipeline import process_batch
        n = process_batch()
        logger.info("[scheduler] run_pipeline 완료 — %d건 처리", n)
    except Exception:
        logger.exception("[scheduler] run_pipeline 실패")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.interval import IntervalTrigger

    scheduler = AsyncIOScheduler()
    # 매 1시간 크롤
    scheduler.add_job(_crawl_once, IntervalTrigger(hours=1), id="crawl", replace_existing=True)
    # 크롤 10분 후 파이프라인 (매 1시간, 10분 오프셋)
    scheduler.add_job(_run_pipeline, IntervalTrigger(hours=1, start_date="2000-01-01 00:10:00"), id="pipeline", replace_existing=True)
    scheduler.start()
    logger.info("[scheduler] APScheduler 시작 — crawl@1h, pipeline@1h+10m")
    yield
    scheduler.shutdown(wait=False)
    logger.info("[scheduler] APScheduler 종료")


app = FastAPI(title="Impact ON ESG Tracker API", version="0.1.1", lifespan=lifespan)

# CORS — 환경변수로 추가 origin 지정 가능
_extra = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    *[o.strip() for o in _extra.split(",") if o.strip()],
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intelligence_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/regulations", response_model=list[RegulationSummary])
def get_regulations(
    q: str | None = Query(default=None),
    category: str | None = None,
    status: str | None = None,
) -> list[dict]:
    regulations = list_regulation_summaries()
    if q:
        query = q.lower()
        regulations = [
            item
            for item in regulations
            if query
            in " ".join(
                [
                    item["code"],
                    item["title"],
                    item["category"],
                    item["region"],
                    item["industry"],
                    item["summary"],
                ]
            ).lower()
        ]
    if category:
        regulations = [item for item in regulations if item["category"] == category]
    if status:
        regulations = [
            item
            for item in regulations
            if item["statusKey"] == status or item["status"] == status
        ]
    return regulations


@app.get("/api/regulations/{regulation_id}", response_model=RegulationDetail)
def get_regulation(regulation_id: str) -> dict:
    for item in load_regulations():
        if item["id"] == regulation_id:
            return item
    raise HTTPException(status_code=404, detail="Regulation not found")


@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats_endpoint() -> dict[str, int]:
    return build_dashboard_stats()


@app.get("/api/news", response_model=NewsResponse)
def get_news(
    regulation_id: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=150),
) -> dict:
    regulations = load_regulations()
    if regulation_id:
        for regulation in regulations:
            if regulation["id"] == regulation_id:
                return fetch_regulation_news(
                    regulation,
                    limit=limit,
                    lookback_days=LOOKBACK_DAYS,
                )
        raise HTTPException(status_code=404, detail="Regulation not found")
    return fetch_all_rss_articles(
        regulations,
        limit=limit,
        lookback_days=LOOKBACK_DAYS,
    )


@app.get("/api/debug")
def debug_regulations() -> dict:
    regulations = load_regulations()
    if not regulations:
        return {"count": 0, "first": None}
    
    # CSRD 찾기
    csrd = next((r for r in regulations if r.get("id") == "csrd"), regulations[0])
    
    return {
        "count": len(regulations),
        "csrd_id": csrd.get("id"),
        "csrd_keys": list(csrd.keys()),
        "csrd_search_queries": csrd.get("search_queries"),
        "csrd_news_config": csrd.get("news_config"),
    }

from __future__ import annotations

import logging
import threading
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
    """
    1) 규제별 Google News RSS 수집
    2) 전문 매체 화이트리스트 직접 스크래핑 (REPORT/MARKET/EXPERT 포함)
    """
    try:
        from .data import load_regulations as _load
        from .news import fetch_google_news, fetch_full_text_scrapper

        # ① Google News 규제 쿼리 수집
        regulations = _load()
        rss_total = 0
        for reg in regulations:
            for query in (reg.get("search_queries") or []):
                articles = fetch_google_news(query)
                rss_total += len(articles)
        logger.info("[crawler] Google News 완료 — %d건", rss_total)

        # ② 화이트리스트 전문 매체 직접 수집
        wl_articles = fetch_full_text_scrapper()
        logger.info("[crawler] 화이트리스트 완료 — %d건", len(wl_articles))

    except Exception:
        logger.exception("[crawler] crawl_once 실패")


def _purge_old_articles() -> None:
    """보존 기한 만료 기사 정리 (NEWS 30일, REPORT/MARKET/EXPERT 60일)."""
    try:
        from .intelligence_db import purge_expired_articles
        n = purge_expired_articles()
        logger.info("[purge] 만료 기사 %d건 삭제", n)
    except Exception:
        logger.exception("[purge] 실패")


def _run_pipeline() -> None:
    """키워드 필터 → 번역 → 태깅 배치를 1회 실행한다 (백그라운드 스레드 전용)."""
    try:
        from .intelligence_pipeline import process_batch
        n = process_batch()
        logger.info("[scheduler] run_pipeline 완료 — %d건 처리", n)
    except Exception:
        logger.exception("[scheduler] run_pipeline 실패")


def _bootstrap_crawl_and_process() -> None:
    """
    서버 기동 후 백그라운드 스레드에서 1회만 실행.
    - raw_articles == 0 이면 즉시 크롤링 강제 실행 (10분 딜레이 없음)
    - 크롤링 완료 후 DeepL 번역 + 키워드 태깅 파이프라인으로 재가공
    FastAPI 워커 쓰레드와 완전 격리 — 이 함수는 반드시 별도 Thread에서만 호출.
    """
    try:
        from .intelligence_db import RawArticle, _engine
        from sqlalchemy.orm import Session
        from sqlalchemy import func

        with Session(_engine) as s:
            raw_count = s.query(func.count(RawArticle.id)).scalar()

        if raw_count == 0:
            logger.info("[bootstrap] DB 비어있음(0건) — 즉시 크롤링 강제 실행")
            _crawl_once()
            with Session(_engine) as s:
                raw_count = s.query(func.count(RawArticle.id)).scalar()
            logger.info("[bootstrap] 크롤링 완료 — raw_articles: %d건", raw_count)
        else:
            logger.info("[bootstrap] 기존 데이터 %d건 — 크롤링 스킵, 재태깅만 실행", raw_count)

        from .intelligence_pipeline import reprocess_all
        logger.info("[bootstrap] 태깅 파이프라인 시작")
        saved = reprocess_all()
        logger.info("[bootstrap] 재가공 완료 — %d건 tagged_articles 저장", saved)
    except Exception:
        logger.exception("[bootstrap] 크롤링+재가공 실패")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.interval import IntervalTrigger
    from datetime import datetime, timedelta

    scheduler = AsyncIOScheduler()

    # 서버 기동 직후 크롤/파이프라인이 즉시 실행돼 API 워커를 마비시키는 현상을 방지한다.
    # next_run_time을 명시해 첫 실행을 10분/20분 뒤로 미루고, 이후 1시간 간격으로 반복한다.
    now = datetime.now()
    # Bootstrap 스레드가 즉시 크롤링을 처리하므로 스케줄러 첫 실행은 1시간 후로 미룬다
    scheduler.add_job(
        _crawl_once,
        IntervalTrigger(hours=1),
        id="crawl",
        next_run_time=now + timedelta(hours=1),
        replace_existing=True,
    )
    scheduler.add_job(
        _run_pipeline,
        IntervalTrigger(hours=1),
        id="pipeline",
        next_run_time=now + timedelta(hours=1, minutes=10),
        replace_existing=True,
    )
    scheduler.add_job(
        _purge_old_articles,
        IntervalTrigger(hours=24),
        id="purge",
        next_run_time=now + timedelta(hours=2),
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "[scheduler] APScheduler 시작 — crawl T+1h / pipeline T+1h10m / purge T+2h, 각 반복"
    )

    # DB 비어있으면 즉시 크롤링 + 재가공 — FastAPI 워커와 완전 격리된 데몬 스레드
    bootstrap_thread = threading.Thread(
        target=_bootstrap_crawl_and_process,
        name="bootstrap-crawl-process",
        daemon=True,
    )
    bootstrap_thread.start()
    logger.info("[bootstrap] 크롤링+재가공 스레드 시작 (daemon, 비차단)")

    yield
    scheduler.shutdown(wait=False)
    logger.info("[scheduler] APScheduler 종료")


app = FastAPI(title="Impact ON ESG Tracker API", version="0.1.2", lifespan=lifespan)

# CORS — 환경변수로 추가 origin 지정 가능
_extra = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://esg-tracker-frontend.vercel.app",
    "https://esg-tracker.onrender.com",
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
    csrd = next((r for r in regulations if r.get("id") == "csrd"), regulations[0] if regulations else {})

    # DB 카운트 실시간 조회
    from .intelligence_db import RawArticle, TaggedArticle, _engine
    from sqlalchemy.orm import Session
    from sqlalchemy import func, distinct
    with Session(_engine) as s:
        raw_count = s.query(func.count(RawArticle.id)).scalar()
        tagged_count = s.query(func.count(TaggedArticle.id)).scalar()
        reg_dist = s.query(TaggedArticle.regulation_tag, func.count(TaggedArticle.id))\
            .group_by(TaggedArticle.regulation_tag).all()
        st_dist = s.query(TaggedArticle.stakeholder_tag, func.count(TaggedArticle.id))\
            .group_by(TaggedArticle.stakeholder_tag).all()

    return {
        "regulation_count": len(regulations),
        "db": {
            "raw_articles": raw_count,
            "tagged_articles": tagged_count,
            "regulation_distribution": dict(reg_dist),
            "stakeholder_distribution": dict(st_dist),
        },
        "csrd_search_queries": csrd.get("search_queries"),
    }

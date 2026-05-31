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

app = FastAPI(title="Impact ON ESG Tracker API", version="0.1.0")

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
    limit: int = Query(default=20, ge=1, le=60),
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
    r = regulations[0]
    return {
        "count": len(regulations),
        "first_id": r.get("id"),
        "search_queries": r.get("search_queries"),
        "news_config": r.get("news_config"),
    }

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .data import fetch_global_news, fetch_news, load_regulations
from .models import DashboardStats, NewsItem, Regulation

app = FastAPI(title="Impact ON ESG Tracker API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/api/regulations")
def get_regulations(
    q: str | None = Query(default=None),
    category: str | None = None,
    status: str | None = None,
    region: str | None = None,
) -> list[dict]:
    regulations = load_regulations()
    if q:
        query = q.lower()
        regulations = [
            r for r in regulations
            if query in (r.get("name_ko","") + r.get("name_en","") + r.get("code","") + r.get("category","") + r.get("summary","")).lower()
        ]
    if category:
        regulations = [r for r in regulations if r.get("category") == category]
    if status:
        regulations = [r for r in regulations if r.get("status") == status]
    if region:
        regulations = [r for r in regulations if r.get("region") == region]
    return regulations

@app.get("/api/regulations/{regulation_id}")
def get_regulation(regulation_id: str) -> dict:
    for r in load_regulations():
        if r.get("id") == regulation_id:
            return r
    raise HTTPException(status_code=404, detail="Regulation not found")

@app.get("/api/regulations/{regulation_id}/news")
def get_regulation_news(regulation_id: str, limit: int = 10) -> list[dict]:
    """규제별 실시간 뉴스 수집"""
    for r in load_regulations():
        if r.get("id") == regulation_id:
            queries = r.get("search_queries", [])
            required = r.get("required_keywords", [])
            exclude = r.get("exclude_keywords", [])
            if not queries:
                # 쿼리 없으면 규제명으로 검색
                queries = [f"{r.get('code','')} regulation 2026", r.get("name_en", "")]
            return fetch_news(queries, required, exclude, limit)
    raise HTTPException(status_code=404, detail="Regulation not found")

@app.get("/api/news")
def get_news(limit: int = 10) -> list[dict]:
    """전체 ESG 뉴스 (대시보드용 실시간)"""
    return fetch_global_news(limit)

@app.get("/api/dashboard/stats")
def get_dashboard_stats() -> dict:
    regulations = load_regulations()
    total = len(regulations)
    urgent = len([r for r in regulations if isinstance(r.get("dDay"), int) and r["dDay"] <= 120])
    high_priority = len([r for r in regulations if r.get("priority") == "높음"])
    readiness_list = [r.get("readiness", 0) for r in regulations if isinstance(r.get("readiness"), int)]
    average_readiness = round(sum(readiness_list) / len(readiness_list)) if readiness_list else 0
    return {
        "totalRegulations": total,
        "urgentTasks": urgent,
        "averageReadiness": average_readiness,
        "highPriority": high_priority,
    }

@app.get("/api/categories")
def get_categories() -> list[str]:
    regs = load_regulations()
    return sorted(set(r.get("category", "") for r in regs if r.get("category")))

@app.get("/api/regions")
def get_regions() -> list[str]:
    regs = load_regulations()
    return sorted(set(r.get("region", "") for r in regs if r.get("region")))

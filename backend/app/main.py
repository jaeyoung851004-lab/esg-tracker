from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .data import NEWS_ITEMS, load_regulations
from .models import DashboardStats, NewsItem, Regulation

app = FastAPI(title="Impact ON ESG Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/api/regulations", response_model=list[Regulation])
def get_regulations(
    q: str | None = Query(default=None),
    category: str | None = None,
    status: str | None = None,
) -> list[dict]:
    regulations = load_regulations()
    if q:
        query = q.lower()
        regulations = [
            item for item in regulations
            if query in " ".join([item["code"], item["title"], item["category"], item["country"], item["industry"], item["summary"]]).lower()
        ]
    if category:
        regulations = [item for item in regulations if item["category"] == category]
    if status:
        regulations = [item for item in regulations if item["status"] == status]
    return regulations

@app.get("/api/regulations/{regulation_id}", response_model=Regulation)
def get_regulation(regulation_id: str) -> dict:
    for item in load_regulations():
        if item["id"] == regulation_id:
            return item
    raise HTTPException(status_code=404, detail="Regulation not found")

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats() -> dict[str, int]:
    regulations = load_regulations()
    total = len(regulations)
    urgent = len([item for item in regulations if item["dDay"] <= 120])
    high_priority = len([item for item in regulations if item["priority"] == "높음"])
    average_readiness = round(sum(item["readiness"] for item in regulations) / total) if total else 0
    return {"totalRegulations": total, "urgentTasks": urgent, "averageReadiness": average_readiness, "highPriority": high_priority}

@app.get("/api/news", response_model=list[NewsItem])
def get_news() -> list[dict[str, str]]:
    return NEWS_ITEMS

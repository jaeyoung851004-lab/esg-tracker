import json
import re
import requests
import feedparser
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT_DIR / "data" / "regulations.json"

# ── 뉴스 수집 헤더 ──────────────────────────
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

CUTOFF_DAYS = 60  # 최근 60일 이내 뉴스만

# ── 출처 한국어 매핑 ──────────────────────────
PUBLISHER_KO = {
    "reuters": "로이터", "financial times": "파이낸셜타임스(FT)", "bloomberg": "블룸버그",
    "wall street journal": "월스트리트저널", "euractiv": "유로액티브", "carbon brief": "카본브리프",
    "esg today": "ESG투데이", "esg news": "ESG뉴스", "responsible investor": "리스폰서블 인베스터",
    "businessgreen": "비즈니스그린", "packaging europe": "패키징 유럽",
    "european commission": "유럽위원회", "council of the eu": "EU 이사회",
    "eur-lex": "EU 관보(EUR-Lex)", "european parliament": "유럽의회",
    "deloitte": "딜로이트", "kpmg": "KPMG", "pwc": "PwC", "ey": "EY",
    "wwf": "WWF", "greenpeace": "그린피스", "cdp": "CDP",
    "latham": "레이섬앤왓킨스", "white & case": "화이트앤케이스",
    "jd supra": "JD수프라", "lexology": "렉솔로지",
}

PUBLISHER_COUNTRY = {
    "european commission": "🇪🇺 EU", "council of the eu": "🇪🇺 EU",
    "european parliament": "🇪🇺 EU", "eur-lex": "🇪🇺 EU",
    "euractiv": "🇧🇪 벨기에",
    "reuters": "🇬🇧 영국", "financial times": "🇬🇧 영국",
    "carbon brief": "🇬🇧 영국", "businessgreen": "🇬🇧 영국",
    "bloomberg": "🇺🇸 미국", "wall street journal": "🇺🇸 미국",
    "esg today": "🇺🇸 미국", "esg news": "🇺🇸 미국",
}

# ── 규제 데이터 로드 ──────────────────────────
@lru_cache(maxsize=1)
def _raw_data() -> dict[str, Any]:
    with DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def _build_official_metadata(legal: dict[str, Any]) -> dict[str, Any]:
    metadata = legal.get("official_metadata") or {}
    sources = legal.get("sources") or []
    primary_source = next(
        (source for source in sources if source.get("type") == "primary"),
        sources[0] if sources else {},
    )
    source_url = metadata.get("source_url") or primary_source.get("url", "")
    celex_match = re.search(r"CELEX:([^&]+)", source_url, re.IGNORECASE)

    return {
        "source_name": metadata.get("source_name") or primary_source.get("org", ""),
        "source_url": source_url,
        "celex_id": metadata.get("celex_id") or (celex_match.group(1) if celex_match else ""),
        "official_document_url": metadata.get("official_document_url") or source_url,
        "last_synced_at": metadata.get("last_synced_at"),
        "last_verified_at": metadata.get("last_verified_at"),
    }


def load_regulations() -> list[dict[str, Any]]:
    """regulations.json 구조를 자동 감지해서 리스트 반환"""
    raw = _raw_data()
    # 기존 구조: {"regulations": [...]}
    if isinstance(raw, dict) and "regulations" in raw:
        regs = raw["regulations"]
        # FastAPI 모델에 맞게 필드 정규화
        result = []
        for r in regs:
            display = r.get("display", {})
            ai = r.get("ai_layer", {})
            legal = r.get("legal", {})
            official_metadata = _build_official_metadata(legal)
            dates = legal.get("dates", {})

            # D-day 계산
            app_date = None
            for key in ["application_date", "entry_into_force", "enforcement_date"]:
                val = dates.get(key, {})
                if isinstance(val, dict):
                    val = val.get("date", "")
                if val and len(str(val)) >= 10 and str(val)[:4].isdigit():
                    try:
                        app_date = datetime.strptime(str(val)[:10], "%Y-%m-%d")
                        break
                    except:
                        continue

            dday = None
            if app_date:
                dday = (app_date - datetime.now()).days

            status_map = {
                "active": "시행 중",
                "phased": "단계적 시행",
                "legislative": "입법 진행",
                "scaled_back": "축소·지연",
                "suspended": "유예/불확실",
            }
            status_tone_map = {
                "active": "success",
                "phased": "partial",
                "legislative": "warning",
                "scaled_back": "delayed",
                "suspended": "uncertain",
            }
            raw_status = display.get("status", "legislative")

            result.append({
                "id": r.get("id", ""),
                "acronym": r.get("acronym", r.get("code", "")),
                "code": r.get("acronym", r.get("code", "")),
                "title": display.get("card_summary", ai.get("situation_summary", r.get("name_ko", ""))[:60]),
                "name_ko": r.get("name_ko", ""),
                "name_en": r.get("name_en", ""),
                "category": r.get("category", ""),
                "legal": {**legal, "official_metadata": official_metadata},
                "ai_layer": ai,
                "history": r.get("history", []),
                "display": display,
                "action_checkpoints": r.get("action_checkpoints", {}),
                "korean_company_note": r.get("korean_company_note", ""),
                "company_mapping": r.get("company_mapping", {}),
                "why_it_matters": r.get("why_it_matters", ""),
                "country": display.get("country", "EU"),
                "region": r.get("region", "eu"),
                "industry": legal.get("thresholds", {}).get("scope", "전 산업")[:50],
                "status": status_map.get(raw_status, display.get("status", "입법 진행")),
                "statusTone": status_tone_map.get(raw_status, "warning"),
                "deadline": str(app_date.date()) if app_date else "",
                "dDay": dday if dday is not None else 999,
                "readiness": display.get("readiness", 0),
                "risk": display.get("penalty_summary", ai.get("key_points", ["—"])[0][:20] if ai.get("key_points") else "—"),
                "priority": display.get("priority", "중간"),
                "summary": ai.get("situation_summary", "")[:200],
                "key_points": ai.get("key_points", []),
                "affected_industries": ai.get("affected_industries", []),
                "news_config": r.get("news_config") or {},
                "search_queries": (r.get("news_config") or {}).get("search_queries") or [],
                "required_keywords": (r.get("news_config") or {}).get("required_keywords") or [],
                "exclude_keywords": (r.get("news_config") or {}).get("exclude_keywords") or [],
                "official_metadata": official_metadata,
                "source_name": official_metadata.get("source_name", ""),
                "source_url": official_metadata.get("source_url", ""),
                "celex_id": official_metadata.get("celex_id", ""),
                "official_document_url": official_metadata.get("official_document_url", ""),
                "last_synced_at": official_metadata.get("last_synced_at"),
                "last_verified_at": official_metadata.get("last_verified_at"),
                "official_url": official_metadata.get("official_document_url") or official_metadata.get("source_url", ""),
                "card_date_label": display.get("card_date_label", ""),
                "card_date_value": display.get("card_date_value", ""),
            })
        return result
    # 새 구조: [...] 직접 리스트
    if isinstance(raw, list):
        return raw
    return []

# ── 뉴스 수집 헬퍼 ──────────────────────────
def _get_publisher_ko(raw: str) -> str:
    rl = raw.lower()
    for k, v in PUBLISHER_KO.items():
        if k in rl:
            return v
    return raw[:30]

def _get_publisher_country(raw: str) -> str:
    rl = raw.lower()
    for k, v in PUBLISHER_COUNTRY.items():
        if k in rl:
            return v
    return "🌐 해외"

def _parse_news_dt(article: dict) -> datetime:
    raw = article.get("date", "") or article.get("published", "") or ""
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except:
        return datetime.min.replace(tzinfo=timezone.utc)

def _is_relevant(article: dict, required: list[str], exclude: list[str]) -> bool:
    text = (article.get("title", "") + " " + article.get("summary", "")).lower()
    if exclude and any(k.lower() in text for k in exclude):
        return False
    if required:
        return any(k.lower() in text for k in required)
    return True

def _format_age(dt: datetime) -> str:
    """datetime → '2일 전' 형식"""
    if dt == datetime.min.replace(tzinfo=timezone.utc):
        return ""
    now = datetime.now(timezone.utc)
    diff = now - dt
    days = diff.days
    if days == 0:
        return "오늘"
    elif days == 1:
        return "1일 전"
    elif days < 7:
        return f"{days}일 전"
    elif days < 14:
        return "1주 전"
    elif days < 21:
        return "2주 전"
    elif days < 30:
        return "3주 전"
    else:
        return f"{days // 30}개월 전"

# ── 실시간 뉴스 수집 ──────────────────────────
def fetch_news(
    queries: list[str],
    required_keywords: list[str],
    exclude_keywords: list[str],
    limit: int = 10,
) -> list[dict]:
    """Google News RSS에서 실시간 뉴스 수집"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=CUTOFF_DAYS)
    raw: list[dict] = []

    for q in queries[:5]:
        url = (
            "https://news.google.com/rss/search"
            f"?q={requests.utils.quote(str(q))}"
            "&hl=en-US&gl=US&ceid=US:en"
        )
        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                continue
            feed = feedparser.parse(r.content)
            for e in feed.entries[:60]:
                pub = e.get("source", {}).get("title", "") or "Google News"
                article = {
                    "source": pub,
                    "source_ko": _get_publisher_ko(pub),
                    "country": _get_publisher_country(pub),
                    "title": e.get("title", "").split(" - ")[0],
                    "url": e.get("link", ""),
                    "date": e.get("published", "") or e.get("updated", ""),
                    "summary": (e.get("summary", "") or "")[:300],
                }
                if _parse_news_dt(article) >= cutoff:
                    raw.append(article)
        except:
            continue

    # 관련성 필터
    filtered = [a for a in raw if _is_relevant(a, required_keywords, exclude_keywords)]
    if not filtered:
        filtered = raw  # 필터 완화

    # 중복 제거
    seen: set = set()
    uniq: list[dict] = []
    for a in filtered:
        key = re.sub(r"\s+", " ", a["title"].lower()).strip()[:80]
        if key not in seen:
            seen.add(key)
            uniq.append(a)

    # 최신순 정렬
    uniq.sort(key=_parse_news_dt, reverse=True)

    # age 필드 추가
    result = []
    for a in uniq[:limit]:
        dt = _parse_news_dt(a)
        result.append({
            "id": re.sub(r"[^a-z0-9]", "-", a["title"].lower())[:40],
            "source": a["source"],
            "source_ko": a["source_ko"],
            "country": a["country"],
            "title": a["title"],
            "url": a["url"],
            "date": a["date"][:10] if a["date"] else "",
            "age": _format_age(dt),
            "summary": a["summary"],
        })
    return result

def fetch_global_news(limit: int = 10) -> list[dict]:
    """전체 ESG 규제 뉴스 (대시보드용)"""
    queries = [
        "ESG regulation 2026 EU compliance",
        "CSRD CSDDD CBAM update 2026",
        "sustainability reporting directive 2026",
        "EU green deal regulation news",
        "ESG disclosure rule update",
    ]
    required = ["ESG", "regulation", "directive", "CSRD", "CSDDD", "CBAM", "ESPR", "sustainability", "disclosure"]
    exclude = ["stock", "earnings", "share price", "quarterly results"]
    return fetch_news(queries, required, exclude, limit)
    
def get_dashboard_stats() -> dict:
    """대시보드 통계"""
    regulations = load_regulations()
    total = len(regulations)
    
    active_or_phased = sum(
        1 for r in regulations
        if r.get("statusTone") in ("success", "partial")
    )
    watch_items = sum(
        1 for r in regulations
        if r.get("statusTone") in ("delayed", "uncertain", "warning")
    )
    news_enabled = sum(
        1 for r in regulations
        if r.get("search_queries")
    )

    return {
        "totalRegulations": total,
        "activeOrPhased": active_or_phased,
        "watchItems": watch_items,
        "officialSources": total,
        "newsEnabled": news_enabled,
    }

def list_regulation_summaries() -> list[dict]:
    """규제 요약 목록 (API용)"""
    regulations = load_regulations()
    result = []
    for r in regulations:
        result.append({
            "id": r.get("id", ""),
            "code": r.get("code", ""),
            "title": r.get("name_ko", r.get("title", "")),
            "titleEn": r.get("name_en", ""),
            "category": r.get("category", ""),
            "region": r.get("region", "eu"),
            "industry": r.get("industry", "전 산업"),
            "status": r.get("status", ""),
            "statusKey": r.get("statusTone", ""),
            "statusTone": r.get("statusTone", ""),
            "deadline": r.get("deadline", ""),
            "deadlineLabel": r.get("card_date_label", ""),
            "dDay": r.get("dDay"),
            "risk": r.get("risk", ""),
            "priority": r.get("priority", "중간"),
            "summary": r.get("summary", ""),
            "whyItMatters": r.get("summary", ""),
            "affectedIndustries": r.get("affected_industries", []),
            "sourceCount": len(r.get("legal", {}).get("sources", [])) if r.get("legal") else 0,
            "historyCount": len(r.get("history", [])),
            "checkpointCount": sum(
                len(value) if isinstance(value, list) else 1
                for value in (r.get("action_checkpoints") or {}).values()
            ),
            "newsQueryCount": len(r.get("search_queries", [])),
            "officialMetadata": r.get("official_metadata", {}),
            "sourceName": r.get("source_name", ""),
            "sourceUrl": r.get("source_url", ""),
            "celexId": r.get("celex_id", ""),
            "officialDocumentUrl": r.get("official_document_url", ""),
            "lastSyncedAt": r.get("last_synced_at"),
            "lastVerifiedAt": r.get("last_verified_at"),
        })
    return result

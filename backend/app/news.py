from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
from typing import Any

import feedparser
import requests

LOOKBACK_DAYS = 30
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

SOURCE_REGION_RULES = {
    "eur-lex": "EU",
    "european commission": "EU",
    "european parliament": "EU",
    "council of the eu": "EU",
    "euractiv": "EU",
    "reuters": "글로벌",
    "financial times": "영국",
    "ft.com": "영국",
    "guardian": "영국",
    "businessgreen": "영국",
    "bloomberg": "미국",
    "wall street journal": "미국",
    "wsj": "미국",
    "politico": "미국/EU",
    "trellis": "미국",
    "esg today": "미국",
    "esg news": "미국",
    "carbon herald": "글로벌",
    "nikkei": "일본",
}

SOURCE_TYPE_RULES = {
    "공식기관": [
        "eur-lex", "european commission", "european parliament",
        "council of the eu", "official journal", "efrag", "sec", "carb",
    ],
    "로펌/자문": [
        "latham", "white & case", "dla piper", "clifford chance",
        "baker mckenzie", "linklaters", "freshfields", "norton rose",
        "lexology", "jd supra",
    ],
    "컨설팅": ["deloitte", "pwc", "ey", "kpmg", "accenture"],
    "산업협회": ["association", "federation", "industry group", "trade body", "chamber"],
    "NGO": ["wwf", "greenpeace", "clientearth", "cdp", "somo"],
}

NEWS_TYPE_RULES = {
    "정책 발표": [
        "regulation", "directive", "law", "guidance", "delegated act",
        "implementing act", "published", "adoption", "adopted", "vote",
        "proposal", "omnibus",
    ],
    "시행 연기": ["delay", "delayed", "postpone", "postponed", "extension"],
    "기업 대응": [
        "compliance", "comply", "reporting", "prepare",
        "implementation", "deadline",
    ],
    "산업 반응": [
        "industry", "burden", "cost", "concern", "lobby",
        "supplier", "supply chain",
    ],
    "시장 동향": ["market", "software", "platform", "startup", "tool", "service"],
}

HIGH_SIGNAL_KEYWORDS = [
    "implementation", "deadline", "guidance", "delegated act",
    "vote", "adoption", "adopted", "delay", "compliance", "reporting", "scope 3",
]

LOW_QUALITY_KEYWORDS = [
    "webinar", "sponsored", "award", "job", "career", "internship",
    "stock", "share price", "earnings", "annual report",
]

SOURCE_IMPORTANCE = {
    "공식기관": 35,
    "로펌/자문": 24,
    "컨설팅": 22,
    "산업협회": 20,
    "NGO": 18,
    "언론": 16,
}

RawArticle = dict[str, Any]
NewsArticle = dict[str, Any]


def _get_news_config(regulation: dict[str, Any]) -> dict[str, Any]:
    """news_config가 null이면 빈 dict 반환"""
    return regulation.get("news_config") or {}


def _get_search_queries(regulation: dict[str, Any]) -> list[str]:
    """news_config.search_queries → fallback: search_queries 직접"""
    return (
        _get_news_config(regulation).get("search_queries")
        or regulation.get("search_queries")
        or []
    )


def _get_exclude_keywords(regulation: dict[str, Any]) -> list[str]:
    return (
        _get_news_config(regulation).get("exclude_keywords")
        or regulation.get("exclude_keywords")
        or []
    )


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_title(title: str) -> str:
    return normalize_whitespace(re.sub(r"\s+-\s+[^-]+$", "", title or ""))


def normalize_title_key(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", normalize_title(title).lower()).strip()


def parse_published_at(raw_value: str) -> datetime | None:
    if not raw_value:
        return None
    try:
        parsed = parsedate_to_datetime(raw_value)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    except Exception:
        pass
    try:
        return datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
    except Exception:
        return None


def format_published_at(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat().replace("+00:00", "Z")


def age_label(published_at: datetime) -> str:
    delta_days = max((datetime.now(UTC) - published_at).days, 0)
    if delta_days == 0:
        return "오늘"
    if delta_days == 1:
        return "1일 전"
    if delta_days < 7:
        return f"{delta_days}일 전"
    if delta_days < 31:
        return f"{max(delta_days // 7, 1)}주 전"
    return published_at.strftime("%Y.%m.%d")


def detect_source_region(source: str) -> str:
    lowered = source.lower()
    for keyword, region in SOURCE_REGION_RULES.items():
        if keyword in lowered:
            return region
    return "글로벌"


def detect_source_type(source: str) -> str:
    lowered = source.lower()
    for source_type, keywords in SOURCE_TYPE_RULES.items():
        if any(keyword in lowered for keyword in keywords):
            return source_type
    return "언론"


def detect_news_type(title: str, summary: str) -> str:
    text = f"{title} {summary}".lower()
    best_type = "시장 동향"
    best_score = 0
    for news_type, keywords in NEWS_TYPE_RULES.items():
        score = sum(1 for keyword in keywords if keyword in text)
        if score > best_score:
            best_type = news_type
            best_score = score
    return best_type


def detect_actor_type(source_type: str, news_type: str, text: str) -> str:
    lowered = text.lower()
    if source_type == "공식기관":
        return "정부/규제기관"
    if source_type == "NGO":
        return "NGO"
    if source_type == "로펌/자문":
        return "로펌/자문"
    if source_type == "컨설팅":
        return "시장/솔루션"
    if source_type == "산업협회":
        return "산업/협회"
    if "investor" in lowered or "asset manager" in lowered or "bank" in lowered:
        return "투자자/금융"
    if news_type == "기업 대응":
        return "기업"
    return "시장/솔루션"


def build_regulation_terms(regulation: dict[str, Any]) -> list[str]:
    queries = _get_search_queries(regulation)[:4]
    title_ko = regulation.get("name_ko", "")
    title_en = regulation.get("name_en", "")
    acronym = regulation.get("acronym", regulation.get("code", ""))

    terms = [title_ko, title_en, acronym]
    terms.extend(re.sub(r'"', "", query) for query in queries)

    return [normalize_whitespace(term).lower() for term in terms if term]


def score_relevance(
    title: str,
    summary: str,
    source: str,
    regulation: dict[str, Any],
) -> int:
    text = f"{title} {summary}".lower()
    score = 0

    for term in build_regulation_terms(regulation):
        if not term:
            continue
        if term in text:
            score += 18 if len(term) > 10 else 12
        else:
            for part in term.split():
                if len(part) > 3 and part in text:
                    score += 4

    acronym = regulation.get("acronym", regulation.get("code", ""))
    if acronym and acronym.lower() in text:
        score += 15

    score += sum(6 for keyword in HIGH_SIGNAL_KEYWORDS if keyword in text)
    score -= sum(12 for keyword in LOW_QUALITY_KEYWORDS if keyword in text)

    source_type = detect_source_type(source)
    score += SOURCE_IMPORTANCE.get(source_type, 0)

    return max(score, 0)


def score_importance(
    source: str,
    source_type: str,
    news_type: str,
    published_at: datetime,
) -> int:
    score = SOURCE_IMPORTANCE.get(source_type, 12)
    lowered = source.lower()

    if "reuters" in lowered or "bloomberg" in lowered or "financial times" in lowered:
        score += 10

    if news_type in {"정책 발표", "시행 연기"}:
        score += 12
    elif news_type == "기업 대응":
        score += 6

    age_days = max((datetime.now(UTC) - published_at).days, 0)
    if age_days <= 3:
        score += 12
    elif age_days <= 7:
        score += 8
    elif age_days <= 14:
        score += 4

    return score


def fetch_google_news(query: str, lookback_days: int = LOOKBACK_DAYS) -> list[RawArticle]:
    url = (
        "https://news.google.com/rss/search"
        f"?q={requests.utils.quote(query)}"
        "&hl=en-US&gl=US&ceid=US:en"
    )
    response = requests.get(url, headers=HEADERS, timeout=12)
    response.raise_for_status()

    feed = feedparser.parse(response.content)
    cutoff = datetime.now(UTC) - timedelta(days=lookback_days)
    articles: list[RawArticle] = []

    for entry in feed.entries[:30]:
        published_raw = entry.get("published", "") or entry.get("updated", "")
        published_at = parse_published_at(published_raw)
        if not published_at or published_at < cutoff:
            continue

        source = entry.get("source", {}).get("title", "") or "Google News"
        article = {
            "title": normalize_title(entry.get("title", "")),
            "summary": normalize_whitespace(
                re.sub(r"<[^>]+>", "", entry.get("summary", "") or "")
            ),
            "url": entry.get("link", ""),
            "source": source,
            "publishedAt": published_at,
        }

        if article["title"] and article["url"]:
            articles.append(article)

    return articles


def build_news_item(
    article: RawArticle,
    regulation: dict[str, Any],
) -> NewsArticle:
    title = article["title"]
    summary = article["summary"]
    source = article["source"]
    published_at = article["publishedAt"]
    source_type = detect_source_type(source)
    news_type = detect_news_type(title, summary)
    actor_type = detect_actor_type(source_type, news_type, f"{title} {summary}")
    relevance_score = score_relevance(title, summary, source, regulation)
    importance_score = score_importance(source, source_type, news_type, published_at)
    acronym = regulation.get("acronym", regulation.get("code", regulation["id"]))

    return {
        "id": f"{regulation['id']}:{requests.utils.quote(article['url'], safe='')}",
        "title": title,
        "titleKo": title,
        "originalTitle": title,
        "url": article["url"],
        "source": source,
        "sourceRegion": detect_source_region(source),
        "publishedAt": format_published_at(published_at),
        "age": age_label(published_at),
        "regulationId": regulation["id"],
        "relatedRegulationIds": [regulation["id"]],
        "relatedRegulationNames": [
            acronym or regulation.get("name_ko") or regulation["id"]
        ],
        "sourceType": source_type,
        "actorType": actor_type,
        "newsType": news_type,
        "relevanceScore": relevance_score,
        "importanceScore": importance_score,
        "summary": summary,
    }


def dedupe_and_merge(items: list[NewsArticle]) -> list[NewsArticle]:
    merged_by_url: dict[str, NewsArticle] = {}

    for item in items:
        existing = merged_by_url.get(item["url"])
        if not existing:
            merged_by_url[item["url"]] = item
            continue
        existing["relatedRegulationIds"] = sorted(
            set(existing["relatedRegulationIds"]) | set(item["relatedRegulationIds"])
        )
        existing["relatedRegulationNames"] = sorted(
            set(existing["relatedRegulationNames"]) | set(item["relatedRegulationNames"])
        )
        existing["relevanceScore"] = max(existing["relevanceScore"], item["relevanceScore"])
        existing["importanceScore"] = max(existing["importanceScore"], item["importanceScore"])
        if item["publishedAt"] > existing["publishedAt"]:
            existing["publishedAt"] = item["publishedAt"]
            existing["age"] = item["age"]

    merged_by_title: dict[str, NewsArticle] = {}
    for item in merged_by_url.values():
        key = normalize_title_key(item["title"])
        existing = merged_by_title.get(key)
        if not existing:
            merged_by_title[key] = item
            continue
        existing["relatedRegulationIds"] = sorted(
            set(existing["relatedRegulationIds"]) | set(item["relatedRegulationIds"])
        )
        existing["relatedRegulationNames"] = sorted(
            set(existing["relatedRegulationNames"]) | set(item["relatedRegulationNames"])
        )
        existing["relevanceScore"] = max(existing["relevanceScore"], item["relevanceScore"])
        existing["importanceScore"] = max(existing["importanceScore"], item["importanceScore"])
        if item["publishedAt"] > existing["publishedAt"]:
            merged_by_title[key] = item

    deduped = list(merged_by_title.values())
    deduped.sort(
        key=lambda item: (
            item["publishedAt"],
            item["importanceScore"],
            item["relevanceScore"],
        ),
        reverse=True,
    )
    return deduped


def fetch_regulation_news_items(
    regulation: dict[str, Any],
    limit: int = 20,
    lookback_days: int = LOOKBACK_DAYS,
) -> list[NewsArticle]:
    queries = _get_search_queries(regulation)[:4]
    exclude_keywords = [k.lower() for k in _get_exclude_keywords(regulation)]

    collected: list[NewsArticle] = []
    for query in queries:
        try:
            for article in fetch_google_news(query, lookback_days=lookback_days):
                haystack = f"{article['title']} {article['summary']}".lower()
                if any(keyword in haystack for keyword in exclude_keywords):
                    continue
         item = build_news_item(article, regulation)
collected.append(item)
        except Exception:
            continue

    return dedupe_and_merge(collected)[:limit]


def build_region_counts(items: list[NewsArticle]) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for item in items:
        region = item["sourceRegion"] or "기타"
        counts[region] = counts.get(region, 0) + 1
    return [
        {"region": region, "count": count}
        for region, count in sorted(counts.items(), key=lambda row: row[1], reverse=True)
    ]


def fetch_regulation_news(
    regulation: dict[str, Any],
    limit: int = 20,
    lookback_days: int = LOOKBACK_DAYS,
) -> dict[str, Any]:
    items = fetch_regulation_news_items(regulation, limit=limit, lookback_days=lookback_days)
    acronym = regulation.get("acronym", regulation.get("code", regulation["id"]))

    return {
        "items": items,
        "count": len(items),
        "lookbackDays": lookback_days,
        "generatedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "regulationId": regulation["id"],
        "availableRegulations": [
            {
                "id": regulation["id"],
                "code": acronym.upper(),
                "name": regulation.get("name_ko") or regulation.get("name_en") or regulation["id"],
                "count": len(items),
            }
        ],
        "regionCounts": build_region_counts(items),
    }


def fetch_all_rss_articles(
    regulations: list[dict[str, Any]],
    limit: int = 20,
    lookback_days: int = LOOKBACK_DAYS,
) -> dict[str, Any]:
    collected: list[NewsArticle] = []
    available_regulations: list[dict[str, Any]] = []
    per_regulation_limit = max(6, min(limit, 10))

    for regulation in regulations:
        items = fetch_regulation_news_items(
            regulation,
            limit=per_regulation_limit,
            lookback_days=lookback_days,
        )
        if items:
            acronym = regulation.get("acronym", regulation.get("code", regulation["id"]))
            available_regulations.append(
                {
                    "id": regulation["id"],
                    "code": acronym.upper(),
                    "name": regulation.get("name_ko") or regulation.get("name_en") or regulation["id"],
                    "count": len(items),
                }
            )
            collected.extend(items)

    merged_items = dedupe_and_merge(collected)[:limit]

    return {
        "items": merged_items,
        "count": len(merged_items),
        "lookbackDays": lookback_days,
        "generatedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "regulationId": None,
        "availableRegulations": available_regulations,
        "regionCounts": build_region_counts(merged_items),
    }

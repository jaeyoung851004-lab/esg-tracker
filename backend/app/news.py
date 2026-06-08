from __future__ import annotations

import re
import copy
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.parse import urlparse

import feedparser
import requests

LOOKBACK_DAYS = 30
MAX_RSS_ENTRIES_PER_QUERY = 50
DEFAULT_PER_REGULATION_LIMIT = 30
DEFAULT_ALL_NEWS_LIMIT = 150
MAX_ALL_NEWS_LIMIT = 150
DEFAULT_MIN_RELEVANCE_SCORE = 4
HIGH_RELEVANCE_SIGNAL_BYPASS_SCORE = 30
ALL_NEWS_MIN_ITEMS_PER_REGULATION = 5
RSS_REQUEST_TIMEOUT_SECONDS = 8
MAX_RSS_QUERY_WORKERS = 8
NEWS_CACHE_TTL_SECONDS = 20 * 60
GOOGLE_NEWS_LOCALES = (
    ("en-US", "US", "US:en"),
    ("en-GB", "GB", "GB:en"),
)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

KNOWN_MEDIA_REGION_RULES = (
    ("mpr china certification", "중국"),
    ("the astana times", "카자흐스탄"),
    ("times of india", "인도"),
    ("the hindu", "인도"),
    ("down to earth", "인도"),
    ("china daily", "중국"),
    ("wall street journal", "미국"),
    ("mexico business news", "멕시코"),
    ("medical device and diagnostic industry", "미국"),
    ("mddionline", "미국"),
    ("the shop mag", "미국"),
    ("theshopmag", "미국"),
    ("discovery alert", "호주"),
    ("innovation news network", "영국"),
    ("automotive world", "영국"),
    ("the ai journal", "영국"),
    ("printindustry.news", "글로벌"),
    ("green retail world", "영국"),
    ("wood central", "호주"),
    ("foodnavigator", "EU/유럽"),
    ("daily coffee news", "미국"),
    ("packaging gateway", "영국"),
    ("packaging digest", "미국"),
    ("american recycler", "미국"),
    ("resource recycling", "미국"),
    ("plastics news", "미국"),
    ("plasticstoday", "미국"),
    ("recycling today", "미국"),
    ("recycling magazine", "독일"),
    ("packaging europe", "EU/벨기에"),
    ("recycling international", "네덜란드"),
    ("auto recycling world", "영국"),
    ("packaging insights", "EU/유럽"),
    ("sustainable packaging news", "영국"),
    ("financial times", "영국"),
    ("the guardian", "영국"),
    ("linklaters", "영국"),
    ("ropes & gray", "미국"),
    ("bloomberg", "미국"),
    ("globenewswire", "미국"),
    ("yahoo finance", "미국"),
    ("mercom capital", "미국"),
    ("wwd", "미국"),
    ("greenbiz", "미국"),
    ("trellis", "미국"),
    ("esg today", "미국"),
    ("esg news", "미국"),
    ("sustainable views", "영국"),
    ("grocery trade news", "영국"),
    ("engineer live", "영국"),
    ("euronews", "EU/유럽"),
    ("eurometal", "EU/벨기에"),
    ("euractiv", "EU/벨기에"),
    ("fps public health", "EU/벨기에"),
    ("politico", "미국/EU"),
    ("mongabay", "미국"),
    ("reuters", "영국"),
    ("msn", "미국"),
    ("guardian", "영국"),
    ("bbc", "영국"),
    ("wsj", "미국"),
    ("ft.com", "영국"),
    ("businessgreen", "영국"),
    ("jd supra", "미국"),
    ("iflr", "영국"),
    ("lexology", "글로벌/자문"),
    ("openpr", "글로벌/보도자료"),
    ("indexbox", "글로벌/시장"),
    ("s&p global", "글로벌/시장"),
    ("kpmg", "글로벌/컨설팅"),
    ("deloitte", "글로벌/컨설팅"),
    ("pwc", "글로벌/컨설팅"),
    ("grant thornton", "글로벌/컨설팅"),
    ("ey", "글로벌/컨설팅"),
    ("nikkei", "일본"),
    ("hankyung", "한국"),
    ("chosun", "한국"),
    ("joongang", "한국"),
    ("yonhap", "한국"),
    ("impacton", "한국"),
    ("fibre2fashion", "인도"),
    ("solarquarter", "인도"),
    ("al circle", "인도"),
    ("bizzbuzz", "인도"),
    ("hktdc", "중국"),
    ("harianbasis", "인도네시아"),
    ("nation thailand", "태국"),
    ("tüv süd", "독일"),
    ("tuv sud", "독일"),
    ("taiyangnews", "독일"),
    ("il sole 24 ore", "이탈리아"),
    ("notimérica", "스페인/라틴아메리카"),
    ("notimerica", "스페인/라틴아메리카"),
    ("agriland", "아일랜드"),
    ("africa sustainability matters", "아프리카"),
    ("textile today", "방글라데시"),
    ("batteries news", "EU/유럽"),
    ("carbon herald", "미국"),
    ("eur-lex", "EU"),
    ("european commission", "EU"),
    ("european parliament", "EU"),
    ("council of the eu", "EU"),
)

TLD_REGION_RULES = (
    (".co.uk", "영국"),
    (".org.uk", "영국"),
    (".ac.uk", "영국"),
    (".uk", "영국"),
    (".in", "인도"),
    (".cn", "중국"),
    (".kr", "한국"),
    (".jp", "일본"),
    (".de", "독일"),
    (".fr", "프랑스"),
    (".it", "이탈리아"),
    (".ie", "아일랜드"),
    (".bd", "방글라데시"),
    (".hk", "중국"),
    (".th", "태국"),
    (".kz", "카자흐스탄"),
    (".mx", "멕시코"),
    (".nz", "뉴질랜드"),
    (".za", "남아프리카공화국"),
    (".sg", "싱가포르"),
    (".eu", "EU/유럽"),
    (".br", "브라질"),
    (".id", "인도네시아"),
    (".vn", "베트남"),
    (".gh", "가나"),
    (".tr", "터키"),
    (".ca", "캐나다"),
    (".au", "호주"),
)

MEDIA_REGION_KEYWORD_RULES = (
    ("indiatimes", "인도"),
    ("thehindu", "인도"),
    ("downtoearth", "인도"),
    ("india", "인도"),
    ("xinhua", "중국"),
    ("scmp", "중국"),
    ("china", "중국"),
    ("korea", "한국"),
    ("korean", "한국"),
    ("japan", "일본"),
    ("brazil", "브라질"),
    ("globo", "브라질"),
    ("indonesia", "인도네시아"),
    ("jakarta", "인도네시아"),
    ("tempo.co", "인도네시아"),
    ("vietnam", "베트남"),
    ("ghana", "가나"),
    ("turkey", "터키"),
    ("turkiye", "터키"),
    ("kazakhstan", "카자흐스탄"),
    ("mexico", "멕시코"),
    ("singapore", "싱가포르"),
    ("new zealand", "뉴질랜드"),
    ("south africa", "남아프리카공화국"),
    ("canada", "캐나다"),
    ("australia", "호주"),
    ("europe", "EU/유럽"),
    ("euro", "EU/유럽"),
)

SOURCE_TYPE_RULES = {
    "공식기관": [
        "eur-lex", "european commission", "european parliament",
        "council of the eu", "official journal", "efrag", "sec", "carb",
    ],
    "로펌": [
        "latham", "white & case", "dla piper", "clifford chance",
        "baker mckenzie", "linklaters", "freshfields", "norton rose",
        "lexology", "jd supra", "watson farley", "hogan lovells",
        "ropes & gray", "dentons", "iflr",
    ],
    "컨설팅/자문": ["deloitte", "pwc", "ey", "kpmg", "accenture", "grant thornton"],
    "산업협회": ["association", "federation", "industry group", "trade body", "chamber"],
    "NGO/시민단체": ["wwf", "greenpeace", "clientearth", "cdp", "somo", "mongabay"],
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

REACTION_TYPE_RULES = {
    "정책 발표/개정": [
        "adopted", "adoption", "approved", "approval", "passed", "vote",
        "published", "proposal", "proposed", "guidance", "delegated act",
        "implementing act", "working plan", "regulation update", "directive",
        "regulation", "official journal", "consultation",
    ],
    "시행 지연/완화": [
        "delay", "delayed", "postpone", "postponed", "defer", "deferred",
        "extension", "extended", "simplification", "relief", "rollback",
        "pause", "watered down", "weakened", "relaxation", "omnibus",
        "scaled back", "eased",
    ],
    "반발/우려": [
        "concern", "concerns", "criticize", "criticised", "criticized",
        "opposition", "pushback", "backlash", "burden", "cost",
        "challenge", "warning", "risk", "lobby", "oppose",
        "urge", "criticism", "push back", "warns",
    ],
    "대응 준비": [
        "compliance", "comply", "preparing", "prepare", "readiness",
        "implementation", "roadmap", "framework", "deadline", "reporting",
        "disclosure", "due diligence", "audit", "traceability", "assessment",
    ],
    "공급망 변화": [
        "supply chain", "supplier", "suppliers", "sourcing", "procurement",
        "exporter", "exporters", "value chain", "traceability", "origin",
        "raw material", "recycled material", "recycled content", "closed-loop",
        "reshoring", "interoperability",
    ],
    "투자/사업 확대": [
        "investment", "invest", "funding", "factory", "plant", "expansion",
        "partnership", "joint venture", "acquisition", "contract",
        "commercial", "scale up", "launches new service", "expand", "scale",
        "facility", "raise", "capacity",
    ],
    "신제품/솔루션": [
        "launch", "unveil", "software", "platform", "solution", "tool",
        "service", "module", "registry", "passport", "data exchange",
        "interoperability", "verification", "tracking", "coding standard",
        "digital product passport",
    ],
    "소송/제재": [
        "lawsuit", "sue", "sued", "fine", "penalty", "enforcement",
        "investigation", "sanction", "sanctions", "legal challenge",
        "court", "complaint",
    ],
    "해설/가이드": [
        "explainer", "guide", "what companies need to know", "overview",
        "analysis", "briefing", "client alert", "legal update",
        "what it means", "how to prepare", "q&a", "explained",
        "practical framework", "checklist", "webinar",
    ],
}

HIGH_SIGNAL_KEYWORDS = [
    "implementation", "deadline", "guidance", "delegated act",
    "vote", "adoption", "adopted", "delay", "compliance", "reporting", "scope 3",
    "supply chain", "traceability", "recycled content", "due diligence",
]

LOW_QUALITY_KEYWORDS = [
    "webinar", "sponsored", "award", "job", "career", "internship",
    "stock", "share price", "earnings", "annual report", "market report",
    "market analysis", "market forecast", "market size", "top 5 companies",
    "product launch", "product promotion", "press release", "openpr",
    "conference agenda", "live update", "generic market report",
]

LOW_QUALITY_EXCLUDE_KEYWORDS = [
    "openpr",
    "press release",
    "sponsored",
    "market report",
    "research report",
    "market forecast",
    "market size",
    "market to reach",
    "market by 2030",
    "market by 2035",
    "cagr",
    "top 5 companies",
]

SOURCE_IMPORTANCE = {
    "공식기관": 35,
    "로펌": 24,
    "컨설팅/자문": 22,
    "산업협회": 20,
    "NGO/시민단체": 18,
    "언론": 16,
}

RawArticle = dict[str, Any]
NewsArticle = dict[str, Any]

CacheEntry = dict[str, Any]
_CACHE_LOCK = threading.RLock()
_QUERY_ARTICLE_CACHE: dict[tuple[Any, ...], CacheEntry] = {}
_REGULATION_ITEMS_CACHE: dict[tuple[Any, ...], CacheEntry] = {}
_ALL_NEWS_CACHE: dict[tuple[Any, ...], CacheEntry] = {}


def _cache_get(
    cache: dict[tuple[Any, ...], CacheEntry],
    key: tuple[Any, ...],
    allow_stale: bool = False,
) -> Any | None:
    now = time.monotonic()
    with _CACHE_LOCK:
        entry = cache.get(key)
        if not entry:
            return None
        if allow_stale or entry["expires_at"] > now:
            return copy.deepcopy(entry["value"])
    return None


def _cache_set(
    cache: dict[tuple[Any, ...], CacheEntry],
    key: tuple[Any, ...],
    value: Any,
    ttl_seconds: int = NEWS_CACHE_TTL_SECONDS,
) -> None:
    with _CACHE_LOCK:
        cache[key] = {
            "expires_at": time.monotonic() + ttl_seconds,
            "value": copy.deepcopy(value),
        }


def _get_news_config(regulation: dict[str, Any]) -> dict[str, Any]:
    return regulation.get("news_config") or {}


def _get_search_queries(regulation: dict[str, Any]) -> list[str]:
    values = (
        _get_news_config(regulation).get("search_queries")
        or regulation.get("search_queries")
        or []
    )
    return dedupe_preserve_order(
        normalize_whitespace(str(value)) for value in values if str(value).strip()
    )


def _get_config_list(
    regulation: dict[str, Any],
    key: str,
    legacy_key: str | None = None,
) -> list[str]:
    config = _get_news_config(regulation)
    values = config.get(key) or []
    if legacy_key:
        values = [*values, *(config.get(legacy_key) or regulation.get(legacy_key) or [])]
    return [normalize_whitespace(str(value)) for value in values if str(value).strip()]


def _get_exclude_keywords(regulation: dict[str, Any]) -> list[str]:
    return _get_config_list(regulation, "exclude_keywords")


def _get_required_keywords(regulation: dict[str, Any]) -> list[str]:
    return _get_config_list(regulation, "required_keywords")


def _get_positive_keywords(regulation: dict[str, Any]) -> list[str]:
    return _get_config_list(regulation, "positive_keywords", "required_keywords")


def _get_industry_terms(regulation: dict[str, Any]) -> list[str]:
    return _get_config_list(regulation, "industry_terms")


def _get_negative_keywords(regulation: dict[str, Any]) -> list[str]:
    return _get_config_list(regulation, "negative_keywords")


def _get_overlap_keywords(regulation: dict[str, Any]) -> list[str]:
    return _get_config_list(regulation, "overlap_keywords")


def _get_context_keywords(regulation: dict[str, Any]) -> list[str]:
    return _get_config_list(regulation, "context_keywords")


def _get_trusted_sources(regulation: dict[str, Any]) -> list[str]:
    return _get_config_list(regulation, "trusted_sources")


def _get_min_score(regulation: dict[str, Any]) -> int:
    try:
        return int(_get_news_config(regulation).get("min_score", DEFAULT_MIN_RELEVANCE_SCORE))
    except (TypeError, ValueError):
        return DEFAULT_MIN_RELEVANCE_SCORE


def _get_max_items(regulation: dict[str, Any]) -> int:
    try:
        return int(_get_news_config(regulation).get("max_items", DEFAULT_PER_REGULATION_LIMIT))
    except (TypeError, ValueError):
        return DEFAULT_PER_REGULATION_LIMIT


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def dedupe_preserve_order(values: list[str] | tuple[str, ...] | Any) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        normalized = normalize_whitespace(str(value))
        key = normalized.lower()
        if not normalized or key in seen:
            continue
        seen.add(key)
        result.append(normalized)
    return result


def normalize_title(title: str) -> str:
    return normalize_whitespace(re.sub(r"\s+-\s+[^-]+$", "", title or ""))


def normalize_title_key(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", normalize_title(title).lower()).strip()


def normalize_article_url_key(url: str) -> str:
    return re.sub(r"[?#].*$", "", normalize_whitespace(url).lower())


def raw_article_key(article: RawArticle) -> str:
    url_key = normalize_article_url_key(article.get("url", ""))
    if url_key:
        return f"url:{url_key}"
    return f"title:{normalize_title_key(article.get('title', ''))}"


def news_item_key(item: NewsArticle) -> str:
    url_key = normalize_article_url_key(item.get("url", ""))
    if url_key:
        return f"url:{url_key}"
    return f"title:{normalize_title_key(item.get('title', ''))}"


def regulation_filter_cache_signature(regulation: dict[str, Any]) -> tuple[Any, ...]:
    return (
        _get_min_score(regulation),
        tuple(keyword.lower() for keyword in _get_required_keywords(regulation)),
        tuple(keyword.lower() for keyword in _get_positive_keywords(regulation)),
        tuple(keyword.lower() for keyword in _get_industry_terms(regulation)),
        tuple(keyword.lower() for keyword in _get_negative_keywords(regulation)),
        tuple(keyword.lower() for keyword in _get_exclude_keywords(regulation)),
        tuple(keyword.lower() for keyword in _get_trusted_sources(regulation)),
        tuple(keyword.lower() for keyword in _get_overlap_keywords(regulation)),
        tuple(keyword.lower() for keyword in _get_context_keywords(regulation)),
    )


def regulation_cache_key(
    regulation: dict[str, Any],
    lookback_days: int,
) -> tuple[Any, ...]:
    return (
        "regulation-items",
        regulation.get("id", ""),
        tuple(query.lower() for query in _get_search_queries(regulation)),
        regulation_filter_cache_signature(regulation),
        lookback_days,
    )


def all_news_cache_key(
    regulations: list[dict[str, Any]],
    lookback_days: int,
) -> tuple[Any, ...]:
    return (
        "all-news",
        lookback_days,
        tuple(
            (
                regulation.get("id", ""),
                tuple(query.lower() for query in _get_search_queries(regulation)),
                regulation_filter_cache_signature(regulation),
                _get_max_items(regulation),
            )
            for regulation in regulations
        ),
    )


def text_has_keyword(text: str, keyword: str) -> bool:
    normalized_keyword = normalize_whitespace(keyword).lower()
    if not normalized_keyword:
        return False

    if re.search(r"\W", normalized_keyword):
        return normalized_keyword in text

    return re.search(rf"\b{re.escape(normalized_keyword)}\b", text) is not None


def keyword_matches(text: str, keywords: list[str]) -> list[str]:
    return [keyword for keyword in keywords if text_has_keyword(text, keyword)]


def score_keywords(
    text: str,
    keywords: list[str],
    exact_score: int,
    partial_score: int = 0,
) -> int:
    score = 0
    for keyword in keywords:
        normalized_keyword = normalize_whitespace(keyword).lower()
        if not normalized_keyword:
            continue
        if text_has_keyword(text, normalized_keyword):
            score += exact_score
            continue
        if partial_score:
            score += sum(
                partial_score
                for part in normalized_keyword.split()
                if len(part) > 3 and text_has_keyword(text, part)
            )
    return score


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


def extract_domain(url: str) -> str:
    if not url:
        return ""
    try:
        parsed = urlparse(url if "://" in url else f"https://{url}")
    except Exception:
        return ""
    host = (parsed.netloc or parsed.path).lower().split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    if host in {"google.com", "news.google.com"} or host.endswith(".google.com"):
        return ""
    return host


def detect_region_from_tld(domain: str) -> str | None:
    if not domain:
        return None
    for suffix, region in TLD_REGION_RULES:
        if domain.endswith(suffix):
            return region
    return None


def detect_source_region(
    source: str,
    source_url: str = "",
    article_url: str = "",
) -> str:
    source_domain = extract_domain(source_url)
    article_domain = extract_domain(article_url)
    searchable = " ".join(
        part
        for part in [source, source_domain, source_url, article_domain, article_url]
        if part
    ).lower()

    for keyword, region in KNOWN_MEDIA_REGION_RULES:
        if keyword in searchable:
            return region

    for domain in [source_domain, article_domain]:
        tld_region = detect_region_from_tld(domain)
        if tld_region:
            return tld_region

    for keyword, region in MEDIA_REGION_KEYWORD_RULES:
        if keyword in searchable:
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


def detect_reaction_type(title: str, summary: str) -> str:
    text = f"{title} {summary}".lower()
    best_type = "기타"
    best_score = 0
    for reaction_type, keywords in REACTION_TYPE_RULES.items():
        score = sum(1 for keyword in keywords if keyword in text)
        if score > best_score:
            best_type = reaction_type
            best_score = score
    return best_type


def detect_actor_type(source_type: str, reaction_type: str, text: str) -> str:
    lowered = text.lower()
    if source_type == "공식기관":
        return "정부/규제기관"
    if source_type == "NGO/시민단체":
        return "NGO/시민단체"
    if source_type == "로펌":
        return "로펌"
    if source_type == "컨설팅/자문":
        return "컨설팅/자문"
    if source_type == "산업협회":
        return "산업협회"

    if any(keyword in lowered for keyword in [
        "commission", "parliament", "council", "government", "ministry",
        "regulator", "authority", "agency", "official journal",
    ]):
        return "정부/규제기관"
    if any(keyword in lowered for keyword in [
        "association", "federation", "coalition", "alliance", "industry group",
        "trade body", "chamber",
    ]):
        return "산업협회"
    if any(keyword in lowered for keyword in [
        "ngo", "campaign", "civil society", "greenpeace", "wwf", "clientearth",
        "environmental group",
    ]):
        return "NGO/시민단체"
    if any(keyword in lowered for keyword in [
        "investor", "asset manager", "bank", "lender", "fund", "insurer",
        "finance", "financial institution",
    ]):
        return "투자자/금융"
    if any(keyword in lowered for keyword in [
        "university", "research", "institute", "laboratory", "think tank",
        "study", "scientist",
    ]):
        return "연구기관"
    if any(keyword in lowered for keyword in [
        "software", "platform", "solution", "tool", "service provider",
        "technology provider", "startup", "data exchange", "registry",
    ]) or reaction_type == "신제품/솔루션":
        return "기술공급업체"
    if any(keyword in lowered for keyword in [
        "company", "companies", "manufacturer", "supplier", "exporter",
        "importer", "automaker", "oem", "brand", "retailer", "producer",
        "industry", "factory", "plant",
    ]) or reaction_type in {"대응 준비", "공급망 변화", "투자/사업 확대"}:
        return "기업"
    return "언론/기타"


def build_regulation_terms(regulation: dict[str, Any]) -> list[str]:
    queries = _get_search_queries(regulation)
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
    source_text = source.lower()
    score = 0

    for term in build_regulation_terms(regulation):
        if not term:
            continue
        if term in text:
            score += 3 if len(term) > 10 else 2
        else:
            for part in term.split():
                if len(part) > 3 and text_has_keyword(text, part):
                    score += 1

    acronym = regulation.get("acronym", regulation.get("code", ""))
    if acronym and text_has_keyword(text, acronym.lower()):
        score += 3

    score += score_keywords(text, _get_positive_keywords(regulation), exact_score=3, partial_score=1)
    score += score_keywords(text, _get_industry_terms(regulation), exact_score=2, partial_score=1)
    score += score_keywords(text, HIGH_SIGNAL_KEYWORDS, exact_score=1)
    score -= score_keywords(text, _get_negative_keywords(regulation), exact_score=2)
    score -= score_keywords(text, LOW_QUALITY_KEYWORDS, exact_score=1)

    if any(keyword.lower() in source_text for keyword in _get_trusted_sources(regulation)):
        score += 3

    source_type = detect_source_type(source)
    if source_type in {"공식기관", "로펌", "컨설팅/자문", "산업협회"}:
        score += 1

    return score


def score_importance(
    source: str,
    source_type: str,
    reaction_type: str,
    published_at: datetime,
    title: str = "",
    summary: str = "",
) -> int:
    score = SOURCE_IMPORTANCE.get(source_type, 12)
    source_lowered = source.lower()
    text = f"{title} {summary} {source}".lower()

    if any(keyword in source_lowered for keyword in [
        "reuters", "bloomberg", "financial times", "euractiv",
        "responsible investor", "esg today",
    ]):
        score += 10

    if reaction_type in {"정책 발표/개정", "시행 지연/완화"}:
        score += 12
    elif reaction_type in {"반발/우려", "공급망 변화", "소송/제재"}:
        score += 8
    elif reaction_type == "투자/사업 확대":
        score += 7
    elif reaction_type == "대응 준비":
        score += 6
    elif reaction_type in {"신제품/솔루션", "해설/가이드"}:
        score += 3

    score -= score_keywords(text, LOW_QUALITY_KEYWORDS, exact_score=4, partial_score=2)

    age_days = max((datetime.now(UTC) - published_at).days, 0)
    if age_days <= 3:
        score += 12
    elif age_days <= 7:
        score += 8
    elif age_days <= 14:
        score += 4

    return score


def fetch_google_news(query: str, lookback_days: int = LOOKBACK_DAYS) -> list[RawArticle]:
    normalized_query = normalize_whitespace(query)
    cache_key = ("google-news-query", normalized_query.lower(), lookback_days)
    cached = _cache_get(_QUERY_ARTICLE_CACHE, cache_key)
    if cached is not None:
        return cached

    cutoff = datetime.now(UTC) - timedelta(days=lookback_days)
    articles: list[RawArticle] = []
    seen_article_keys: set[str] = set()
    had_request_error = False
    query_with_window = f"{normalized_query} when:{lookback_days}d"

    for hl, gl, ceid in GOOGLE_NEWS_LOCALES:
        url = (
            "https://news.google.com/rss/search"
            f"?q={requests.utils.quote(query_with_window)}"
            f"&hl={hl}&gl={gl}&ceid={ceid}"
        )
        try:
            response = requests.get(url, headers=HEADERS, timeout=RSS_REQUEST_TIMEOUT_SECONDS)
            response.raise_for_status()
        except Exception as e:
            had_request_error = True
            print(f"Google News fetch error [{gl}] '{query}': {e}")
            continue

        feed = feedparser.parse(response.content)
        for entry in feed.entries[:MAX_RSS_ENTRIES_PER_QUERY]:
            published_raw = entry.get("published", "") or entry.get("updated", "")
            published_at = parse_published_at(published_raw)
            if not published_at or published_at < cutoff:
                continue

            source_meta = entry.get("source", {}) or {}
            source = source_meta.get("title", "") or "Google News"
            article = {
                "title": normalize_title(entry.get("title", "")),
                "summary": normalize_whitespace(
                    re.sub(r"<[^>]+>", "", entry.get("summary", "") or "")
                ),
                "url": entry.get("link", ""),
                "sourceUrl": source_meta.get("href", "") or source_meta.get("url", ""),
                "source": source,
                "publishedAt": published_at,
            }

            if article["title"] and article["url"]:
                article_key = raw_article_key(article)
                if article_key in seen_article_keys:
                    continue
                seen_article_keys.add(article_key)
                articles.append(article)

    if articles or not had_request_error:
        _cache_set(_QUERY_ARTICLE_CACHE, cache_key, articles)
        return articles

    stale = _cache_get(_QUERY_ARTICLE_CACHE, cache_key, allow_stale=True)
    if stale is not None:
        return stale
    return articles


def fetch_articles_by_query(
    queries: list[str],
    lookback_days: int = LOOKBACK_DAYS,
) -> dict[str, list[RawArticle]]:
    unique_queries = dedupe_preserve_order(queries)
    if not unique_queries:
        return {}

    articles_by_query: dict[str, list[RawArticle]] = {}
    workers = min(MAX_RSS_QUERY_WORKERS, len(unique_queries))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_query = {
            executor.submit(fetch_google_news, query, lookback_days): query
            for query in unique_queries
        }
        for future in as_completed(future_to_query):
            query = future_to_query[future]
            try:
                articles_by_query[query] = future.result()
            except Exception as e:
                print(f"RSS query worker error '{query}': {e}")
                articles_by_query[query] = []
    return articles_by_query


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
    reaction_type = detect_reaction_type(title, summary)
    actor_type = detect_actor_type(source_type, reaction_type, f"{title} {summary} {source}")
    relevance_score = score_relevance(title, summary, source, regulation)
    importance_score = score_importance(
        source,
        source_type,
        reaction_type,
        published_at,
        title,
        summary,
    )
    acronym = regulation.get("acronym", regulation.get("code", regulation["id"]))

    return {
        "id": f"{regulation['id']}:{requests.utils.quote(article['url'], safe='')}",
        "title": title,
        "titleKo": title,
        "originalTitle": title,
        "url": article["url"],
        "source": source,
        "sourceRegion": detect_source_region(
            source,
            article.get("sourceUrl", ""),
            article.get("url", ""),
        ),
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
        "reactionType": reaction_type,
        "relevanceScore": relevance_score,
        "importanceScore": importance_score,
        "summary": summary,
    }


def article_matches_trusted_source(
    article: RawArticle,
    regulation: dict[str, Any],
) -> bool:
    source_text = " ".join(
        value
        for value in [
            article.get("source", ""),
            article.get("sourceUrl", ""),
            article.get("url", ""),
        ]
        if value
    ).lower()
    return bool(
        source_text
        and any(keyword.lower() in source_text for keyword in _get_trusted_sources(regulation))
    )


def has_required_or_positive_signal(
    text: str,
    regulation: dict[str, Any],
) -> bool:
    signal_keywords = dedupe_preserve_order(
        [*_get_required_keywords(regulation), *_get_positive_keywords(regulation)]
    )
    return bool(keyword_matches(text, signal_keywords))


def has_required_context_for_overlap(
    text: str,
    regulation: dict[str, Any],
) -> bool:
    overlap_keywords = _get_overlap_keywords(regulation)
    context_keywords = _get_context_keywords(regulation)
    if not overlap_keywords or not context_keywords:
        return True
    if not keyword_matches(text, overlap_keywords):
        return True
    return bool(keyword_matches(text, context_keywords))


def get_article_exclusion_reason(
    article: RawArticle,
    regulation: dict[str, Any],
    relevance_score: int | None = None,
) -> str | None:
    text = f"{article['title']} {article['summary']} {article['source']}".lower()
    if keyword_matches(
        text,
        [*_get_exclude_keywords(regulation), *LOW_QUALITY_EXCLUDE_KEYWORDS],
    ):
        return "excluded_by_keyword"

    if relevance_score is None:
        return None

    has_signal = has_required_or_positive_signal(text, regulation)
    can_bypass_signal_gate = (
        article_matches_trusted_source(article, regulation)
        or relevance_score >= HIGH_RELEVANCE_SIGNAL_BYPASS_SCORE
    )

    if not has_required_context_for_overlap(text, regulation):
        return "no_required_signal"

    if not has_signal and not can_bypass_signal_gate:
        return "no_required_signal"

    if relevance_score < _get_min_score(regulation):
        return "below_min_score"

    return None


def is_obvious_false_positive(
    article: RawArticle,
    regulation: dict[str, Any],
    relevance_score: int | None = None,
) -> bool:
    return get_article_exclusion_reason(article, regulation, relevance_score) is not None


def merge_duplicate_item(existing: NewsArticle, item: NewsArticle) -> NewsArticle:
    related_ids = sorted(
        set(existing["relatedRegulationIds"]) | set(item["relatedRegulationIds"])
    )
    related_names = sorted(
        set(existing["relatedRegulationNames"]) | set(item["relatedRegulationNames"])
    )

    if (
        item["relevanceScore"],
        item["importanceScore"],
        item["publishedAt"],
    ) > (
        existing["relevanceScore"],
        existing["importanceScore"],
        existing["publishedAt"],
    ):
        existing["id"] = item["id"]
        existing["regulationId"] = item["regulationId"]

    existing["relatedRegulationIds"] = related_ids
    existing["relatedRegulationNames"] = related_names
    existing["relevanceScore"] = max(existing["relevanceScore"], item["relevanceScore"])
    existing["importanceScore"] = max(existing["importanceScore"], item["importanceScore"])
    if item["publishedAt"] > existing["publishedAt"]:
        existing["publishedAt"] = item["publishedAt"]
        existing["age"] = item["age"]

    return existing


def dedupe_and_merge(items: list[NewsArticle]) -> list[NewsArticle]:
    merged_by_url: dict[str, NewsArticle] = {}

    for item in items:
        existing = merged_by_url.get(item["url"])
        if not existing:
            merged_by_url[item["url"]] = item
            continue
        merge_duplicate_item(existing, item)

    merged_by_title: dict[str, NewsArticle] = {}
    for item in merged_by_url.values():
        key = normalize_title_key(item["title"])
        existing = merged_by_title.get(key)
        if not existing:
            merged_by_title[key] = item
            continue
        merge_duplicate_item(existing, item)

    deduped = list(merged_by_title.values())
    deduped.sort(
        key=lambda item: (
            item["relevanceScore"],
            item["importanceScore"],
            item["publishedAt"],
        ),
        reverse=True,
    )
    return deduped


def build_balanced_all_news_items(
    items_by_regulation: dict[str, list[NewsArticle]],
    regulations: list[dict[str, Any]],
    limit: int,
) -> list[NewsArticle]:
    if not items_by_regulation or limit <= 0:
        return []

    selected_by_key: dict[str, NewsArticle] = {}

    def add_item(item: NewsArticle) -> None:
        key = news_item_key(item)
        existing = selected_by_key.get(key)
        if existing:
            merge_duplicate_item(existing, item)
            return
        selected_by_key[key] = copy.deepcopy(item)

    if limit >= len(regulations):
        guaranteed_count = min(
            ALL_NEWS_MIN_ITEMS_PER_REGULATION,
            max(limit // max(len(regulations), 1), 0),
        )
    else:
        guaranteed_count = 0

    for regulation in regulations:
        if len(selected_by_key) >= limit:
            break
        for item in items_by_regulation.get(regulation["id"], [])[:guaranteed_count]:
            if len(selected_by_key) >= limit:
                break
            add_item(item)

    remaining_pool = [
        item
        for regulation in regulations
        for item in items_by_regulation.get(regulation["id"], [])
    ]
    for item in dedupe_and_merge(remaining_pool):
        if len(selected_by_key) >= limit:
            break
        add_item(item)

    selected_items = list(selected_by_key.values())
    selected_items.sort(
        key=lambda item: (
            item["relevanceScore"],
            item["importanceScore"],
            item["publishedAt"],
        ),
        reverse=True,
    )
    return selected_items[:limit]


def new_quality_stats(regulation: dict[str, Any]) -> dict[str, Any]:
    return {
        "regulationId": regulation.get("id", ""),
        "rawCount": 0,
        "uniqueCount": 0,
        "filterPassCount": 0,
        "returnedCount": 0,
        "minScore": _get_min_score(regulation),
        "excluded": {
            "excluded_by_keyword": 0,
            "below_min_score": 0,
            "no_required_signal": 0,
            "duplicate": 0,
        },
    }


def log_news_quality_stats(stats: dict[str, Any]) -> None:
    excluded = stats["excluded"]
    print(
        "news_quality "
        f"regulation={stats['regulationId']} "
        f"raw={stats['rawCount']} "
        f"unique={stats['uniqueCount']} "
        f"filter_pass={stats['filterPassCount']} "
        f"returned={stats['returnedCount']} "
        f"min_score={stats['minScore']} "
        f"excluded_by_keyword={excluded['excluded_by_keyword']} "
        f"below_min_score={excluded['below_min_score']} "
        f"no_required_signal={excluded['no_required_signal']} "
        f"duplicate={excluded['duplicate']}"
    )


def build_regulation_news_items_from_articles(
    regulation: dict[str, Any],
    articles_by_query: dict[str, list[RawArticle]],
    limit: int = 20,
) -> list[NewsArticle]:
    item_limit = min(
        max(limit, _get_max_items(regulation), DEFAULT_PER_REGULATION_LIMIT),
        MAX_ALL_NEWS_LIMIT,
    )
    collected: list[NewsArticle] = []
    seen_raw_article_keys: set[str] = set()
    stats = new_quality_stats(regulation)

    for query in _get_search_queries(regulation):
        for article in articles_by_query.get(query, []):
            stats["rawCount"] += 1
            article_key = raw_article_key(article)
            if article_key in seen_raw_article_keys:
                stats["excluded"]["duplicate"] += 1
                continue
            seen_raw_article_keys.add(article_key)
            stats["uniqueCount"] += 1

            item = build_news_item(article, regulation)
            exclusion_reason = get_article_exclusion_reason(
                article,
                regulation,
                item["relevanceScore"],
            )
            if exclusion_reason:
                stats["excluded"][exclusion_reason] += 1
                continue
            collected.append(item)

    deduped = dedupe_and_merge(collected)
    stats["filterPassCount"] = len(collected)
    stats["excluded"]["duplicate"] += max(len(collected) - len(deduped), 0)
    stats["returnedCount"] = min(len(deduped), item_limit)
    log_news_quality_stats(stats)
    return deduped[:item_limit]


def fetch_regulation_news_items(
    regulation: dict[str, Any],
    limit: int = 20,
    lookback_days: int = LOOKBACK_DAYS,
) -> list[NewsArticle]:
    cache_key = regulation_cache_key(regulation, lookback_days)
    cached = _cache_get(_REGULATION_ITEMS_CACHE, cache_key)
    if cached is not None:
        return cached[: min(max(limit, _get_max_items(regulation), DEFAULT_PER_REGULATION_LIMIT), MAX_ALL_NEWS_LIMIT)]

    queries = _get_search_queries(regulation)
    articles_by_query = fetch_articles_by_query(queries, lookback_days=lookback_days)
    items = build_regulation_news_items_from_articles(
        regulation,
        articles_by_query,
        limit=limit,
    )

    if items:
        _cache_set(_REGULATION_ITEMS_CACHE, cache_key, items)
        return items

    stale = _cache_get(_REGULATION_ITEMS_CACHE, cache_key, allow_stale=True)
    if stale is not None:
        return stale[: min(max(limit, _get_max_items(regulation), DEFAULT_PER_REGULATION_LIMIT), MAX_ALL_NEWS_LIMIT)]

    _cache_set(_REGULATION_ITEMS_CACHE, cache_key, items)
    return items


def build_available_regulations(
    regulations: list[dict[str, Any]],
    items: list[NewsArticle],
) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for item in items:
        regulation_ids = item.get("relatedRegulationIds") or [item.get("regulationId")]
        for regulation_id in regulation_ids:
            if not regulation_id:
                continue
            counts[regulation_id] = counts.get(regulation_id, 0) + 1

    available_regulations: list[dict[str, Any]] = []
    for regulation in regulations:
        acronym = regulation.get("acronym", regulation.get("code", regulation["id"]))
        available_regulations.append(
            {
                "id": regulation["id"],
                "code": acronym.upper(),
                "name": regulation.get("name_ko") or regulation.get("name_en") or regulation["id"],
                "count": counts.get(regulation["id"], 0),
            }
        )
    return available_regulations


def build_region_counts(items: list[NewsArticle]) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for item in items:
        region = item["sourceRegion"] or "기타"
        counts[region] = counts.get(region, 0) + 1
    return [
        {"region": region, "count": count}
        for region, count in sorted(counts.items(), key=lambda row: row[1], reverse=True)
    ]


def build_type_counts(items: list[NewsArticle], field: str) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for item in items:
        value = item.get(field) or "기타"
        counts[value] = counts.get(value, 0) + 1
    return [
        {"type": value, "count": count}
        for value, count in sorted(counts.items(), key=lambda row: row[1], reverse=True)
    ]


def build_top_sources(items: list[NewsArticle], limit: int = 10) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for item in items:
        source = item.get("source") or "미확인"
        counts[source] = counts.get(source, 0) + 1
    return [
        {"source": source, "count": count}
        for source, count in sorted(counts.items(), key=lambda row: row[1], reverse=True)[:limit]
    ]


def build_news_counts(items: list[NewsArticle]) -> dict[str, Any]:
    return {
        "regionCounts": build_region_counts(items),
        "reactionTypeCounts": build_type_counts(items, "reactionType"),
        "actorTypeCounts": build_type_counts(items, "actorType"),
        "sourceTypeCounts": build_type_counts(items, "sourceType"),
        "topSources": build_top_sources(items),
    }


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
        **build_news_counts(items),
    }


def fetch_all_rss_articles(
    regulations: list[dict[str, Any]],
    limit: int = 20,
    lookback_days: int = LOOKBACK_DAYS,
) -> dict[str, Any]:
    cache_key = all_news_cache_key(regulations, lookback_days)
    cached = _cache_get(_ALL_NEWS_CACHE, cache_key)
    if cached is not None:
        return cached

    items_by_regulation: dict[str, list[NewsArticle]] = {}
    all_queries: list[str] = []

    for regulation in regulations:
        all_queries.extend(_get_search_queries(regulation))

    articles_by_query = fetch_articles_by_query(all_queries, lookback_days=lookback_days)

    for regulation in regulations:
        reg_cache_key = regulation_cache_key(regulation, lookback_days)
        items = _cache_get(_REGULATION_ITEMS_CACHE, reg_cache_key)
        if items is None:
            items = build_regulation_news_items_from_articles(
                regulation,
                articles_by_query,
                limit=_get_max_items(regulation),
            )
            if items:
                _cache_set(_REGULATION_ITEMS_CACHE, reg_cache_key, items)
            else:
                items = _cache_get(_REGULATION_ITEMS_CACHE, reg_cache_key, allow_stale=True) or []
        items_by_regulation[regulation["id"]] = items

    merged_limit = min(max(limit, DEFAULT_ALL_NEWS_LIMIT), MAX_ALL_NEWS_LIMIT)
    merged_items = build_balanced_all_news_items(
        items_by_regulation,
        regulations,
        merged_limit,
    )

    response = {
        "items": merged_items,
        "count": len(merged_items),
        "lookbackDays": lookback_days,
        "generatedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "regulationId": None,
        "availableRegulations": build_available_regulations(regulations, merged_items),
        **build_news_counts(merged_items),
    }
    if merged_items:
        _cache_set(_ALL_NEWS_CACHE, cache_key, response)
        return response

    stale = _cache_get(_ALL_NEWS_CACHE, cache_key, allow_stale=True)
    if stale is not None:
        return stale

    _cache_set(_ALL_NEWS_CACHE, cache_key, response)
    return response

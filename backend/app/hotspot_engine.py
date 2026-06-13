"""
Section 4.5 — 글로벌 핫스팟(Volume Spike) 통계 엔진

수학적 기준:
    spike_pct = (recent_7d_count - baseline_avg) / max(baseline_avg, 1) * 100
    baseline_avg = 최근 35일 중 최신 7일을 제외한 28일 구간의 일평균 * 7

is_spike = True  ←  spike_pct >= SPIKE_THRESHOLD_PCT (기본 100 %)

국가 코드는 raw_articles.source_name 을 news.py 의 KNOWN_MEDIA_REGION_RULES 와
동일한 매핑 테이블로 ISO-2 코드로 변환하여 집계한다.
특정 국가에 고정되지 않는 동적 집계 구조다.
"""
from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .intelligence_db import RawArticle, TaggedArticle, _engine
from .news import detect_source_region

logger = logging.getLogger(__name__)

SPIKE_THRESHOLD_PCT: float = 100.0   # 변동률 기준
RECENT_DAYS: int = 7
BASELINE_WINDOW_DAYS: int = 28       # 비교 기준 기간


# ── 미디어 출처명 → ISO-2 직접 매핑 (인도/베트남/독일/중국·HK 우선 처리) ─
# source_name 에 아래 키워드가 포함되면 detect_source_region 보다 우선 적용
_SOURCE_NAME_TO_ISO: dict[str, str] = {
    # 인도
    "times of india": "IN", "economic times": "IN", "india times": "IN",
    "live mint": "IN", "livemint": "IN", "the mint": "IN",
    "financial express": "IN", "the financial express": "IN",
    "the hindu": "IN", "hindustan times": "IN",
    "business standard": "IN", "business line": "IN",
    "ndtv": "IN", "india today": "IN", "deccan herald": "IN",
    "tribune india": "IN", "indian express": "IN",
    "moneycontrol": "IN", "zee business": "IN",
    # 베트남
    "vnexpress": "VN", "vietnam news": "VN",
    "voice of vietnam": "VN", "hanoi times": "VN",
    "vietnam investment review": "VN", "vov.vn": "VN",
    "thanh nien": "VN", "tuoi tre": "VN",
    "saigon times": "VN",
    # 독일
    "deutsche welle": "DE", "dw.com": "DE",
    "handelsblatt": "DE", "der spiegel": "DE",
    "frankfurter allgemeine": "DE", "faz.net": "DE",
    "sueddeutsche": "DE", "tagesspiegel": "DE",
    "wirtschaftswoche": "DE",
    # 홍콩
    "south china morning post": "HK", "scmp": "HK",
    # 중국
    "china daily": "CN", "xinhua": "CN", "xinhuanet": "CN",
    "global times": "CN", "people's daily": "CN", "caixin": "CN",
    # 한국
    "korea herald": "KR", "korea times": "KR",
    "yonhap": "KR", "joongang": "KR", "chosun": "KR",
    "hankook": "KR", "maeil business": "KR",
}


def source_name_to_iso(source_name: str) -> str:
    """
    미디어 출처명 기반 ISO-2 코드 반환.
    명시 도메인 매핑 → detect_source_region 폴백 순서.
    """
    if not source_name:
        return "ZZ"
    name_lower = source_name.lower().strip()
    for key, iso in _SOURCE_NAME_TO_ISO.items():
        if key in name_lower:
            return iso
    region = detect_source_region(source_name)
    return region_to_iso(region)


# ── 국가명(한국어·영어) → ISO-2 매핑 ─────────────────────────────────────
# news.py 의 detect_source_region() 이 반환하는 한국어 지역명을 ISO-2로 변환
_REGION_TO_ISO: dict[str, str] = {
    "한국": "KR", "일본": "JP", "중국": "CN", "인도": "IN",
    "미국": "US", "영국": "GB", "독일": "DE", "프랑스": "FR",
    "이탈리아": "IT", "스페인": "ES", "네덜란드": "NL",
    "벨기에": "BE", "아일랜드": "IE", "스웨덴": "SE", "핀란드": "FI",
    "덴마크": "DK", "노르웨이": "NO", "스위스": "CH", "오스트리아": "AT",
    "폴란드": "PL", "체코": "CZ", "포르투갈": "PT", "그리스": "GR",
    "호주": "AU", "뉴질랜드": "NZ", "캐나다": "CA", "브라질": "BR",
    "멕시코": "MX", "아르헨티나": "AR", "칠레": "CL",
    "남아프리카공화국": "ZA", "나이지리아": "NG", "가나": "GH",
    "이집트": "EG", "케냐": "KE",
    "인도네시아": "ID", "베트남": "VN", "태국": "TH",
    "말레이시아": "MY", "싱가포르": "SG", "필리핀": "PH",
    "방글라데시": "BD", "파키스탄": "PK", "스리랑카": "LK",
    "터키": "TR", "사우디아라비아": "SA", "아랍에미리트": "AE",
    "이스라엘": "IL", "이란": "IR",
    "러시아": "RU", "우크라이나": "UA",
    "카자흐스탄": "KZ",
    "EU/유럽": "EU", "EU/벨기에": "EU", "미국/EU": "EU",
    "글로벌": "ZZ", "글로벌/자문": "ZZ", "글로벌/시장": "ZZ",
    "글로벌/컨설팅": "ZZ", "글로벌/보도자료": "ZZ",
    "홍콩": "HK",
}

# ISO-2 → 국가 표시명
_ISO_TO_NAME: dict[str, str] = {
    "KR": "South Korea", "JP": "Japan", "CN": "China", "IN": "India",
    "US": "United States", "GB": "United Kingdom", "DE": "Germany",
    "FR": "France", "IT": "Italy", "ES": "Spain", "NL": "Netherlands",
    "BE": "Belgium", "IE": "Ireland", "SE": "Sweden", "FI": "Finland",
    "DK": "Denmark", "NO": "Norway", "CH": "Switzerland", "AT": "Austria",
    "PL": "Poland", "CZ": "Czech Republic", "PT": "Portugal", "GR": "Greece",
    "AU": "Australia", "NZ": "New Zealand", "CA": "Canada", "BR": "Brazil",
    "MX": "Mexico", "AR": "Argentina", "CL": "Chile",
    "ZA": "South Africa", "NG": "Nigeria", "GH": "Ghana",
    "EG": "Egypt", "KE": "Kenya",
    "ID": "Indonesia", "VN": "Vietnam", "TH": "Thailand",
    "MY": "Malaysia", "SG": "Singapore", "PH": "Philippines",
    "BD": "Bangladesh", "PK": "Pakistan", "LK": "Sri Lanka",
    "TR": "Turkey", "SA": "Saudi Arabia", "AE": "UAE",
    "IL": "Israel", "IR": "Iran",
    "RU": "Russia", "UA": "Ukraine", "KZ": "Kazakhstan",
    "EU": "European Union", "ZZ": "Global", "HK": "Hong Kong",
}


def region_to_iso(region: str) -> str:
    """한국어 지역명 → ISO-2 코드. 알 수 없으면 'ZZ'(글로벌) 반환."""
    return _REGION_TO_ISO.get(region, "ZZ")


def iso_to_display_name(iso: str) -> str:
    return _ISO_TO_NAME.get(iso, iso)


# ── 볼륨 집계 ─────────────────────────────────────────────────────────────

@dataclass
class CountryRegulationVolume:
    """(country_iso, regulation_tag) 쌍의 기간별 기사 수."""
    country_iso: str
    country_name: str
    regulation_tag: str
    recent_count: int = 0        # 최근 7일
    baseline_count: int = 0      # 이전 28일
    baseline_avg: float = 0.0    # 일평균 * 7 (same 7-day unit)
    spike_pct: float = 0.0
    is_spike: bool = False


def _fetch_volume_rows(
    session: Session,
    since: datetime,
    regulation_filter: str | None,
) -> list[tuple[str, str, str]]:
    """
    (source_name, regulation_tag, created_at_date) 튜플 목록 반환.
    source_name 은 news.py 가 탐지한 지역명(한국어)이 저장된 raw_articles.source_name 이 아니라
    tagged_articles.regulation_tag 와 raw_articles 을 조인해서 가져온다.
    source_name → ISO 변환은 호출자가 수행한다.
    """
    q = (
        session.query(
            RawArticle.source_name,
            TaggedArticle.regulation_tag,
            RawArticle.created_at,
        )
        .join(TaggedArticle, TaggedArticle.article_id == RawArticle.id)
        .filter(RawArticle.created_at >= since)
    )
    if regulation_filter:
        q = q.filter(TaggedArticle.regulation_tag == regulation_filter)
    return q.all()


def compute_hotspots(
    regulation_filter: str | None = None,
    spike_threshold: float = SPIKE_THRESHOLD_PCT,
) -> list[CountryRegulationVolume]:
    """
    Section 4.5 볼륨 스파이크 알고리즘.
    모든 (country, regulation) 쌍에 대해 spike_pct 를 계산하고
    is_spike 플래그를 부여한다. 결과는 spike_pct 내림차순 정렬.
    """
    now = datetime.now(UTC)
    recent_start = now - timedelta(days=RECENT_DAYS)
    baseline_start = now - timedelta(days=RECENT_DAYS + BASELINE_WINDOW_DAYS)

    with Session(_engine) as session:
        rows = _fetch_volume_rows(session, baseline_start, regulation_filter)

    if not rows:
        return []

    # (country_iso, regulation_tag) → {recent, baseline}
    recent_counts: dict[tuple[str, str], int] = defaultdict(int)
    baseline_counts: dict[tuple[str, str], int] = defaultdict(int)

    for source_name, reg_tag, created_at in rows:
        if created_at is None:
            continue
        # SQLite 은 naive datetime 으로 저장되므로 UTC 처리
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=UTC)

        # 미디어 출처명 → ISO 변환 (도메인 매핑 우선, 폴백: detect_source_region)
        iso = source_name_to_iso(source_name or "")
        key = (iso, reg_tag or "ESG")

        if created_at >= recent_start:
            recent_counts[key] += 1
        else:
            baseline_counts[key] += 1

    all_keys = set(recent_counts) | set(baseline_counts)
    results: list[CountryRegulationVolume] = []

    for country_iso, reg_tag in all_keys:
        key = (country_iso, reg_tag)
        recent = recent_counts.get(key, 0)
        baseline = baseline_counts.get(key, 0)
        # baseline 을 7일 단위로 정규화
        baseline_avg = (baseline / BASELINE_WINDOW_DAYS) * RECENT_DAYS

        if baseline_avg < 1 and recent == 0:
            continue  # 양쪽 모두 0이면 무의미

        spike_pct = (recent - baseline_avg) / max(baseline_avg, 1) * 100.0

        results.append(
            CountryRegulationVolume(
                country_iso=country_iso,
                country_name=iso_to_display_name(country_iso),
                regulation_tag=reg_tag,
                recent_count=recent,
                baseline_count=baseline,
                baseline_avg=round(baseline_avg, 2),
                spike_pct=round(spike_pct, 2),
                is_spike=spike_pct >= spike_threshold,
            )
        )

    results.sort(key=lambda r: r.spike_pct, reverse=True)
    return results


def get_matrix_signal_counts(
    regulation_tags: list[str],
    stakeholder_tags: list[str],
) -> dict[str, dict[str, int]]:
    """
    5대 규제 × 5대 이해관계자 매트릭스의 DB 기반 실시간 신호 카운트.
    반환: {regulation_tag: {stakeholder_tag: count}}
    """
    with Session(_engine) as session:
        rows = (
            session.query(
                TaggedArticle.regulation_tag,
                TaggedArticle.stakeholder_tag,
                func.count(func.distinct(TaggedArticle.article_id)),
            )
            .filter(
                TaggedArticle.regulation_tag != "unclassified",
                TaggedArticle.stakeholder_tag != "unclassified",
            )
            .group_by(
                TaggedArticle.regulation_tag,
                TaggedArticle.stakeholder_tag,
            )
            .all()
        )

    matrix: dict[str, dict[str, int]] = {
        reg: {st: 0 for st in stakeholder_tags}
        for reg in regulation_tags
    }

    for reg_tag, st_tag, count in rows:
        if reg_tag in matrix and st_tag in (matrix.get(reg_tag) or {}):
            matrix[reg_tag][st_tag] = count

    return matrix

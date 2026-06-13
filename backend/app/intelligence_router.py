"""
Section 3 — Intelligence API 라우터

엔드포인트:
    GET /api/v1/intelligence/hotspots  — 글로벌 핫스팟 (규제별 국가 spike)
    GET /api/v1/intelligence/matrix    — 5×5 이해관계자×규제 신호 카운트 매트릭스
    GET /api/v1/intelligence/detail    — 다차원 조합 조건 Drawer 데이터

기존 main.py, news.py, intelligence_db.py 를 일절 변경하지 않는다.
"""
from __future__ import annotations

import json
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .hotspot_engine import (
    BASELINE_WINDOW_DAYS,
    RECENT_DAYS,
    SPIKE_THRESHOLD_PCT,
    compute_hotspots,
    get_matrix_signal_counts,
    iso_to_display_name,
    region_to_iso,
    source_name_to_iso,
)
from .intelligence_db import RawArticle, TaggedArticle, _engine
from .tagging_filter import REGULATION_KEYWORDS, STAKEHOLDER_KEYWORDS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/intelligence", tags=["intelligence"])

# ── 상수 ──────────────────────────────────────────────────────────────────
_REGULATION_TAGS = list(REGULATION_KEYWORDS.keys())   # ["PPWR","CSDDD","CSRD","CBAM","Battery Reg"]
_STAKEHOLDER_TAGS = list(STAKEHOLDER_KEYWORDS.keys()) # ["경쟁사","평가기관","정부당국","기관투자자","시민단체"]


# ── Pydantic 응답 모델 ─────────────────────────────────────────────────────

class CountryHotspot(BaseModel):
    country_iso: str
    country_name: str
    regulation_tag: str
    recent_count: int
    baseline_count: int
    baseline_avg: float
    spike_pct: float
    is_spike: bool


class HotspotsResponse(BaseModel):
    regulation: str | None
    generated_at: str
    spike_threshold_pct: float
    recent_days: int
    baseline_days: int
    total_countries: int
    spike_countries: int
    hotspots: list[CountryHotspot]


class MatrixCell(BaseModel):
    regulation_tag: str
    stakeholder_tag: str
    count: int
    is_spike: bool   # 해당 셀의 카운트가 전체 평균 대비 2배 이상이면 True


class MatrixResponse(BaseModel):
    generated_at: str
    regulation_tags: list[str]
    stakeholder_tags: list[str]
    cells: list[MatrixCell]
    # 시각화 편의용 중첩 딕셔너리 형태도 함께 제공
    matrix: dict[str, dict[str, int]]


class TimelineEvent(BaseModel):
    event_date: str | None = None
    deadline: str | None = None
    phase: str | None = None
    key_actors: list[str] = []


class DetailArticle(BaseModel):
    id: int
    title: str
    excerpt: str
    source_name: str
    created_at: str
    regulation_tag: str
    stakeholder_tag: str
    ai_summary: str
    timeline: TimelineEvent


class DetailResponse(BaseModel):
    generated_at: str
    regulation: str | None
    country_iso: str | None
    stakeholder: str | None
    total: int
    articles: list[DetailArticle]


class NewsroomArticle(BaseModel):
    id: int
    date: str
    title: str
    source: str
    country_iso: str
    country_name: str
    regulation: str
    stakeholder: str
    ai_summary: str


class NewsroomResponse(BaseModel):
    total: int
    articles: list[NewsroomArticle]
    regulation_tags: list[str]
    stakeholder_tags: list[str]


# ── 헬퍼 ──────────────────────────────────────────────────────────────────

def _parse_timeline(raw: str | None) -> TimelineEvent:
    if not raw:
        return TimelineEvent()
    try:
        data = json.loads(raw)
        return TimelineEvent(
            event_date=data.get("event_date"),
            deadline=data.get("deadline"),
            phase=data.get("phase"),
            key_actors=data.get("key_actors") or [],
        )
    except (json.JSONDecodeError, TypeError):
        return TimelineEvent()


def _now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


# ── 엔드포인트 ─────────────────────────────────────────────────────────────

@router.get("/hotspots", response_model=HotspotsResponse)
def get_hotspots(
    regulation: str | None = Query(default=None, description="규제 태그 필터 (예: PPWR, CSDDD)"),
    spike_threshold: float = Query(default=SPIKE_THRESHOLD_PCT, description="is_spike 판정 기준 변동률(%)"),
    limit: int = Query(default=50, ge=1, le=200, description="반환 최대 국가 수"),
) -> HotspotsResponse:
    """
    Section 4.5 — 규제별 전 세계 국가 볼륨 스파이크 계산.
    spike_pct 내림차순 정렬 → 바 차트 / 지도 데이터로 직접 소비 가능.
    """
    hotspots = compute_hotspots(
        regulation_filter=regulation,
        spike_threshold=spike_threshold,
    )[:limit]

    return HotspotsResponse(
        regulation=regulation,
        generated_at=_now_iso(),
        spike_threshold_pct=spike_threshold,
        recent_days=RECENT_DAYS,
        baseline_days=BASELINE_WINDOW_DAYS,
        total_countries=len(hotspots),
        spike_countries=sum(1 for h in hotspots if h.is_spike),
        hotspots=[
            CountryHotspot(
                country_iso=h.country_iso,
                country_name=h.country_name,
                regulation_tag=h.regulation_tag,
                recent_count=h.recent_count,
                baseline_count=h.baseline_count,
                baseline_avg=h.baseline_avg,
                spike_pct=h.spike_pct,
                is_spike=h.is_spike,
            )
            for h in hotspots
        ],
    )


@router.get("/matrix", response_model=MatrixResponse)
def get_matrix() -> MatrixResponse:
    """
    5대 이해관계자 × 5대 규제 매트릭스의 DB 기반 실시간 신호 카운트.
    전체 평균 대비 2배 초과인 셀은 is_spike=True 로 표시.
    """
    matrix_data = get_matrix_signal_counts(_REGULATION_TAGS, _STAKEHOLDER_TAGS)

    all_counts = [
        matrix_data[reg][st]
        for reg in _REGULATION_TAGS
        for st in _STAKEHOLDER_TAGS
    ]
    total = sum(all_counts)
    cell_count = len(all_counts)
    avg = total / max(cell_count, 1)

    cells: list[MatrixCell] = []
    for reg in _REGULATION_TAGS:
        for st in _STAKEHOLDER_TAGS:
            cnt = matrix_data[reg][st]
            cells.append(
                MatrixCell(
                    regulation_tag=reg,
                    stakeholder_tag=st,
                    count=cnt,
                    is_spike=cnt > avg * 2 and cnt > 0,
                )
            )

    return MatrixResponse(
        generated_at=_now_iso(),
        regulation_tags=_REGULATION_TAGS,
        stakeholder_tags=_STAKEHOLDER_TAGS,
        cells=cells,
        matrix=matrix_data,
    )


@router.get("/detail", response_model=DetailResponse)
def get_detail(
    regulation: str | None = Query(default=None, description="규제 태그 (예: PPWR)"),
    country: str | None = Query(default=None, description="ISO-2 국가 코드 (예: KR, US, EU)"),
    stakeholder: str | None = Query(default=None, description="이해관계자 태그 (예: 정부당국)"),
    limit: int = Query(default=20, ge=1, le=100),
    days: int = Query(default=90, ge=1, le=365, description="조회 기간(일)"),
) -> DetailResponse:
    """
    다차원 조합 조건으로 DB 조회 → Drawer 패널용 AI 요약 + 타임라인 배열 반환.
    regulation / country / stakeholder 를 조합해 동적으로 필터링한다.
    """
    since = datetime.now(UTC) - timedelta(days=days)

    with Session(_engine) as session:
        q = (
            session.query(RawArticle, TaggedArticle)
            .join(TaggedArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(RawArticle.created_at >= since)
        )
        if regulation:
            q = q.filter(TaggedArticle.regulation_tag == regulation)
        if stakeholder:
            q = q.filter(TaggedArticle.stakeholder_tag == stakeholder)

        pairs = q.order_by(RawArticle.created_at.desc()).limit(limit * 3).all()

    # 국가 필터는 Python 단에서 수행 (source_name → ISO 변환 후 비교)
    if country:
        pairs = [
            (raw, tagged)
            for raw, tagged in pairs
            if region_to_iso(raw.source_name or "") == country.upper()
        ]

    articles: list[DetailArticle] = []
    for raw, tagged in pairs[:limit]:
        created_str = (
            raw.created_at.isoformat().replace("+00:00", "Z")
            if raw.created_at
            else ""
        )
        articles.append(
            DetailArticle(
                id=raw.id,
                title=raw.title or "",
                excerpt=raw.excerpt or "",
                source_name=raw.source_name or "",
                created_at=created_str,
                regulation_tag=tagged.regulation_tag or "",
                stakeholder_tag=tagged.stakeholder_tag or "",
                ai_summary=tagged.ai_summary or "",
                timeline=_parse_timeline(tagged.news_timeline),
            )
        )

    return DetailResponse(
        generated_at=_now_iso(),
        regulation=regulation,
        country_iso=country.upper() if country else None,
        stakeholder=stakeholder,
        total=len(articles),
        articles=articles,
    )


@router.get("/newsroom", response_model=NewsroomResponse)
def get_newsroom(
    regulation: str | None = Query(default=None, description="규제 태그 필터 (예: CSRD)"),
    stakeholder: str | None = Query(default=None, description="이해관계자 태그 필터"),
    country: str | None = Query(default=None, description="ISO-2 국가 코드 필터"),
    days: int = Query(default=30, ge=1, le=365, description="조회 기간(일)"),
    limit: int = Query(default=500, ge=1, le=1000, description="최대 반환 건수"),
) -> NewsroomResponse:
    """
    인텔리전스 뉴스룸 — 규제·이해관계자·국가 필터 지원.
    최대 500건 반환, 프론트엔드에서 클라이언트사이드 정렬/필터링.
    """
    since = datetime.now(UTC) - timedelta(days=days)

    with Session(_engine) as session:
        q = (
            session.query(RawArticle, TaggedArticle)
            .join(TaggedArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(RawArticle.created_at >= since)
        )
        if regulation:
            q = q.filter(TaggedArticle.regulation_tag == regulation)
        if stakeholder:
            q = q.filter(TaggedArticle.stakeholder_tag == stakeholder)
        pairs = q.order_by(RawArticle.created_at.desc()).limit(limit * 2).all()

    articles: list[NewsroomArticle] = []
    for raw, tagged in pairs:
        iso = source_name_to_iso(raw.source_name or "")
        if country and iso != country.upper():
            continue
        date_str = raw.created_at.strftime("%Y-%m-%d") if raw.created_at else ""
        articles.append(
            NewsroomArticle(
                id=raw.id,
                date=date_str,
                title=raw.title or "",
                source=raw.source_name or "",
                country_iso=iso,
                country_name=iso_to_display_name(iso),
                regulation=tagged.regulation_tag or "",
                stakeholder=tagged.stakeholder_tag or "",
                ai_summary=tagged.ai_summary or "",
            )
        )
        if len(articles) >= limit:
            break

    return NewsroomResponse(
        total=len(articles),
        articles=articles,
        regulation_tags=_REGULATION_TAGS,
        stakeholder_tags=_STAKEHOLDER_TAGS,
    )

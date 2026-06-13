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

from sqlalchemy import func

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
    original_url: str | None
    country_iso: str
    country_name: str
    regulation: str
    stakeholder: str
    ai_summary: str
    article_type: str
    tagging_confidence: float


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
    article_type: str | None = Query(default=None, description="유형 필터: NEWS/REPORT/MARKET/EXPERT"),
    min_confidence: float = Query(default=0.0, ge=0.0, le=1.0, description="최소 tagging_confidence (0=전체, 0.8=고신뢰만)"),
    days: int = Query(default=30, ge=1, le=365, description="조회 기간(일)"),
    limit: int = Query(default=500, ge=1, le=1000, description="최대 반환 건수"),
) -> NewsroomResponse:
    """
    인텔리전스 뉴스룸 — 규제·이해관계자·국가·신뢰도 필터 지원.
    DISTINCT url_hash 기반 중복 제거. 최대 500건 반환.
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
        if article_type:
            q = q.filter(RawArticle.article_type == article_type.upper())
        if min_confidence > 0:
            q = q.filter(TaggedArticle.tagging_confidence >= min_confidence)
        # DISTINCT: url_hash 기준 중복 제거를 위해 distinct(RawArticle.url_hash) 사용
        q = q.distinct(RawArticle.url_hash)
        pairs = q.order_by(RawArticle.created_at.desc()).limit(limit * 2).all()

    seen_hashes: set[str] = set()
    articles: list[NewsroomArticle] = []
    for raw, tagged in pairs:
        # Python 레벨 추가 중복 방어
        h = getattr(raw, "url_hash", str(raw.id))
        if h in seen_hashes:
            continue
        seen_hashes.add(h)

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
                original_url=getattr(raw, "original_url", None),
                country_iso=iso,
                country_name=iso_to_display_name(iso),
                regulation=tagged.regulation_tag or "",
                stakeholder=tagged.stakeholder_tag or "",
                ai_summary=tagged.ai_summary or "",
                article_type=getattr(raw, "article_type", "NEWS") or "NEWS",
                tagging_confidence=getattr(tagged, "tagging_confidence", 0.6) or 0.6,
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


@router.get("/kpi")
def get_kpi() -> dict:
    """3대 인텔리전스 KPI: 오늘의 대표 시그널 / 급증 규제 / 주도 이해관계자."""
    now = datetime.now(UTC)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    with Session(_engine) as session:
        # ── 1. 오늘의 대표 시그널 ─────────────────────────────────────────
        top_pair = (
            session.query(RawArticle, TaggedArticle)
            .join(TaggedArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(
                RawArticle.created_at >= week_ago,
                TaggedArticle.regulation_tag != "unclassified",
                TaggedArticle.stakeholder_tag != "unclassified",
                TaggedArticle.tagging_confidence >= 0.7,
            )
            .order_by(TaggedArticle.tagging_confidence.desc(), RawArticle.created_at.desc())
            .first()
        )

        # ── 2. 급증 규제 ─────────────────────────────────────────────────
        recent_counts: dict[str, int] = dict(
            session.query(TaggedArticle.regulation_tag, func.count(TaggedArticle.id))
            .join(RawArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(RawArticle.created_at >= week_ago, TaggedArticle.regulation_tag != "unclassified")
            .group_by(TaggedArticle.regulation_tag)
            .all()
        )
        prev_counts: dict[str, int] = dict(
            session.query(TaggedArticle.regulation_tag, func.count(TaggedArticle.id))
            .join(RawArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(
                RawArticle.created_at >= two_weeks_ago,
                RawArticle.created_at < week_ago,
                TaggedArticle.regulation_tag != "unclassified",
            )
            .group_by(TaggedArticle.regulation_tag)
            .all()
        )
        best_reg: str | None = None
        best_surge = 0.0
        for reg, cnt in recent_counts.items():
            prev = prev_counts.get(reg, 0)
            surge = (cnt - prev) / max(prev, 1) * 100 if prev else (999.0 if cnt else 0.0)
            if surge > best_surge:
                best_surge, best_reg = surge, reg

        # 급증 규제의 주요 국가 (top 3, ISO 변환)
        surge_countries: list[str] = []
        if best_reg:
            country_rows = (
                session.query(RawArticle.source_name, func.count(RawArticle.id))
                .join(TaggedArticle, TaggedArticle.article_id == RawArticle.id)
                .filter(RawArticle.created_at >= week_ago, TaggedArticle.regulation_tag == best_reg)
                .group_by(RawArticle.source_name)
                .order_by(func.count(RawArticle.id).desc())
                .limit(10)
                .all()
            )
            seen: set[str] = set()
            for sname, _ in country_rows:
                iso = source_name_to_iso(sname or "")
                if iso and iso not in seen and iso not in ("ZZ", ""):
                    seen.add(iso)
                    name = iso_to_display_name(iso)
                    if name and name != iso:
                        surge_countries.append(name)
                    if len(surge_countries) >= 3:
                        break

        # ── 3. 주도 이해관계자 ────────────────────────────────────────────
        st_rows = (
            session.query(TaggedArticle.stakeholder_tag, func.count(TaggedArticle.id))
            .join(RawArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(RawArticle.created_at >= week_ago, TaggedArticle.stakeholder_tag != "unclassified")
            .group_by(TaggedArticle.stakeholder_tag)
            .all()
        )
        st_total = sum(c for _, c in st_rows)
        leading_st: str | None = None
        leading_cnt = 0
        for st, cnt in sorted(st_rows, key=lambda x: x[1], reverse=True):
            leading_st, leading_cnt = st, cnt
            break

        leading_regs: list[str] = []
        if leading_st:
            reg_rows = (
                session.query(TaggedArticle.regulation_tag, func.count(TaggedArticle.id))
                .join(RawArticle, TaggedArticle.article_id == RawArticle.id)
                .filter(
                    RawArticle.created_at >= week_ago,
                    TaggedArticle.stakeholder_tag == leading_st,
                    TaggedArticle.regulation_tag != "unclassified",
                )
                .group_by(TaggedArticle.regulation_tag)
                .order_by(func.count(TaggedArticle.id).desc())
                .limit(3)
                .all()
            )
            leading_regs = [r for r, _ in reg_rows]

    top_signal_data: dict | None = None
    if top_pair:
        raw, tagged = top_pair
        top_signal_data = {
            "title": raw.title or "",
            "source": raw.source_name or "",
            "regulation": tagged.regulation_tag or "",
            "stakeholder": tagged.stakeholder_tag or "",
            "date": raw.created_at.strftime("%Y.%m.%d") if raw.created_at else "",
            "confidence": round(tagged.tagging_confidence or 0, 3),
        }

    return {
        "generated_at": _now_iso(),
        "top_signal": top_signal_data,
        "surging_regulation": {
            "regulation": best_reg,
            "surge_pct": round(best_surge) if best_surge < 999 else None,
            "is_new": best_surge >= 999,
            "recent_count": recent_counts.get(best_reg, 0) if best_reg else 0,
            "prev_count": prev_counts.get(best_reg, 0) if best_reg else 0,
            "top_countries": surge_countries,
        },
        "leading_stakeholder": {
            "stakeholder": leading_st,
            "pct": round(leading_cnt / max(st_total, 1) * 100),
            "count": leading_cnt,
            "top_regulations": leading_regs,
        },
    }


@router.get("/regulation-health")
def regulation_health(
    days: int = Query(default=30, ge=1, le=365, description="진단 기간(일)"),
) -> dict:
    """규제별 수집·태깅·매트릭스 품질 진단 (작업 4, 5)."""
    now = datetime.now(UTC)
    since = now - timedelta(days=days)

    with Session(_engine) as session:
        saved_counts: dict[str, int] = dict(
            session.query(TaggedArticle.regulation_tag, func.count(TaggedArticle.id))
            .join(RawArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(RawArticle.created_at >= since)
            .group_by(TaggedArticle.regulation_tag)
            .all()
        )
        high_conf_counts: dict[str, int] = dict(
            session.query(TaggedArticle.regulation_tag, func.count(TaggedArticle.id))
            .join(RawArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(RawArticle.created_at >= since, TaggedArticle.tagging_confidence >= 0.8)
            .group_by(TaggedArticle.regulation_tag)
            .all()
        )
        matrix_counts: dict[str, int] = dict(
            session.query(TaggedArticle.regulation_tag, func.count(TaggedArticle.id))
            .join(RawArticle, TaggedArticle.article_id == RawArticle.id)
            .filter(
                RawArticle.created_at >= since,
                TaggedArticle.regulation_tag != "unclassified",
                TaggedArticle.stakeholder_tag != "unclassified",
            )
            .group_by(TaggedArticle.regulation_tag)
            .all()
        )

    total = sum(saved_counts.values())
    unclassified = saved_counts.get("unclassified", 0)

    regs_report = []
    for reg in _REGULATION_TAGS:
        saved = saved_counts.get(reg, 0)
        regs_report.append({
            "regulation": reg,
            "keyword_count": len(REGULATION_KEYWORDS.get(reg, [])),
            "saved_count": saved,
            "high_confidence_count": high_conf_counts.get(reg, 0),
            "matrix_count": matrix_counts.get(reg, 0),
            "health": "ok" if saved >= 5 else ("low" if saved > 0 else "zero"),
        })

    return {
        "generated_at": _now_iso(),
        "days": days,
        "total_tagged": total,
        "unclassified_count": unclassified,
        "unclassified_pct": round(unclassified / max(total, 1) * 100, 1),
        "regulations": regs_report,
    }


@router.post("/reprocess")
def trigger_reprocess() -> dict:
    """
    tagged_articles 전량 재태깅을 백그라운드 스레드로 즉시 실행한다.
    `python manage.py reprocess_all` 대체 엔드포인트.
    """
    import threading
    from .intelligence_pipeline import reprocess_all

    def _run():
        try:
            saved = reprocess_all()
            logger.info("[reprocess] HTTP 트리거 완료 — %d건 저장", saved)
        except Exception:
            logger.exception("[reprocess] 실패")

    t = threading.Thread(target=_run, name="http-reprocess", daemon=True)
    t.start()
    return {"status": "started", "message": "재태깅 백그라운드 시작. /api/debug 에서 진행 상황 확인 가능"}


@router.get("/data-health")
def data_health() -> dict:
    """데이터 신선도·품질 진단 엔드포인트."""
    from datetime import timedelta
    from sqlalchemy import func
    from collections import Counter

    now = datetime.now(UTC)
    since_30d = now - timedelta(days=30)

    with Session(_engine) as session:
        raw_total = session.query(func.count(RawArticle.id)).scalar()
        raw_30d = session.query(func.count(RawArticle.id)).filter(RawArticle.created_at >= since_30d).scalar()
        tagged_total = session.query(func.count(TaggedArticle.id)).scalar()

        # original_url 적재율
        url_filled = session.query(func.count(RawArticle.id)).filter(
            RawArticle.original_url.isnot(None),
            RawArticle.original_url != ""
        ).scalar()

        # 규제별 분포
        reg_rows = session.query(TaggedArticle.regulation_tag, func.count(TaggedArticle.id))\
            .group_by(TaggedArticle.regulation_tag).all()

        # 신뢰도 분포
        conf_rows = session.query(TaggedArticle.tagging_confidence).all()

    confs = [r[0] for r in conf_rows if r[0] is not None]
    conf_dist = {
        "high_ge_0.8": sum(1 for c in confs if c >= 0.8),
        "mid_0.5_0.79": sum(1 for c in confs if 0.5 <= c < 0.8),
        "low_lt_0.5": sum(1 for c in confs if c < 0.5),
    }

    return {
        "timestamp": _now_iso(),
        "raw_articles": {"total": raw_total, "last_30d": raw_30d},
        "tagged_articles": tagged_total,
        "original_url_filled": url_filled,
        "original_url_fill_rate_pct": round(url_filled / max(raw_total, 1) * 100, 1),
        "regulation_distribution": dict(reg_rows),
        "confidence_distribution": conf_dist,
    }

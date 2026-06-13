"""
Section 1.2 / 2.1 — 1차 키워드 필터링

매트릭스 격자에 해당하는 핵심 키워드가 제목·본문에 하나라도 포함된
raw_articles 행만 골라 반환한다.
기존 코드에 의존하지 않는 독립 모듈이다.
"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .intelligence_db import RawArticle

# ── 세로축: 규제 매트릭스 키워드 ──────────────────────────────────────────
REGULATION_KEYWORDS: dict[str, list[str]] = {
    "PPWR": [
        "ppwr", "packaging and packaging waste regulation",
        "포장재 규제", "포장재", "packaging waste",
        "packaging regulation", "packaging law", "packaging directive",
        "recycled content", "recyclability", "recyclable packaging",
        "plastic packaging", "packaging design", "packaging policy",
        "recycling rate", "reuse", "refillable", "compostable packaging",
        "extended producer responsibility", "epr packaging",
        "packaging producer", "take-back scheme",
        "포장 규제", "재활용 포장", "포장재법",
    ],
    "CSDDD": [
        "csddd", "corporate sustainability due diligence",
        "공급망 실사", "due diligence directive",
        "supply chain due diligence", "human rights due diligence",
        "value chain", "supply chain risk", "supply chain audit",
        "forced labour", "forced labor", "child labour", "child labor",
        "modern slavery", "supplier assessment", "supplier audit",
        "responsible sourcing", "supply chain transparency",
        "공급망 리스크", "공급망 관리", "공급망 인권",
    ],
    "CSRD": [
        "csrd", "corporate sustainability reporting directive",
        "지속가능성 공시", "sustainability reporting",
        "esrs", "european sustainability reporting standards",
        "non-financial disclosure", "double materiality",
        "esg disclosure", "esg reporting", "sustainability disclosure",
        "integrated reporting", "climate disclosure", "scope 1", "scope 2", "scope 3",
        "탄소 공시", "esg 공시", "지속가능성 보고",
    ],
    "CBAM": [
        "cbam", "carbon border adjustment mechanism",
        "탄소국경조정", "carbon border",
        "carbon tariff", "carbon levy", "carbon price",
        "carbon tax", "emissions trading", "eu ets",
        "carbon leakage", "greenhouse gas emissions",
        "co2 emissions", "decarbonization", "탄소 비용", "탄소세",
    ],
    "Battery Reg": [
        "battery regulation", "eu battery", "배터리 규제", "배터리",
        "battery passport", "battery act",
        "battery directive", "lithium battery", "ev battery",
        "battery recycling", "battery material", "cobalt", "lithium",
        "battery supply chain", "battery manufacturer",
        "배터리법", "전기차 배터리", "리튬",
    ],
}

# ── 가로축: 이해관계자 매트릭스 키워드 ────────────────────────────────────
STAKEHOLDER_KEYWORDS: dict[str, list[str]] = {
    "경쟁사": [
        "samsung", "lg", "hyundai", "sk", "posco", "현대", "삼성", "lg화학",
        "competitor", "rival", "peer company",
    ],
    "평가기관": [
        "msci", "sustainalytics", "s&p global", "moody", "ftse",
        "bloomberg esg", "평가기관", "rating agency", "esg rating",
    ],
    "정부당국": [
        "european commission", "parliament", "ministry", "regulator",
        "government", "authority", "규제당국", "정부", "환경부", "금융위",
        "sec", "efrag", "council of the eu",
    ],
    "기관투자자": [
        "blackrock", "vanguard", "state street", "fidelity", "pension fund",
        "블랙록", "국민연금", "기관투자자", "asset manager", "institutional investor",
    ],
    "시민단체": [
        "greenpeace", "wwf", "clientearth", "환경단체", "ngo",
        "civil society", "그린피스", "시민단체", "advocacy",
    ],
}

# ── 추가 ESG 공통 키워드 ────────────────────────────────────────────────────
COMMON_ESG_KEYWORDS: list[str] = [
    "esg", "scope 3", "탄소중립", "net zero", "carbon neutral",
    "supply chain", "공급망", "sustainability", "지속가능",
    "greenwashing", "그린워싱", "climate", "기후변화",
]

_ALL_FLAT: list[str] = [
    kw
    for group in (
        *REGULATION_KEYWORDS.values(),
        *STAKEHOLDER_KEYWORDS.values(),
        COMMON_ESG_KEYWORDS,
    )
    for kw in group
]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def _has_any_keyword(text: str, keywords: list[str]) -> bool:
    lowered = _normalize(text)
    return any(kw.lower() in lowered for kw in keywords)


def passes_keyword_filter(title: str, excerpt: str) -> bool:
    """제목·본문 중 하나라도 매트릭스 키워드를 포함하면 True."""
    combined = f"{title} {excerpt}"
    return _has_any_keyword(combined, _ALL_FLAT)


def infer_regulation_tag(title: str, excerpt: str) -> str:
    """세로축 태그를 키워드 빈도 기반으로 추론한다. 매칭 없으면 'ESG'."""
    combined = _normalize(f"{title} {excerpt}")
    best_tag, best_count = "ESG", 0
    for tag, keywords in REGULATION_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw.lower() in combined)
        if count > best_count:
            best_tag, best_count = tag, count
    return best_tag


def infer_stakeholder_tag(title: str, excerpt: str) -> str:
    """가로축 태그를 키워드 빈도 기반으로 추론한다. 매칭 없으면 '기타'."""
    combined = _normalize(f"{title} {excerpt}")
    best_tag, best_count = "기타", 0
    for tag, keywords in STAKEHOLDER_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw.lower() in combined)
        if count > best_count:
            best_tag, best_count = tag, count
    return best_tag


def filter_raw_articles(rows: list["RawArticle"]) -> list["RawArticle"]:
    """ORM RawArticle 행 리스트를 받아 키워드 필터를 통과한 것만 반환."""
    return [
        row for row in rows
        if passes_keyword_filter(row.title or "", row.excerpt or "")
    ]

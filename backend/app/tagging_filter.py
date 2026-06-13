"""
Section 1.2 / 2.1 — 1차 키워드 필터링 + 규제/이해관계자 추론

영어 원문 기사와 DeepL 번역 한글 제목 모두를 커버하도록
키워드 사전을 대폭 확장했다.
"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .intelligence_db import RawArticle

# ── 세로축: 규제 매트릭스 키워드 (영어 + 한글 동의어 확장) ───────────────
REGULATION_KEYWORDS: dict[str, list[str]] = {
    "PPWR": [
        # 공식 명칭
        "ppwr", "packaging and packaging waste regulation",
        "packaging regulation", "packaging law", "packaging directive",
        # 핵심 개념 — 영어
        "circular economy", "recycling", "recyclable", "recyclability",
        "recycled content", "plastic waste", "plastic packaging",
        "single-use plastic", "sup regulation", "plastic pollution",
        "bio-based", "biodegradable", "compostable", "compostable packaging",
        "packaging waste", "waste management", "waste reduction",
        "extended producer responsibility", "epr", "take-back",
        "refillable", "reusable packaging", "deposit return scheme",
        "packaging design", "packaging policy", "sustainable packaging",
        "packaging sustainability", "packaging material", "packaging standard",
        "textile waste", "fibre", "biomass", "circular",
        # 한글
        "포장재 규제", "포장재", "포장 규제", "재활용", "재활용 포장",
        "포장재법", "순환경제", "플라스틱", "일회용", "폐기물",
        "생분해", "바이오 기반", "생산자책임재활용",
    ],
    "CSDDD": [
        # 공식 명칭
        "csddd", "corporate sustainability due diligence",
        "due diligence directive", "cs3d",
        # 핵심 개념 — 영어
        "supply chain due diligence", "human rights due diligence",
        "due diligence", "supply chain risk", "supply chain audit",
        "supply chain management", "supply chain transparency",
        "forced labour", "forced labor", "child labour", "child labor",
        "modern slavery", "supplier assessment", "supplier audit",
        "responsible sourcing", "responsible business conduct",
        "value chain", "esg due diligence", "human rights",
        "labour rights", "labor rights", "worker rights",
        "corporate responsibility", "social responsibility",
        "supply chain compliance", "tier 1 supplier", "tier 2",
        "supplier engagement", "supply chain",
        # 한글
        "공급망 실사", "공급망 리스크", "공급망 관리", "공급망 인권",
        "공급망", "실사", "공급업체", "인권 실사", "노동 인권",
    ],
    "CSRD": [
        # 공식 명칭
        "csrd", "corporate sustainability reporting directive",
        "esrs", "european sustainability reporting standards",
        # 핵심 개념 — 영어
        "sustainability reporting", "sustainability report",
        "esg reporting", "esg report", "esg disclosure",
        "non-financial disclosure", "non-financial reporting",
        "double materiality", "materiality assessment",
        "climate disclosure", "sustainability disclosure",
        "integrated reporting", "transparency reporting",
        "scope 1", "scope 2", "scope 3",
        "ifrs sustainability", "issb", "s1", "s2",
        "omnibus", "omnibus package", "reporting standard",
        "corporate disclosure", "annual report esg",
        "esg data", "esg metric", "kpi sustainability",
        # 한글
        "지속가능성 공시", "지속가능성 보고", "esg 공시", "esg 보고",
        "탄소 공시", "비재무 공시", "지속가능 보고서", "이중 중요성",
    ],
    "CBAM": [
        # 공식 명칭
        "cbam", "carbon border adjustment mechanism",
        "carbon border adjustment",
        # 핵심 개념 — 영어
        "carbon border", "carbon tariff", "carbon levy",
        "carbon price", "carbon pricing", "carbon tax",
        "emissions trading", "eu ets", "ets", "carbon market",
        "carbon leakage", "carbon credit", "carbon offset",
        "greenhouse gas", "co2 emission", "carbon emission",
        "decarbonization", "decarbonise", "decarbonize",
        "net zero", "carbon neutral", "carbon footprint",
        "climate change", "climate policy", "climate regulation",
        "carbon accounting", "embodied carbon",
        "steel emission", "cement emission", "aluminium emission",
        # 한글
        "탄소국경조정", "탄소세", "탄소 비용", "탄소 가격",
        "탄소 배출", "온실가스", "탄소 시장", "탄소 중립",
        "기후변화", "탄소 크레딧", "배출권 거래",
    ],
    "Battery Reg": [
        # 공식 명칭
        "battery regulation", "eu battery regulation",
        "battery act", "battery directive",
        "battery passport", "dpp battery",
        # 핵심 개념 — 영어
        "lithium battery", "ev battery", "electric vehicle battery",
        "battery recycling", "battery material", "battery supply chain",
        "battery manufacturer", "battery cell", "battery pack",
        "cobalt", "lithium", "nickel", "manganese", "graphite",
        "battery chemistry", "cathode", "anode",
        "digital product passport", "battery dpp",
        "electric vehicle", "ev", "e-mobility", "electrification",
        "gigafactory", "battery factory", "battery plant",
        "energy storage", "battery storage",
        # 한글
        "배터리 규제", "배터리", "배터리법", "전기차 배터리",
        "리튬", "코발트", "배터리 여권", "전기차", "이차전지",
        "배터리 재활용", "에너지 저장",
    ],
}

# ── 가로축: 이해관계자 매트릭스 키워드 (대폭 확장) ────────────────────────
STAKEHOLDER_KEYWORDS: dict[str, list[str]] = {
    "경쟁사": [
        # 글로벌 대기업
        "samsung", "lg", "hyundai", "sk", "posco", "현대", "삼성", "lg화학",
        "volkswagen", "bmw", "mercedes", "toyota", "ford", "gm", "tesla",
        "apple", "microsoft", "amazon", "google", "meta", "nvidia",
        "basf", "shell", "bp", "totalenergies", "equinor",
        "catl", "byd", "panasonic", "abb",
        "unilever", "nestle", "procter", "henkel",
        "arcelormittal", "thyssenkrupp", "nippon steel",
        # 일반 기업 키워드
        "manufacturer", "producer", "company", "corporation",
        "firm", "enterprise", "industry", "corporate",
        "competitor", "rival", "peer company", "player",
        # 한글
        "기업", "제조사", "기업체", "회사",
    ],
    "평가기관": [
        # 평가기관 이름
        "msci", "sustainalytics", "s&p global", "s&p",
        "moody", "fitch", "ftse russell", "ftse",
        "bloomberg esg", "refinitiv", "iss", "glass lewis",
        "cdp", "gri", "sasb", "tcfd", "sbti", "science based targets",
        "efrag", "issb", "ifrs foundation", "kssb",
        "iso", "en 15343", "standard",
        # 일반 평가 키워드
        "rating agency", "esg rating", "esg score",
        "certification", "audit", "assessment", "benchmark",
        "index", "framework", "standard body", "reporting standard",
        "accreditation", "verification", "assurance",
        # 한글
        "평가기관", "인증", "평가", "기준", "표준",
    ],
    "정부당국": [
        # EU/국제 기관
        "european commission", "european parliament", "eu council",
        "council of the eu", "efrag", "eba", "esma", "eiopa",
        "eur-lex", "official journal", "ec regulation",
        # 각국 정부
        "ministry", "minister", "government", "parliament",
        "regulator", "regulatory authority", "authority",
        "agency", "administration", "department",
        "policy maker", "lawmaker", "legislator",
        "sec", "epa", "bmas", "bmu",
        "산업부", "환경부", "금융위", "금감원",
        # 정책/법률 키워드
        "regulation", "directive", "law", "legislation",
        "policy", "rule", "compliance", "enforcement",
        "mandate", "requirement", "obligation",
        # 한글
        "정부", "규제당국", "의회", "정책", "법안", "규제", "당국",
    ],
    "기관투자자": [
        # 주요 기관투자자
        "blackrock", "vanguard", "state street", "fidelity",
        "pimco", "jp morgan", "goldman sachs", "morgan stanley",
        "norges bank", "nbim", "calpers", "calstrs",
        "axa", "allianz", "zurich", "aviva",
        "국민연금", "공무원연금", "사학연금",
        # 금융 기관
        "pension fund", "sovereign wealth fund",
        "asset manager", "asset management", "institutional investor",
        "hedge fund", "private equity", "venture capital",
        "bank", "investment bank", "commercial bank",
        "insurer", "insurance", "reinsurance",
        # 금융 상품/행동
        "esg fund", "green bond", "sustainable bond", "slb",
        "green finance", "sustainable finance",
        "investor", "investment", "shareholder",
        "divestment", "engagement", "stewardship",
        "portfolio", "equity", "bond", "fund",
        # 한글
        "기관투자자", "블랙록", "연기금", "자산운용", "투자자",
        "녹색채권", "지속가능채권",
    ],
    "시민단체": [
        # 주요 NGO
        "greenpeace", "wwf", "clientearth", "friends of the earth",
        "earthjustice", "sierra club", "350.org",
        "business & human rights resource centre", "bhrrc",
        "amnesty international", "human rights watch",
        "transparency international",
        "corporate accountability",
        # 일반 NGO 키워드
        "ngo", "civil society", "advocacy group",
        "environmental group", "environmental organization",
        "activist", "campaign", "protest", "petition",
        "nonprofit", "charity", "foundation",
        "watchdog", "think tank",
        # 한글
        "시민단체", "환경단체", "그린피스", "비정부기구", "시민사회",
        "캠페인", "환경운동",
    ],
}

# ── 추가 ESG 공통 키워드 (필터 통과용) ──────────────────────────────────────
COMMON_ESG_KEYWORDS: list[str] = [
    "esg", "sustainability", "sustainable", "climate", "environmental",
    "governance", "social", "net zero", "carbon neutral", "green",
    "renewable", "energy transition", "decarboniz",
    "supply chain", "reporting", "disclosure",
    "지속가능", "탄소중립", "친환경", "기후",
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
    """
    세로축 규제 태그를 키워드 빈도 기반으로 추론한다.
    매칭 없으면 CSRD (가장 광범위한 규제)로 귀속.
    """
    combined = _normalize(f"{title} {excerpt}")
    best_tag, best_count = "CSRD", 0
    for tag, keywords in REGULATION_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw.lower() in combined)
        if count > best_count:
            best_tag, best_count = tag, count
    return best_tag


def infer_stakeholder_tag(title: str, excerpt: str) -> str:
    """
    가로축 이해관계자 태그를 키워드 빈도 기반으로 추론한다.
    매칭 없으면 '정부당국' (규제 기사의 기본 주체)으로 귀속.
    """
    combined = _normalize(f"{title} {excerpt}")
    best_tag, best_count = "정부당국", 0
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

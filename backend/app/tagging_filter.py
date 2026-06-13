"""
Section 1.2 / 2.1 — 1차 키워드 필터링 + 규제/이해관계자 추론

마스터 규제 사전 v3: 15대 완전체 규제 커버리지
투자·주식 노이즈 배제 레이어 장착
"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .intelligence_db import RawArticle

# ── 노이즈 배제 키워드 (순수 주식/투자 스팸만 차단, 단어 경계 엄격 적용) ──────
# 주의: "shares" 단독 사용 시 "carbon shares", "shared analysis" 오차단 발생
# → 복합어 또는 완전 표현만 사용
NOISE_KEYWORDS: list[str] = [
    "shareholder alert",
    "class action lawsuit",
    "openpr.com",
    "initial public offering",
    "quarterly earnings report",
    "stock market rally",
    "share price target",
    "nasdaq listed",
    "nyse listed",
    "generic product market report",
    "press release financial results",
]

# ── 세로축: 15대 마스터 규제 정밀 키워드 사전 ────────────────────────────
REGULATION_KEYWORDS: dict[str, list[str]] = {
    "ESPR": [
        "espr", "ecodesign", "ecodesign regulation",
        "ecodesign for sustainable products",
        "sustainable products regulation",
        "delegated act", "working plan ecodesign",
        "unsold goods", "repairability",
        "ecodesign requirement", "sustainable product",
        "product sustainability requirement",
        # 한글
        "에코디자인", "에코디자인 규정", "지속가능한 제품", "수리가능성",
    ],
    "PPWR": [
        "ppwr", "packaging waste regulation", "packaging regulation eu",
        "recycled content packaging", "packaging waste",
        "packaging and packaging waste",
        "eu packaging regulation", "packaging recyclability",
        "recyclable packaging",
        # 한글
        "포장재 규제", "포장재 규정", "포장재", "재활용 포장",
        "포장 규제", "포장 폐기물",
    ],
    "CSDDD": [
        "csddd", "cs3d", "due diligence directive",
        "supply chain due diligence",
        "sustainability due diligence",
        "omnibus due diligence",
        "corporate sustainability due diligence",
        "human rights due diligence directive",
        # 한글
        "공급망 실사", "공급망 인권", "실사지침", "공급망 실사법",
        "지속가능성 실사",
    ],
    "CSRD": [
        "csrd", "esrs", "sustainability reporting directive",
        "corporate sustainability reporting",
        "omnibus csrd", "wave 2 csrd",
        "european sustainability reporting standards",
        "double materiality", "materiality assessment",
        # 한글
        "지속가능성 공시", "지속가능성 보고 지침", "esg 공시",
        "지속가능성 보고", "이중 중요성",
    ],
    "CBAM": [
        "cbam", "carbon border adjustment",
        "carbon border adjustment mechanism",
        "carbon border",
        "carbon leakage eu", "cbam certificate",
        "cbam declarant", "carbon border tax",
        # 한글
        "탄소국경조정", "탄소국경세", "탄소 국경 조정",
    ],
    "EUDR": [
        "eudr", "eu deforestation regulation",
        "deforestation regulation",
        "due diligence statement",
        "dds deforestation", "eudr compliance",
        "deforestation free", "eudr implementation",
        "forest risk commodity",
        # 한글
        "산림벌채 규정", "산림벌채", "삼림파괴 규정", "산림 규제",
    ],
    "GCD": [
        "green claims directive", "greenwashing eu",
        "green claims regulation",
        "environmental claims eu",
        "green claims withdrawn",
        "green claim", "greenwashing directive",
        "substantiating green claims",
        "eu greenwashing",
        # 한글
        "그린클레임 지침", "그린클레임", "그린워싱 규제",
        "환경주장", "친환경 주장",
    ],
    "AI Act": [
        "eu ai act", "ai act", "eu ai law",
        "artificial intelligence regulation eu",
        "gpai", "high-risk ai",
        "eu ai regulation", "ai liability",
        "ai governance eu", "general purpose ai",
        "foundation model regulation",
        "ai conformity assessment",
        # 한글
        "eu ai법", "인공지능법", "ai 규제", "고위험 ai",
    ],
    "Battery Reg": [
        "eu battery regulation", "battery regulation",
        "digital battery passport", "battery passport",
        "dbp battery", "battery carbon footprint",
        "battery due diligence", "battery recycled content",
        "battery act eu",
        # 한글
        "배터리 규제", "배터리 여권", "배터리법",
        "이차전지 규정", "배터리 탄소발자국",
    ],
    "DPP": [
        "digital product passport", " dpp ",
        "dpp regulation", "product passport",
        "ecopassport", "product digital passport",
        "digital passport regulation",
        # 한글
        "디지털 제품 여권", "제품 여권", "디지털 여권",
    ],
    "ELV": [
        "elv regulation", "end of life vehicle",
        "end-of-life vehicles", "end-of-life vehicle regulation",
        "vehicle recycling regulation", "automotive recycling directive",
        "elv directive",
        # 한글
        "폐차 규정", "폐차 재활용", "자동차 재활용 규제", "차량 재활용",
    ],
    "SFDR": [
        "sfdr", "sustainable finance disclosure regulation",
        "esg fund disclosure",
        "principal adverse impact", " pai ",
        "article 8 fund", "article 9 fund",
        "sfdr classification", "sfdr reporting",
        # 한글
        "지속가능금융공시", "지속가능 금융 공시", "esg 펀드 공시",
    ],
    # ── 신규 2종 규제 (2026 우선순위 — RE100/KSSB/Carbon Cost Policy 제거됨) ──
    "CA_Climate": [
        "california climate", "california ab 1305", "california sb 253", "california sb 261",
        "california climate accountability", "california climate disclosure",
        "carb regulation", "california air resources board",
        "california greenhouse gas", "california net zero",
        "sec climate disclosure", "sec climate rule",
        "us climate disclosure rule", "scope 3 sec",
        # 한글
        "캘리포니아 기후", "미국 기후공시", "sec 기후규제",
    ],
    "IMO_Reg": [
        "imo regulation", "international maritime organization",
        "imo 2030", "imo 2050", "imo decarbonization",
        "shipping decarbonization", "maritime decarbonization",
        "imo ghg strategy", "imo carbon intensity",
        "cii rating", "carbon intensity indicator",
        "eexi", "enhanced ship energy efficiency",
        "maritime emission", "shipping emission",
        "lng shipping", "ammonia shipping", "hydrogen shipping",
        "green shipping", "fuel eu maritime",
        # 한글
        "국제해사기구", "해운 탈탄소", "해운 규제", "선박 배출", "해운 온실가스",
    ],
}

# ── 가로축: 이해관계자 키워드 ─────────────────────────────────────────────
STAKEHOLDER_KEYWORDS: dict[str, list[str]] = {
    "경쟁사": [
        # 글로벌 대기업
        "samsung", "lg", "hyundai", "sk group", "posco",
        "volkswagen", "bmw", "mercedes", "toyota", "ford", "gm", "tesla",
        "apple", "microsoft", "amazon", "google", "meta", "nvidia",
        "basf", "shell", "bp", "totalenergies", "equinor",
        "catl", "byd", "panasonic", "abb",
        "unilever", "nestle", "henkel",
        "arcelormittal", "thyssenkrupp", "nippon steel",
        "manufacturer", "producer", "corporation",
        "competitor", "corporate strategy",
        # 한글
        "삼성", "현대", "기업 대응", "제조사",
    ],
    "평가기관": [
        "msci", "sustainalytics", "s&p global",
        "moody's", "fitch", "ftse russell",
        "cdp", "gri", "sasb", "tcfd", "sbti",
        "efrag", "issb", "ifrs foundation",
        "iso standard", "rating agency", "esg rating", "esg score",
        "certification body", "benchmark", "reporting standard",
        "accreditation", "third-party verification", "assurance provider",
        # 한글
        "평가기관", "인증기관", "평가", "기준 제정",
    ],
    "정부당국": [
        "european commission", "european parliament",
        "council of the eu", "eu council",
        "ministry", "minister", "government", "parliament",
        "regulator", "regulatory authority", "authority",
        "agency", "administration", "department",
        "policy maker", "lawmaker", "legislator",
        "sec", "epa", "산업부", "환경부", "금융위",
        "regulation", "directive", "law", "legislation",
        "policy", "rule", "compliance requirement", "enforcement",
        "mandate", "obligation", "implementation",
        # 한글
        "정부", "규제당국", "의회", "정책", "법안", "규제", "입법",
    ],
    "기관투자자": [
        "blackrock", "vanguard", "state street", "fidelity",
        "pimco", "jp morgan", "goldman sachs", "morgan stanley",
        "norges bank", "calpers", "calstrs",
        "axa", "allianz", "zurich", "aviva",
        "pension fund", "sovereign wealth fund",
        "asset manager", "asset management", "institutional investor",
        "hedge fund", "private equity",
        "investment bank", "insurer", "insurance",
        "green bond", "sustainable bond", "esg fund",
        "green finance", "sustainable finance",
        "investor engagement", "shareholder engagement",
        "divestment", "stewardship",
        # 한글
        "국민연금", "기관투자자", "연기금", "자산운용", "녹색채권",
    ],
    "시민단체": [
        "greenpeace", "wwf", "clientearth", "friends of the earth",
        "earthjustice", "sierra club",
        "amnesty international", "human rights watch",
        "transparency international",
        "ngo", "civil society", "advocacy group",
        "environmental group", "environmental organization",
        "activist", "campaign", "protest", "petition",
        "nonprofit", "charity", "watchdog", "think tank",
        # 한글
        "시민단체", "환경단체", "그린피스", "비정부기구", "시민사회", "캠페인",
    ],
}

# ── 추가 ESG 공통 키워드 (필터 통과용) ───────────────────────────────────
COMMON_ESG_KEYWORDS: list[str] = [
    "esg", "sustainability", "sustainable", "climate",
    "environmental", "governance", "social",
    "net zero", "carbon neutral", "green deal",
    "renewable energy", "energy transition", "decarboniz",
    "supply chain", "esg reporting", "esg disclosure",
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


def passes_noise_filter(title: str, excerpt: str) -> bool:
    """
    투자·주식 노이즈 기사이면 False 반환 → tagged_articles 적재 제외.
    제목·요약에 배제 키워드가 하나라도 있으면 Skip.
    """
    combined = _normalize(f"{title} {excerpt}")
    return not any(kw.lower() in combined for kw in NOISE_KEYWORDS)


def passes_keyword_filter(title: str, excerpt: str) -> bool:
    """
    수집 단계에서 ESG 쿼리로 가져온 기사는 전량 태깅 대상으로 허용한다.
    (구 시스템의 '넓은 수집' 원칙 복원 — 버리지 않고 분류만 부여)
    노이즈 필터(passes_noise_filter)만으로 스팸을 걸러내면 충분하다.
    """
    return True


# 신규 규제 1.5배 가중치 (2026 우선순위 지정 규제)
_PRIORITY_REGULATIONS: frozenset[str] = frozenset({"CA_Climate", "IMO_Reg", "ESPR"})
_PRIORITY_WEIGHT = 1.5


def infer_regulation_tag(title: str, excerpt: str) -> str:
    """
    17대 규제 태그를 키워드 빈도 기반으로 추론.
    CA_Climate / IMO_Reg / ESPR 에 1.5배 가중치 적용.
    매칭 점수 0이면 CSRD 기본값 대신 'CSRD'를 반환하되,
    CSRD 자체 키워드 매칭이 없으면 passes_keyword_filter 가 이미 걸러냄.
    """
    combined = _normalize(f"{title} {excerpt}")
    best_tag, best_score = "CSRD", 0.0
    for tag, keywords in REGULATION_KEYWORDS.items():
        raw = sum(1 for kw in keywords if kw.lower() in combined)
        weight = _PRIORITY_WEIGHT if tag in _PRIORITY_REGULATIONS else 1.0
        score = raw * weight
        if score > best_score:
            best_tag, best_score = tag, score
    return best_tag


def infer_stakeholder_tag(title: str, excerpt: str) -> str:
    """
    이해관계자 태그를 키워드 빈도 기반으로 추론.
    매칭 없으면 '정부당국'으로 귀속.
    """
    combined = _normalize(f"{title} {excerpt}")
    best_tag, best_count = "정부당국", 0
    for tag, keywords in STAKEHOLDER_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw.lower() in combined)
        if count > best_count:
            best_tag, best_count = tag, count
    return best_tag


# ── 규제별 컨텍스트 확인 키워드 (최소 1개 이상 필요) ──────────────────────
# 이 중 하나라도 없으면 tagging_confidence가 감소하여 "분류 보류" 처리
REGULATION_CONTEXT_KEYWORDS: dict[str, list[str]] = {
    "ESPR": ["ecodesign", "product", "sustainable product", "repairabilit", "working plan", "에코디자인"],
    "PPWR": ["packaging", "recycl", "waste", "plastic", "포장"],
    "CSDDD": ["due diligence", "supply chain", "liable", "human rights", "공급망", "실사"],
    "CSRD": ["reporting", "disclosure", "report", "esrs", "materialit", "공시", "보고"],
    "CBAM": ["carbon", "border", "emission", "탄소", "국경"],
    "EUDR": ["deforestation", "forest", "timber", "cattle", "산림", "벌채"],
    "GCD": ["green claim", "greenwashing", "environmental claim", "그린클레임", "그린워싱"],
    "AI Act": ["artificial intelligence", "ai system", "high-risk", "gpai", "인공지능", "ai법"],
    "Battery Reg": ["battery", "passport", "recycled", "cobalt", "lithium", "배터리"],
    "DPP": ["product passport", "digital passport", "traceabilit", "여권", "디지털 제품"],
    "ELV": ["end-of-life", "vehicle", "recycling", "scrap", "폐차", "자동차 재활용"],
    "SFDR": ["sustainable finance", "disclosure", "fund", "pai", "article 8", "article 9", "펀드", "공시"],
    "CA_Climate": ["california", "ab 1305", "sb 253", "sb 261", "sec climate", "carb", "캘리포니아", "sec"],
    "IMO_Reg": ["imo", "maritime", "shipping", "vessel", "seafarer", "해운", "선박", "국제해사"],
}

# 소스 유형별 기본 신뢰도 (사용자 지정값 RSS=0.6, 직접크롤=0.9 기반)
_SOURCE_CONFIDENCE: dict[str, float] = {
    "NEWS":   0.72,   # Google News RSS — 컨텍스트 매칭 시 ≥0.8 돌파
    "REPORT": 0.92,   # 전문지 직접 크롤
    "MARKET": 0.88,
    "EXPERT": 0.85,
}

_CONTEXT_MATCH_FACTOR = 1.10   # 컨텍스트 키워드 매칭 시 보너스
_CONTEXT_MISS_FACTOR  = 0.75   # 컨텍스트 키워드 없을 때 패널티


def check_regulation_context(text: str, regulation_tag: str) -> bool:
    """규제별 필수 컨텍스트 키워드 중 하나 이상이 텍스트에 존재하면 True."""
    ctx_kws = REGULATION_CONTEXT_KEYWORDS.get(regulation_tag, [])
    if not ctx_kws:
        return True
    lowered = text.lower()
    return any(kw.lower() in lowered for kw in ctx_kws)


def compute_tagging_confidence(
    combined_text: str,
    regulation_tag: str,
    article_type: str = "NEWS",
) -> float:
    """
    소스 신뢰도 × 컨텍스트 매칭 팩터로 tagging_confidence를 계산한다.
    - NEWS + context match  = 0.72 * 1.10 ≈ 0.79  (≥0.8 경계)
    - NEWS + no context     = 0.72 * 0.75 ≈ 0.54
    - REPORT + context      = 0.92 * 1.10 ≈ 1.01 → capped at 1.0
    - REPORT + no context   = 0.92 * 0.75 ≈ 0.69
    """
    src_conf = _SOURCE_CONFIDENCE.get(article_type.upper(), 0.72)
    ctx_ok = check_regulation_context(combined_text, regulation_tag)
    factor = _CONTEXT_MATCH_FACTOR if ctx_ok else _CONTEXT_MISS_FACTOR
    return round(min(src_conf * factor, 1.0), 4)


def filter_raw_articles(rows: list["RawArticle"]) -> list["RawArticle"]:
    """ORM RawArticle 행 리스트를 받아 키워드 필터를 통과한 것만 반환."""
    return [
        row for row in rows
        if passes_keyword_filter(row.title or "", row.excerpt or "")
    ]

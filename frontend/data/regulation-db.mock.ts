// ─────────────────────────────────────────────────────────────────────────────
// regulation-db.mock.ts  (ESG_Regulation_DB.xlsx 기준 — 2026-06-10)
// 향후 Google Sheet / Supabase 전환 고려한 정적 mock DB
// 테이블: reg_master · reg_tracking · reg_scope · tracking_units · checkpoints
// ─────────────────────────────────────────────────────────────────────────────

export type RegId = "espr" | "cbam" | "ai_act" | "imo_nzf";

export type RegCategory =
  | "순환경제"
  | "탄소·기후"
  | "AI·디지털"
  | "해운·물류";

export type PhaseType = "지금" | "준비" | "모니터링";

export type StageStatus =
  | "in_progress"
  | "done"
  | "not_started";

export type CommonStage =
  | "monitoring"
  | "drafting"
  | "consultation"
  | "adoption"
  | "entry_into_force"
  | "implementation"
  | "active"
  | "suspended"
  | "repealed";

// ── reg_master ────────────────────────────────────────────────────────────────

export interface RegMaster {
  id: RegId;
  acronym: string;
  name_ko: string;
  name_en: string;
  region: string;
  jurisdiction: string;
  category: RegCategory;
  governance_type: string;
  legal_state: string;
  issuing_body: string;
  enforcing_body: string;
  official_reference: string;
  entry_into_force: string;
  summary_short: string;
  why_it_matters: string;
  korean_company_note: string;
  penalty_summary: string;
  confidence: "high" | "medium" | "low";
  last_verified_at: string;
  // UI 전용
  badge_color: string;
  status_label: string;
  status_tone: "success" | "warning" | "info" | "danger" | "uncertain";
}

export const REG_MASTER: RegMaster[] = [
  {
    id: "espr",
    acronym: "ESPR",
    name_ko: "지속가능제품 에코디자인 규정",
    name_en: "Ecodesign for Sustainable Products Regulation",
    region: "EU",
    jurisdiction: "European Union",
    category: "순환경제",
    governance_type: "framework",
    legal_state: "phased_application",
    issuing_body: "European Parliament & Council",
    enforcing_body: "European Commission DG GROW",
    official_reference: "Regulation (EU) 2024/1781 / CELEX:32024R1781",
    entry_into_force: "2024-07-18",
    summary_short:
      "EU 시장에 출시되는 모든 물리적 제품의 에코디자인 요건을 규정하는 기본법. 위임법(Delegated Acts)을 통해 제품군별 세부 기준을 순차 설정함.",
    why_it_matters:
      "EU 시장에 제품을 수출하는 제조사·수입업자는 제품 설계 단계부터 에코디자인 기준을 충족해야 하며, 위임법 발효 후 18개월 내 의무 적용. 미충족 시 EU 시장 접근 차단.",
    korean_company_note:
      "전자·반도체, 철강, 섬유, 자동차 부품 등 EU 수출 비중이 높은 한국 제조사에 직접 적용. ESPR은 DPP(디지털 제품 여권) 의무를 포함하므로 공급망 전체에 데이터 제공 의무 파급.",
    penalty_summary:
      "회원국이 자국 법으로 벌금 및 공공조달 배제 규정(Article 74). 구체적 금액은 회원국별 상이.",
    confidence: "high",
    last_verified_at: "2026-06-10",
    badge_color: "bg-teal-600",
    status_label: "위임법 준비 중",
    status_tone: "info",
  },
  {
    id: "cbam",
    acronym: "CBAM",
    name_ko: "탄소국경조정제도",
    name_en: "Carbon Border Adjustment Mechanism",
    region: "EU",
    jurisdiction: "European Union",
    category: "탄소·기후",
    governance_type: "multiphase",
    legal_state: "implementation",
    issuing_body: "European Parliament & Council",
    enforcing_body: "European Commission DG TAXUD",
    official_reference:
      "Regulation (EU) 2023/956, amended by Regulation (EU) 2025/2083 / CELEX:32023R0956",
    entry_into_force: "2023-05-17",
    summary_short:
      "EU로 수입되는 탄소집약적 제품에 EU ETS와 동등한 탄소 비용을 부과하는 제도. 시멘트·철강·알루미늄·비료·전력·수소 6개 품목에 적용. 2026년부터 확정기간 적용.",
    why_it_matters:
      "EU로 해당 제품을 수출하는 비EU 기업은 EU 수입업자를 통해 탄소 비용을 부담. ETS 무상할당 단계적 폐지와 연동되어 2034년까지 비용 부담 증가.",
    korean_company_note:
      "철강·알루미늄 EU 수출 비중이 높은 한국 제조사에 직접 적용. EU 수입업자가 내는 CBAM 인증서 비용이 한국 수출 제품 가격 경쟁력에 영향. 탄소 감축 데이터 제공 의무 부담.",
    penalty_summary:
      "인증서 미납부: €100/tCO₂e (Article 26(1)). 미승인 수입: €100의 3~5배/tCO₂e (Article 26(2)). 전환기간 미신고: €10~50/tCO₂e.",
    confidence: "high",
    last_verified_at: "2026-06-10",
    badge_color: "bg-violet-600",
    status_label: "확정기간 시행 중",
    status_tone: "success",
  },
  {
    id: "ai_act",
    acronym: "AI Act",
    name_ko: "인공지능법",
    name_en: "Artificial Intelligence Act",
    region: "EU",
    jurisdiction: "European Union",
    category: "AI·디지털",
    governance_type: "multiphase",
    legal_state: "phased_application",
    issuing_body: "European Parliament & Council",
    enforcing_body: "European Commission AI Office",
    official_reference: "Regulation (EU) 2024/1689 / CELEX:32024R1689",
    entry_into_force: "2024-08-01",
    summary_short:
      "AI 시스템의 리스크 수준에 따라 의무를 차등 부과하는 세계 최초 포괄적 AI 규제. 금지 AI(즉시), GPAI(2025-08), 고위험 AI(2026-08) 순으로 단계적 적용.",
    why_it_matters:
      "EU 시장에 AI 시스템을 공급·배포하는 기업은 리스크 등급에 따라 적합성 평가·등록·기술문서·인간 감독 의무 부담. 고위험 AI 의무는 2026-08-02부터 전면 적용.",
    korean_company_note:
      "EU에 AI 솔루션을 수출하거나 EU 기업과 AI 관련 계약을 맺는 한국 기업에 적용. 특히 제조·채용·신용평가·의료·교육 분야 AI 시스템은 고위험 분류 가능성 높음.",
    penalty_summary:
      "금지 AI 위반: 최대 €35M 또는 전 세계 연매출 7%. 고위험·GPAI 의무 위반: 최대 €15M 또는 3%. 허위 정보 제공: €7.5M 또는 1% (Article 99).",
    confidence: "high",
    last_verified_at: "2026-06-10",
    badge_color: "bg-indigo-600",
    status_label: "단계적 시행 중",
    status_tone: "warning",
  },
  {
    id: "imo_nzf",
    acronym: "IMO NZF",
    name_ko: "IMO 넷제로 프레임워크",
    name_en: "IMO Net-Zero Framework (MARPOL Annex VI Amendments)",
    region: "Global",
    jurisdiction: "International Maritime Organization",
    category: "해운·물류",
    governance_type: "legislative",
    legal_state: "rulemaking",
    issuing_body: "IMO Member States (MEPC)",
    enforcing_body: "IMO / Flag State Administrations",
    official_reference:
      "MARPOL Annex VI 개정안 (MEPC 83 승인, 채택 대기) / 2023 IMO GHG Strategy",
    entry_into_force: "시점 미정",
    summary_short:
      "국제 해운의 온실가스 감축을 위한 최초 글로벌 강제 규제. 연료 GHG 집약도 기준(GFI)과 탄소가격 메커니즘 결합. 5,000GT 이상 대형 선박 의무 적용 예정.",
    why_it_matters:
      "한국 선박 운항사 및 조선사에 직접 적용. 저탄소 연료 전환 비용 증가. 조선사는 신규 수주 선박 설계 기준 변경 필요.",
    korean_company_note:
      "해운사·조선사·선박 연료 공급사 전반. GFI 초과 시 탄소 비용 부담 및 크레딧 구매 의무.",
    penalty_summary:
      "GFI 초과 시 탄소 비용 부담 및 크레딧 구매. 구체적 금액은 채택 후 확정 예정.",
    confidence: "medium",
    last_verified_at: "2026-06-10",
    badge_color: "bg-cyan-800",
    status_label: "MEPC 채택 대기",
    status_tone: "uncertain",
  },
];

// ── reg_tracking ──────────────────────────────────────────────────────────────

export interface RegTracking {
  regulation_id: RegId;
  lifecycle_status: string;
  current_stage_label: string;
  current_stage_owner: string;
  current_stage_status: StageStatus;
  next_event_label: string;
  next_event_type: string;
  next_event_expected_date: string;
  date_precision: "day" | "month" | "quarter" | "year";
  next_event_status: "scheduled" | "expected" | "uncertain";
  business_action_now: string;
  business_action_before: string;
  schedule_risk_level: "low" | "medium" | "high";
  schedule_risk_message: string;
  has_tracking_units: boolean;
  litigation_risk_flag: boolean;
  delay_risk_flag: boolean;
  common_stage: CommonStage;
  last_verified_at: string;
  // 다음 이벤트 ISO date (D-day 계산용 — day/month precision만 설정)
  next_event_date_iso: string | null;
}

export const REG_TRACKING: RegTracking[] = [
  {
    regulation_id: "espr",
    lifecycle_status: "working_plan_adopted_delegated_acts_drafting",
    current_stage_label: "Working Plan 2025-2030 채택 완료 — 위임법 준비 단계",
    current_stage_owner: "European Commission DG GROW",
    current_stage_status: "in_progress",
    next_event_label: "철강·금속 위임법 초안 채택",
    next_event_type: "delegated_act",
    next_event_expected_date: "2026년 하반기 (예상)",
    date_precision: "year",
    next_event_status: "expected",
    business_action_now:
      "EU 수출 제품군 목록 작성 및 ESPR 적용 가능성 내부 점검 시작. 철강·섬유·타이어·알루미늄 등 해당 여부 사전 확인.",
    business_action_before:
      "철강 위임법 초안 공개 시 즉시 요건 분석 착수. 제품 데이터 수집 체계 마련.",
    schedule_risk_level: "medium",
    schedule_risk_message:
      "ESPR Working Plan은 예측가능성을 고려해 수립됐으나, 위임법별 준비연구·영향평가·이해관계자 협의 과정에 따라 일정 변동 가능성 있음. 에너지 관련 제품 19종은 2026-12-31까지 구법 이행 조치 유지.",
    has_tracking_units: true,
    litigation_risk_flag: false,
    delay_risk_flag: true,
    common_stage: "drafting",
    last_verified_at: "2026-06-10",
    next_event_date_iso: null,
  },
  {
    regulation_id: "cbam",
    lifecycle_status: "definitive_phase_active",
    current_stage_label:
      "확정기간 진행 중 — 2026년 수입분 배출량 데이터 수집 의무 적용 중. 인증서 구매: 2027-02-01부터. 첫 연간 신고·납부: 2027-09-30.",
    current_stage_owner: "European Commission DG TAXUD",
    current_stage_status: "in_progress",
    next_event_label: "최초 연간 CBAM 신고 및 인증서 제출 (2026년 수입분)",
    next_event_type: "deadline",
    next_event_expected_date: "2027-09-30",
    date_precision: "day",
    next_event_status: "scheduled",
    business_action_now:
      "EU 수입업자 또는 간접 세관 대리인이 CBAM 신고 의무 대상인지 확인. 2026년 수입분 탄소배출량 데이터 수집 및 제3자 검증 착수.",
    business_action_before:
      "2027-09-30까지 2026년 수입분 CBAM 신고서 제출 및 인증서 납부. 검증된 배출량 데이터 확보 필수.",
    schedule_risk_level: "medium",
    schedule_risk_message:
      "2027-09-30 첫 신고 기한(2025/2083으로 기존 5월 31일에서 연장). 인증서 구매는 2027년 2월부터 가능. 다운스트림 제품 범위 확대 제안(COM/2025/989)은 별도 입법 절차 진행 중.",
    has_tracking_units: true,
    litigation_risk_flag: false,
    delay_risk_flag: true,
    common_stage: "implementation",
    last_verified_at: "2026-06-10",
    next_event_date_iso: "2027-09-30",
  },
  {
    regulation_id: "ai_act",
    lifecycle_status: "high_risk_obligations_imminent",
    current_stage_label:
      "고위험 AI 의무 적용 임박 — 금지 AI·AI 리터러시 의무 이미 적용 중",
    current_stage_owner: "European Commission AI Office",
    current_stage_status: "in_progress",
    next_event_label: "고위험 AI 시스템(Annex III) 의무 전면 적용",
    next_event_type: "deadline",
    next_event_expected_date: "2026-08-02",
    date_precision: "day",
    next_event_status: "scheduled",
    business_action_now:
      "EU에 공급·배포하는 AI 시스템의 리스크 등급 분류 즉시 착수. 고위험 해당 여부 판단 및 적합성 평가 준비.",
    business_action_before:
      "2026-08-02 이전 고위험 AI 시스템 적합성 평가 완료, EU AI DB 등록, 기술문서·QMS 구축.",
    schedule_risk_level: "high",
    schedule_risk_message:
      "고위험 AI(Annex III) 의무 2026-08-02 적용. 규제 제품 내장 AI(Annex I)는 2027-08-02까지 추가 유예. GPAI 모델 의무는 이미 2025-08-02 적용 시작.",
    has_tracking_units: true,
    litigation_risk_flag: false,
    delay_risk_flag: false,
    common_stage: "implementation",
    last_verified_at: "2026-06-10",
    next_event_date_iso: "2026-08-02",
  },
  {
    regulation_id: "imo_nzf",
    lifecycle_status: "nzf_adoption_pending_mepc85",
    current_stage_label:
      "MARPOL 개정안 채택 대기 중 — MEPC 84 기술 가이드라인 작업 진행",
    current_stage_owner: "IMO MEPC",
    current_stage_status: "in_progress",
    next_event_label: "MARPOL Annex VI 개정안 공식 채택 (MEPC 85)",
    next_event_type: "vote",
    next_event_expected_date: "2026-11 (예상)",
    date_precision: "month",
    next_event_status: "expected",
    business_action_now:
      "IMO NZF 적용 대상 선박(5,000GT 이상) 보유·운항 여부 확인. 저탄소 연료 전환 로드맵 사전 검토.",
    business_action_before:
      "MEPC 85(2026-11) 채택 여부 모니터링. 채택 시 발효일(약 16개월 후, 2028-03 예상) 기준 이행 준비 착수.",
    schedule_risk_level: "high",
    schedule_risk_message:
      "2025-10 MEPC/ES.2에서 채택 1년 연기(미국 반대·사우디 주도). MEPC 84(2026-04)에서 기술 가이드라인 작업 진행. MEPC 85(2026-11) 채택 목표이나 정치적 합의 불확실. 채택 시 MARPOL 묵시적 수락(16개월) 거쳐 2028년 봄 발효 예상.",
    has_tracking_units: false,
    litigation_risk_flag: true,
    delay_risk_flag: true,
    common_stage: "consultation",
    last_verified_at: "2026-06-10",
    next_event_date_iso: null,
  },
];

// ── reg_scope ─────────────────────────────────────────────────────────────────

export interface RegScope {
  regulation_id: RegId;
  affected_industries: string[];
  affected_product_groups: string[];
  affected_company_types: string[];
  scope_inclusions: string;
  scope_exclusions: string;
  penalty_type: string;
  risk_level: "high" | "medium" | "low";
  risk_level_korean_companies: "high" | "medium" | "low";
  matching_tags: string[];
}

export const REG_SCOPE: RegScope[] = [
  {
    regulation_id: "espr",
    affected_industries: ["전자·반도체", "철강·금속", "섬유·패션", "자동차 부품", "배터리", "가구", "타이어", "화학"],
    affected_product_groups: ["철강", "알루미늄", "섬유·의류", "타이어", "가구·매트리스", "전자제품", "ICT", "에너지 관련 제품"],
    affected_company_types: ["제조사", "수입업자", "EU 역내 대리인", "유통사", "온라인 마켓플레이스 운영자"],
    scope_inclusions:
      "EU 시장에 출시되거나 서비스로 제공되는 모든 물리적 제품(부품·중간재 포함). 디지털 콘텐츠가 일체를 이루는 물리적 제품 포함.",
    scope_exclusions:
      "식품·사료·의약품·동물·식물·인체 유래 제품. 차량(단 타이어 제외). 국방·안보 전용 제품.",
    penalty_type: "market_ban",
    risk_level: "high",
    risk_level_korean_companies: "high",
    matching_tags: ["EU수출", "제조", "순환경제", "제품설계", "DPP", "공급망데이터"],
  },
  {
    regulation_id: "cbam",
    affected_industries: ["철강·금속", "시멘트", "알루미늄", "비료·화학", "에너지", "수소"],
    affected_product_groups: ["철강(Annex I CN코드)", "알루미늄(Annex I)", "시멘트", "비료(암모니아·질산·요소 등)", "전력", "수소", "일부 다운스트림 제품"],
    affected_company_types: ["EU 역내 수입업자(Authorised CBAM Declarant)", "간접 세관 대리인"],
    scope_inclusions:
      "Annex I 해당 CN코드 제품을 EU로 수입하는 모든 주체. 연간 50톤 초과 수입자(전력·수소 제외).",
    scope_exclusions:
      "연간 50톤 이하 수입(전력·수소 제외) — de minimis 면제(Regulation 2025/2083). EU 역내 생산 제품. EEA 국가·스위스 등 동등 탄소가격제 적용국 일부 면제.",
    penalty_type: "carbon_cost",
    risk_level: "high",
    risk_level_korean_companies: "high",
    matching_tags: ["EU수출", "철강", "알루미늄", "탄소비용", "ETS연동", "탄소배출량데이터"],
  },
  {
    regulation_id: "ai_act",
    affected_industries: ["AI·소프트웨어", "제조", "의료·헬스케어", "금융", "HR·채용", "교육", "교통·자율주행", "공공서비스"],
    affected_product_groups: ["고위험 AI(Annex III: 생체인식·인프라·교육·채용·신용·법집행·이민·사법 등)", "GPAI 모델", "금지 AI 8종"],
    affected_company_types: ["공급자(Provider)", "배포자(Deployer)", "수입업자", "유통사", "승인된 대리인"],
    scope_inclusions:
      "EU 시장에 출시되거나 EU 사용자에게 출력이 도달하는 모든 AI 시스템. 역외 공급자도 EU 대리인 지정 의무.",
    scope_exclusions:
      "순수 군사·국방 목적 AI. 연구·개발 목적(단, 시장 출시 전). 오픈소스 모델(일부 의무 면제, GPAI 제외).",
    penalty_type: "administrative_fine",
    risk_level: "high",
    risk_level_korean_companies: "high",
    matching_tags: ["AI", "EU수출", "고위험AI", "GPAI", "적합성평가", "기술문서"],
  },
  {
    regulation_id: "imo_nzf",
    affected_industries: ["해운·물류", "조선·선박", "선박 연료 공급"],
    affected_product_groups: ["5,000GT 이상 국제 항행 선박 (전체 CO₂의 85% 배출)"],
    affected_company_types: ["선박 소유자", "선박 운항사", "선박 관리사", "연료 공급사(벙커링)"],
    scope_inclusions:
      "총톤수 5,000GT 이상 국제 항행 선박. 기국 여부 무관, IMO 회원국 항구 기항 시 적용.",
    scope_exclusions:
      "5,000GT 미만 소형 선박(단계적 확대 가능성 있음). 국내 연안 항행 선박.",
    penalty_type: "carbon_cost",
    risk_level: "high",
    risk_level_korean_companies: "high",
    matching_tags: ["해운", "조선", "선박", "저탄소연료", "GHG", "탄소비용", "MARPOL"],
  },
];

// ── tracking_units ────────────────────────────────────────────────────────────

export interface TrackingUnit {
  unit_id: string;
  regulation_id: RegId;
  unit_type: string;
  unit_label: string;
  product_group: string;
  current_stage_label: string;
  stage_status: StageStatus;
  next_event: string;
  expected_date: string;
  mandatory_date: string | null;
  responsible_org: string;
  impact_note: string;
  confidence: "high" | "medium" | "low";
  litigation_risk_flag: boolean;
  delay_risk_flag: boolean;
  // D-day 계산용 (mandatory_date 우선, 없으면 null)
  dday_date_iso: string | null;
}

export const TRACKING_UNITS: TrackingUnit[] = [
  // ── ESPR ─────────────────────────────────────────────────────────────────
  {
    unit_id: "espr_da_steel",
    regulation_id: "espr",
    unit_type: "delegated_act",
    unit_label: "철강 위임법 (Iron & Steel DA)",
    product_group: "철강·금속",
    current_stage_label: "준비 연구 진행 중",
    stage_status: "in_progress",
    next_event: "위임법 초안 채택",
    expected_date: "2026 (예상)",
    mandatory_date: null,
    responsible_org: "European Commission DG GROW",
    impact_note:
      "Working Plan 원문 indicative 2026. 탄소발자국·재활용 함량·내구성 기준 확정 예정. CBAM 중복 검토 필요.",
    confidence: "medium",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  {
    unit_id: "espr_da_aluminium",
    regulation_id: "espr",
    unit_type: "delegated_act",
    unit_label: "알루미늄 위임법 (Aluminium DA)",
    product_group: "알루미늄",
    current_stage_label: "준비 연구 진행 중",
    stage_status: "in_progress",
    next_event: "위임법 초안 채택",
    expected_date: "2027 (예상)",
    mandatory_date: null,
    responsible_org: "European Commission DG GROW",
    impact_note:
      "Working Plan 원문 indicative 2027. 재활용 함량·탄소발자국 요건 대비 필요. ETS·CBAM 중복 적용.",
    confidence: "medium",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  {
    unit_id: "espr_da_textile",
    regulation_id: "espr",
    unit_type: "delegated_act",
    unit_label: "섬유·의류 위임법 (Textiles DA)",
    product_group: "섬유·패션",
    current_stage_label: "준비 연구 진행 중",
    stage_status: "in_progress",
    next_event: "위임법 초안 채택",
    expected_date: "2027 (예상)",
    mandatory_date: null,
    responsible_org: "European Commission DG GROW",
    impact_note:
      "Working Plan 원문 indicative 2027. 신발 미포함(별도 스터디). 내구성·재활용 함량·DPP 의무 적용 예정.",
    confidence: "medium",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  {
    unit_id: "espr_da_tyres",
    regulation_id: "espr",
    unit_type: "delegated_act",
    unit_label: "타이어 위임법 (Tyres DA)",
    product_group: "타이어",
    current_stage_label: "준비 연구 진행 중",
    stage_status: "in_progress",
    next_event: "위임법 초안 채택",
    expected_date: "2027 (예상)",
    mandatory_date: null,
    responsible_org: "European Commission DG GROW",
    impact_note:
      "Working Plan 원문 indicative 2027. 차량 제외 규정에도 타이어는 ESPR 적용. 재활용성·재활용 함량 기준 예정.",
    confidence: "medium",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  {
    unit_id: "espr_da_furniture",
    regulation_id: "espr",
    unit_type: "delegated_act",
    unit_label: "가구 위임법 (Furniture DA)",
    product_group: "가구",
    current_stage_label: "준비 연구 미시작",
    stage_status: "not_started",
    next_event: "위임법 초안 채택",
    expected_date: "2028 (예상)",
    mandatory_date: null,
    responsible_org: "European Commission DG GROW",
    impact_note:
      "Working Plan 원문 indicative 2028. 매트리스와 별도 위임법. 자원 사용·폐기물 감소 기준 예정.",
    confidence: "medium",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  {
    unit_id: "espr_da_mattresses",
    regulation_id: "espr",
    unit_type: "delegated_act",
    unit_label: "매트리스 위임법 (Mattresses DA)",
    product_group: "매트리스",
    current_stage_label: "준비 연구 미시작",
    stage_status: "not_started",
    next_event: "위임법 초안 채택",
    expected_date: "2029 (예상)",
    mandatory_date: null,
    responsible_org: "European Commission DG GROW",
    impact_note:
      "Working Plan 원문 indicative 2029. 6개 품목 중 가장 늦은 일정. 제품 수명 연장·소재 효율성 기준 예정.",
    confidence: "low",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  {
    unit_id: "espr_da_unsold",
    regulation_id: "espr",
    unit_type: "implementation_phase",
    unit_label: "미판매 소비자 제품 파기 금지",
    product_group: "의류·신발·액세서리",
    current_stage_label: "대기업 의무 적용 임박",
    stage_status: "in_progress",
    next_event: "대기업 파기 금지 의무 적용 시작",
    expected_date: "2026-07-19",
    mandatory_date: "2026-07-19",
    responsible_org: "European Commission",
    impact_note:
      "2026-07-19부터 Annex VII 대상 미판매 소비자 제품(의류·신발·액세서리) 파기 금지(ESPR Article 25). SME 제외. 중기업(50~249인)은 2030-07-19부터 적용.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: "2026-07-19",
  },
  {
    unit_id: "espr_da_dpp_registry",
    regulation_id: "espr",
    unit_type: "implementation_phase",
    unit_label: "DPP 레지스트리 구축",
    product_group: "전체",
    current_stage_label: "구축 진행 중",
    stage_status: "in_progress",
    next_event: "레지스트리 운영 시작",
    expected_date: "2026-07-19",
    mandatory_date: "2026-07-19",
    responsible_org: "European Commission",
    impact_note:
      "ESPR Article 13 기준 2026-07-19 구축 목표. 위임법별 DPP 등록 의무 시기는 각 위임법 채택 후 별도 확정.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: "2026-07-19",
  },
  // ── CBAM ─────────────────────────────────────────────────────────────────
  {
    unit_id: "cbam_transitional",
    regulation_id: "cbam",
    unit_type: "implementation_phase",
    unit_label: "전환기간 (Transitional Phase)",
    product_group: "전 품목",
    current_stage_label: "전환기간 종료",
    stage_status: "done",
    next_event: "—",
    expected_date: "2025-12-31 (종료)",
    mandatory_date: null,
    responsible_org: "European Commission DG TAXUD",
    impact_note:
      "2023-10-01~2025-12-31. 신고 의무만 있고 인증서 구매 불필요. 이 기간 데이터가 2027년 첫 신고 기준.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: null,
  },
  {
    unit_id: "cbam_definitive",
    regulation_id: "cbam",
    unit_type: "implementation_phase",
    unit_label: "확정기간 (Definitive Phase)",
    product_group: "전 품목",
    current_stage_label: "확정기간 진행 중 — 인증서 구매·신고 의무 적용",
    stage_status: "in_progress",
    next_event: "첫 연간 CBAM 신고 및 인증서 제출 (2026년 수입분)",
    expected_date: "2027-09-30",
    mandatory_date: "2027-09-30",
    responsible_org: "European Commission DG TAXUD",
    impact_note:
      "2026-01-01부터 EU 수입업자는 인증서 구매 의무. 인증서 구매 가능 시점: 2027-02-01. 연간 신고 기한: 매년 9월 30일(첫 신고 2027-09-30). 50톤 이하 de minimis 면제(전력·수소 제외).",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: "2027-09-30",
  },
  {
    unit_id: "cbam_declaration_2027",
    regulation_id: "cbam",
    unit_type: "reporting_phase",
    unit_label: "2026년 수입분 첫 연간 신고",
    product_group: "전 품목",
    current_stage_label: "신고 준비 중",
    stage_status: "in_progress",
    next_event: "연간 CBAM 신고서 제출 마감",
    expected_date: "2027-09-30",
    mandatory_date: "2027-09-30",
    responsible_org: "European Commission DG TAXUD",
    impact_note:
      "2026년 수입분에 대한 최초 연간 CBAM 신고. 2027-05-31에서 2027-09-30으로 기한 연장(2025/2083). 검증된 배출량 데이터·인증서 납부 포함.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: "2027-09-30",
  },
  {
    unit_id: "cbam_scope_extension",
    regulation_id: "cbam",
    unit_type: "implementation_phase",
    unit_label: "다운스트림 제품 범위 확대",
    product_group: "철강·알루미늄 다운스트림",
    current_stage_label: "삼자협상(trilogue) 진행 중",
    stage_status: "in_progress",
    next_event: "EU 입법 삼자협상 완료",
    expected_date: "2028-01-01 (예상)",
    mandatory_date: null,
    responsible_org: "European Parliament & Council & Commission",
    impact_note:
      "COM/2025/989 제안. 자동차·기계류·가전 등 철강·알루미늄 다운스트림 제품 추가. 범위 확대 시 한국 자동차·가전 수출사 신규 적용.",
    confidence: "low",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  // ── AI Act ────────────────────────────────────────────────────────────────
  {
    unit_id: "ai_act_prohibited",
    regulation_id: "ai_act",
    unit_type: "risk_tier",
    unit_label: "금지 AI (Prohibited AI Practices)",
    product_group: "금지 AI 8종",
    current_stage_label: "적용 완료 (2025-02-02~)",
    stage_status: "done",
    next_event: "—",
    expected_date: "2025-02-02 (적용 완료)",
    mandatory_date: null,
    responsible_org: "European Commission AI Office",
    impact_note:
      "Article 5 금지 행위 8종 적용 중(사회적 점수제, 잠재의식 조작, 실시간 생체인식 등). 위반 시 €35M 또는 7%.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: null,
  },
  {
    unit_id: "ai_act_gpai",
    regulation_id: "ai_act",
    unit_type: "risk_tier",
    unit_label: "범용 AI 모델 (GPAI)",
    product_group: "LLM·기반모델",
    current_stage_label: "적용 중 (2025-08-02~)",
    stage_status: "in_progress",
    next_event: "시장 출시 전 GPAI 모델 의무 준수 완료 기한",
    expected_date: "2027-08-02",
    mandatory_date: "2027-08-02",
    responsible_org: "European Commission AI Office",
    impact_note:
      "2025-08-02부터 GPAI 모델 공급자 의무 적용. 기술문서·저작권 정책·투명성 의무. 2025-08-02 이전 시장 출시 모델은 2027-08-02까지 유예.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: "2027-08-02",
  },
  {
    unit_id: "ai_act_high_risk_annex3",
    regulation_id: "ai_act",
    unit_type: "risk_tier",
    unit_label: "고위험 AI — Annex III (독립형)",
    product_group: "채용·신용·교육·의료·법집행 등",
    current_stage_label: "적용 임박 — 준비 기간 진행 중",
    stage_status: "in_progress",
    next_event: "고위험 AI 의무 전면 적용",
    expected_date: "2026-08-02",
    mandatory_date: "2026-08-02",
    responsible_org: "European Commission AI Office",
    impact_note:
      "2026-08-02부터 Annex III 독립형 고위험 AI 의무 전면 적용. 적합성 평가·EU AI DB 등록·QMS·기술문서·인간 감독·사후 모니터링 의무.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: "2026-08-02",
  },
  {
    unit_id: "ai_act_high_risk_annex1",
    regulation_id: "ai_act",
    unit_type: "risk_tier",
    unit_label: "고위험 AI — Annex I (규제 제품 내장)",
    product_group: "의료기기·기계·자동차 내장 AI",
    current_stage_label: "유예 기간 — 기존 규제 체계 전환 중",
    stage_status: "not_started",
    next_event: "규제 제품 내장 AI 의무 적용",
    expected_date: "2027-08-02",
    mandatory_date: "2027-08-02",
    responsible_org: "European Commission AI Office",
    impact_note:
      "Annex I 해당 규제 제품(의료기기·기계류·항공·자동차 등) 내장 AI는 2027-08-02까지 추가 유예. 해당 제품 기존 규정(CE마킹 등)과 병행 준수 필요.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: "2027-08-02",
  },
  // ── IMO NZF ───────────────────────────────────────────────────────────────
  {
    unit_id: "imo_nzf_strategy_2023",
    regulation_id: "imo_nzf",
    unit_type: "implementation_phase",
    unit_label: "2023 IMO GHG 전략 (MEPC 80 채택)",
    product_group: "국제 항행 선박 전체",
    current_stage_label: "채택 완료 — 감축 목표 확정",
    stage_status: "done",
    next_event: "—",
    expected_date: "2023-07-07 (채택 완료)",
    mandatory_date: null,
    responsible_org: "IMO MEPC",
    impact_note:
      "2030: 최소 20%(목표 30%) 감축. 2040: 최소 70%(목표 80%) 감축. 2050: 넷제로. 모두 2008년 대비. NZF는 이 목표를 이행하는 강제 수단.",
    confidence: "high",
    litigation_risk_flag: false,
    delay_risk_flag: false,
    dday_date_iso: null,
  },
  {
    unit_id: "imo_nzf_mepc85_adoption",
    regulation_id: "imo_nzf",
    unit_type: "implementation_phase",
    unit_label: "MARPOL Annex VI 개정안 공식 채택 (MEPC 85)",
    product_group: "5,000GT 이상 선박",
    current_stage_label: "채택 대기 — 합의 구축 중",
    stage_status: "in_progress",
    next_event: "MEPC 85 공식 채택 투표",
    expected_date: "2026-11 (예상)",
    mandatory_date: null,
    responsible_org: "IMO MEPC",
    impact_note:
      "MEPC 83(2025-04) 승인 → MEPC/ES.2(2025-10) 채택 연기(미국 반대·사우디 주도) → MEPC 84(2026-04) 기술 가이드라인 작업 → MEPC 85(2026-11) 채택 목표. 정치적 불확실성 높음.",
    confidence: "low",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  {
    unit_id: "imo_nzf_entry_into_force",
    regulation_id: "imo_nzf",
    unit_type: "implementation_phase",
    unit_label: "NZF 발효 (MARPOL 묵시적 수락)",
    product_group: "5,000GT 이상 선박",
    current_stage_label: "미시작 — 채택 이후 진행",
    stage_status: "not_started",
    next_event: "MARPOL 묵시적 수락 완료 → 발효",
    expected_date: "2028-Q1 (예상)",
    mandatory_date: null,
    responsible_org: "IMO / Flag State Administrations",
    impact_note:
      "MARPOL 묵시적 수락 절차: 채택 후 16개월. MEPC 85(2026-11) 채택 가정 시 2028년 봄 발효 예상. GFI 기준 2028~2035 연간 감축 목표 적용.",
    confidence: "low",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
  {
    unit_id: "imo_nzf_gfi_2028",
    regulation_id: "imo_nzf",
    unit_type: "reporting_phase",
    unit_label: "GFI 기준 준수 의무 시작",
    product_group: "5,000GT 이상 선박",
    current_stage_label: "미시작",
    stage_status: "not_started",
    next_event: "GFI Tier 1·2 기준 준수 의무 시작",
    expected_date: "2028 (예상)",
    mandatory_date: null,
    responsible_org: "IMO / Flag State Administrations",
    impact_note:
      "발효 후 GFI 기준 적용. 2008년 기준값 93.3 gCO₂eq/MJ 대비 연간 단계적 감축. Tier 1 초과 시 탄소 비용, Tier 2 초과 시 추가 크레딧 구매 의무.",
    confidence: "low",
    litigation_risk_flag: false,
    delay_risk_flag: true,
    dday_date_iso: null,
  },
];

// ── checkpoints ───────────────────────────────────────────────────────────────

export interface Checkpoint {
  checkpoint_id: string;
  regulation_id: RegId;
  phase: PhaseType;
  action: string;
  priority: "high" | "medium" | "low";
  target_function: string[];
  applies_to_condition: string;
  notes: string;
}

export const CHECKPOINTS: Checkpoint[] = [
  // ── ESPR ─────────────────────────────────────────────────────────────────
  {
    checkpoint_id: "espr_cp_01",
    regulation_id: "espr",
    phase: "지금",
    action: "EU 수출 제품군 목록 작성 및 ESPR 적용 가능성 내부 점검",
    priority: "high",
    target_function: ["ESG", "제품기획"],
    applies_to_condition: "eu_exporter",
    notes: "",
  },
  {
    checkpoint_id: "espr_cp_02",
    regulation_id: "espr",
    phase: "지금",
    action: "Working Plan 우선 품목군 중 자사 해당 여부 확인 (철강·알루미늄·섬유·타이어·가구)",
    priority: "high",
    target_function: ["ESG", "제품기획", "법무"],
    applies_to_condition: "manufacturer",
    notes: "",
  },
  {
    checkpoint_id: "espr_cp_03",
    regulation_id: "espr",
    phase: "지금",
    action: "2026-07-19 미판매 제품 파기 금지 대상 여부 확인 (의류·신발 취급 기업)",
    priority: "high",
    target_function: ["ESG", "법무"],
    applies_to_condition: "manufacturer",
    notes: "D-38 — 즉시 확인 필요",
  },
  {
    checkpoint_id: "espr_cp_04",
    regulation_id: "espr",
    phase: "준비",
    action: "제품 소재·화학물질 데이터 수집 체계 구축 (DPP 대비)",
    priority: "high",
    target_function: ["IT", "제품기획", "구매"],
    applies_to_condition: "eu_exporter",
    notes: "",
  },
  {
    checkpoint_id: "espr_cp_05",
    regulation_id: "espr",
    phase: "준비",
    action: "공급업체에 소재·탄소 데이터 제공 요청 절차 마련",
    priority: "medium",
    target_function: ["구매", "ESG"],
    applies_to_condition: "supply_chain",
    notes: "",
  },
  {
    checkpoint_id: "espr_cp_06",
    regulation_id: "espr",
    phase: "준비",
    action: "위임법 초안 공개 시 즉시 요건 분석 및 제품 설계 영향 검토",
    priority: "high",
    target_function: ["제품기획", "ESG", "법무"],
    applies_to_condition: "manufacturer",
    notes: "",
  },
  {
    checkpoint_id: "espr_cp_07",
    regulation_id: "espr",
    phase: "모니터링",
    action: "EC Green Forum 위임법 진행 현황 정기 모니터링 (월 1회)",
    priority: "medium",
    target_function: ["ESG"],
    applies_to_condition: "eu_exporter",
    notes: "",
  },
  {
    checkpoint_id: "espr_cp_08",
    regulation_id: "espr",
    phase: "모니터링",
    action: "DPP 레지스트리 운영 시작(2026-07-19) 이후 등록 의무 대상 여부 확인",
    priority: "medium",
    target_function: ["IT", "ESG"],
    applies_to_condition: "manufacturer",
    notes: "",
  },
  // ── CBAM ─────────────────────────────────────────────────────────────────
  {
    checkpoint_id: "cbam_cp_01",
    regulation_id: "cbam",
    phase: "지금",
    action: "EU 수출 제품이 CBAM Annex I 해당 CN코드인지 확인 (철강·알루미늄·시멘트·비료·수소·전력)",
    priority: "high",
    target_function: ["ESG", "법무", "무역"],
    applies_to_condition: "eu_exporter",
    notes: "TARIC 데이터베이스에서 CN코드 확인 가능",
  },
  {
    checkpoint_id: "cbam_cp_02",
    regulation_id: "cbam",
    phase: "지금",
    action: "연간 수입량 50톤 초과 여부 확인 — de minimis 면제 대상 여부 판단",
    priority: "high",
    target_function: ["ESG", "법무", "무역"],
    applies_to_condition: "eu_exporter",
    notes: "전력·수소는 50톤 면제 미적용",
  },
  {
    checkpoint_id: "cbam_cp_03",
    regulation_id: "cbam",
    phase: "지금",
    action: "EU 수입업자(바이어)에게 탄소 배출량 데이터 제공 체계 구축",
    priority: "high",
    target_function: ["ESG", "생산", "품질"],
    applies_to_condition: "eu_exporter",
    notes: "EU 수입업자가 CBAM 신고 의무자. 한국 수출사는 배출량 데이터 제공 협력 필요.",
  },
  {
    checkpoint_id: "cbam_cp_04",
    regulation_id: "cbam",
    phase: "준비",
    action: "2026년 생산·수출 제품의 Scope 1 직접 배출량 데이터 수집 및 제3자 검증",
    priority: "high",
    target_function: ["ESG", "생산", "품질"],
    applies_to_condition: "industry_steel",
    notes: "검증기관은 EU 인정기관 기준 충족 필요",
  },
  {
    checkpoint_id: "cbam_cp_05",
    regulation_id: "cbam",
    phase: "준비",
    action: "자국에서 이미 납부한 탄소 비용(국내 탄소세·ETS) 증빙 자료 준비 — CBAM 인증서 차감 근거",
    priority: "medium",
    target_function: ["ESG", "법무", "재무"],
    applies_to_condition: "eu_exporter",
    notes: "한국 배출권거래제(K-ETS) 납부 비용 일부 인정 가능성 검토 필요",
  },
  {
    checkpoint_id: "cbam_cp_06",
    regulation_id: "cbam",
    phase: "모니터링",
    action: "EU ETS 가격 동향 모니터링 — CBAM 인증서 비용 추정 근거",
    priority: "medium",
    target_function: ["ESG", "재무"],
    applies_to_condition: "eu_exporter",
    notes: "CBAM 인증서 가격 = EU ETS 주간 평균 경매 종가",
  },
  {
    checkpoint_id: "cbam_cp_07",
    regulation_id: "cbam",
    phase: "모니터링",
    action: "다운스트림 제품 범위 확대 입법(COM/2025/989) 삼자협상 진행 현황 모니터링",
    priority: "medium",
    target_function: ["ESG", "법무"],
    applies_to_condition: "industry_steel",
    notes: "자동차·가전 수출사는 신규 적용 여부 주시 필요",
  },
  // ── AI Act ────────────────────────────────────────────────────────────────
  {
    checkpoint_id: "ai_act_cp_01",
    regulation_id: "ai_act",
    phase: "지금",
    action: "EU 시장 대상 AI 시스템 전수 파악 및 Annex III 고위험 해당 여부 분류",
    priority: "high",
    target_function: ["ESG", "IT", "법무"],
    applies_to_condition: "eu_exporter",
    notes: "채용·신용·교육·의료·생체인식 분야 AI 우선 점검",
  },
  {
    checkpoint_id: "ai_act_cp_02",
    regulation_id: "ai_act",
    phase: "지금",
    action: "GPAI 모델(LLM 등) 공급·사용 여부 확인 — 2025-08-02 의무 이미 적용 중",
    priority: "high",
    target_function: ["IT", "법무"],
    applies_to_condition: "gpai_model",
    notes: "GPAI 공급자 의무: 기술문서·저작권 정책·투명성",
  },
  {
    checkpoint_id: "ai_act_cp_03",
    regulation_id: "ai_act",
    phase: "준비",
    action: "고위험 AI 시스템 적합성 평가(Conformity Assessment) 착수 — 2026-08-02 기한",
    priority: "high",
    target_function: ["IT", "법무", "ESG"],
    applies_to_condition: "high_risk_ai",
    notes: "자체 평가 또는 제3자 인증기관(Notified Body) 활용",
  },
  {
    checkpoint_id: "ai_act_cp_04",
    regulation_id: "ai_act",
    phase: "준비",
    action: "EU AI 데이터베이스(AI DB) 등록 준비 — 고위험 AI 시스템 사전 등록 의무",
    priority: "high",
    target_function: ["IT", "법무"],
    applies_to_condition: "high_risk_ai",
    notes: "",
  },
  {
    checkpoint_id: "ai_act_cp_05",
    regulation_id: "ai_act",
    phase: "준비",
    action: "품질관리시스템(QMS) 및 기술문서 체계 구축",
    priority: "high",
    target_function: ["IT", "법무", "ESG"],
    applies_to_condition: "high_risk_ai",
    notes: "ISO 9001 기반 QMS와 연계 가능",
  },
  {
    checkpoint_id: "ai_act_cp_06",
    regulation_id: "ai_act",
    phase: "모니터링",
    action: "Annex I 규제 제품 내장 AI 해당 여부 확인 — 2027-08-02 기한",
    priority: "medium",
    target_function: ["IT", "법무"],
    applies_to_condition: "regulated_product_ai",
    notes: "의료기기·기계류·자동차 내장 AI 별도 추적 필요",
  },
  {
    checkpoint_id: "ai_act_cp_07",
    regulation_id: "ai_act",
    phase: "모니터링",
    action: "EC AI Office 가이드라인 및 GPAI 행동규범 업데이트 모니터링",
    priority: "medium",
    target_function: ["IT", "ESG"],
    applies_to_condition: "eu_exporter",
    notes: "",
  },
  // ── IMO NZF ───────────────────────────────────────────────────────────────
  {
    checkpoint_id: "imo_nzf_cp_01",
    regulation_id: "imo_nzf",
    phase: "지금",
    action: "보유·운항 선박 중 5,000GT 이상 국제 항행 선박 파악 및 NZF 적용 대상 확인",
    priority: "high",
    target_function: ["ESG", "법무", "운항"],
    applies_to_condition: "ship_operator",
    notes: "",
  },
  {
    checkpoint_id: "imo_nzf_cp_02",
    regulation_id: "imo_nzf",
    phase: "지금",
    action: "현재 선박의 연간 GFI 기초 산정 — 2028 기준 대비 격차 파악",
    priority: "high",
    target_function: ["ESG", "기술", "운항"],
    applies_to_condition: "ship_operator",
    notes: "",
  },
  {
    checkpoint_id: "imo_nzf_cp_03",
    regulation_id: "imo_nzf",
    phase: "준비",
    action: "저탄소·무탄소 연료(암모니아·메탄올·LNG·수소 등) 전환 로드맵 수립",
    priority: "high",
    target_function: ["ESG", "기술", "구매"],
    applies_to_condition: "ship_operator",
    notes: "",
  },
  {
    checkpoint_id: "imo_nzf_cp_04",
    regulation_id: "imo_nzf",
    phase: "준비",
    action: "신규 선박 발주 시 NZF GFI 기준 충족 가능 연료 시스템 설계 반영",
    priority: "high",
    target_function: ["기술", "구매"],
    applies_to_condition: "manufacturer",
    notes: "조선사는 발주처 요구 사양 변경 대응 필요",
  },
  {
    checkpoint_id: "imo_nzf_cp_05",
    regulation_id: "imo_nzf",
    phase: "모니터링",
    action: "MEPC 85(2026-11) 채택 결과 모니터링 — 채택 시 발효일·GFI 기준값 확정",
    priority: "high",
    target_function: ["ESG", "법무"],
    applies_to_condition: "ship_operator",
    notes: "채택 연기 가능성 여전히 존재",
  },
  {
    checkpoint_id: "imo_nzf_cp_06",
    regulation_id: "imo_nzf",
    phase: "모니터링",
    action: "IMO GFI 레지스트리 구축 현황 및 크레딧 거래 세부 규칙 모니터링",
    priority: "medium",
    target_function: ["ESG", "재무"],
    applies_to_condition: "ship_operator",
    notes: "",
  },
];

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

export function getRegById(id: RegId): RegMaster | undefined {
  return REG_MASTER.find((r) => r.id === id);
}

export function getTrackingById(id: RegId): RegTracking | undefined {
  return REG_TRACKING.find((r) => r.regulation_id === id);
}

export function getScopeById(id: RegId): RegScope | undefined {
  return REG_SCOPE.find((r) => r.regulation_id === id);
}

export function getUnitsById(id: RegId): TrackingUnit[] {
  return TRACKING_UNITS.filter((u) => u.regulation_id === id);
}

export function getCheckpointsByReg(id: RegId): Checkpoint[] {
  return CHECKPOINTS.filter((c) => c.regulation_id === id);
}

export function getCheckpointsByPhase(phase: PhaseType): Checkpoint[] {
  return CHECKPOINTS.filter((c) => c.phase === phase);
}

export function calcDDay(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

/** 규제별 가장 가까운 D-day 이벤트 반환 (tracking_units 중 mandatory_date 기준) */
export function getNearestDDay(id: RegId): { dDay: number | null; label: string; iso: string | null } {
  const tracking = getTrackingById(id);
  const units = getUnitsById(id).filter((u) => u.dday_date_iso);

  // tracking 자체의 next_event_date_iso 우선
  if (tracking?.next_event_date_iso) {
    const d = calcDDay(tracking.next_event_date_iso);
    return { dDay: d, label: tracking.next_event_label, iso: tracking.next_event_date_iso };
  }

  // tracking_units에서 가장 가까운 미래 날짜
  const upcoming = units
    .map((u) => ({ dDay: calcDDay(u.dday_date_iso), label: u.unit_label, iso: u.dday_date_iso }))
    .filter((x) => x.dDay !== null && x.dDay >= 0)
    .sort((a, b) => (a.dDay ?? 9999) - (b.dDay ?? 9999));

  return upcoming[0] ?? { dDay: null, label: "다음 이벤트 확인 필요", iso: null };
}

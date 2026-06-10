// ─────────────────────────────────────────────────────────────────────────────
// regulation-db.mock.ts
// 향후 Google Sheet / Supabase 전환을 고려한 정적 mock DB
// 테이블 구조: reg_master, reg_tracking, reg_scope, tracking_units, checkpoints
// ─────────────────────────────────────────────────────────────────────────────

// ── 공통 타입 ─────────────────────────────────────────────────────────────────

export type RegId = "espr" | "cbam" | "ai-act" | "imo-nzf";

export type RegCategory =
  | "순환경제"
  | "탄소·기후"
  | "AI·디지털"
  | "공시·보고"
  | "공급망 실사";

export type PhaseType = "지금" | "준비" | "모니터링";

export type TrackingUnitStatus =
  | "적용 중"
  | "적용 예정"
  | "시행 완료"
  | "협상 중"
  | "준비 기간";

// ── reg_master ────────────────────────────────────────────────────────────────

export interface RegMaster {
  id: RegId;
  code: string;
  name_ko: string;
  name_en: string;
  category: RegCategory;
  description_short: string;
  official_url: string;
  badge_color: string; // tailwind bg-* class
  status_label: string;
  status_tone: "success" | "warning" | "info" | "danger" | "uncertain";
}

export const REG_MASTER: RegMaster[] = [
  {
    id: "espr",
    code: "ESPR",
    name_ko: "지속가능제품 에코디자인 규정",
    name_en: "Ecodesign for Sustainable Products Regulation",
    category: "순환경제",
    description_short:
      "EU 시장에 출시되는 제품의 에너지 효율, 내구성, 재활용 가능성, 디지털 제품 여권(DPP) 등을 의무화하는 규정. 품목별 위임법령을 통해 순차 적용.",
    official_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1781",
    badge_color: "bg-teal-600",
    status_label: "위임법 준비 중",
    status_tone: "info",
  },
  {
    id: "cbam",
    code: "CBAM",
    name_ko: "탄소국경조정메커니즘",
    name_en: "Carbon Border Adjustment Mechanism",
    category: "탄소·기후",
    description_short:
      "EU 수입 제품의 탄소 비용을 부과하는 메커니즘. 철강·알루미늄·시멘트·비료·전력·수소 6개 섹터 대상. 2026년부터 CBAM 인증서 구매 의무.",
    official_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R0956",
    badge_color: "bg-violet-600",
    status_label: "본격 단계 시행 중",
    status_tone: "success",
  },
  {
    id: "ai-act",
    code: "AI Act",
    name_ko: "EU AI 법",
    name_en: "EU Artificial Intelligence Act",
    category: "AI·디지털",
    description_short:
      "AI 시스템을 리스크 등급(금지·고위험·범용·저위험)별로 분류하고 의무를 부과하는 세계 최초 AI 규제. 2024년 8월 발효, 단계별 적용.",
    official_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    badge_color: "bg-indigo-600",
    status_label: "단계적 시행",
    status_tone: "warning",
  },
  {
    id: "imo-nzf",
    code: "IMO NZF",
    name_ko: "IMO 넷제로 프레임워크",
    name_en: "IMO Net-Zero Framework",
    category: "탄소·기후",
    description_short:
      "국제해사기구(IMO)의 해운 탄소중립 로드맵. 탄소 강도 기준(CII) 강화 및 글로벌 탄소 부과금(GFS) 도입을 포함. MEPC 협상 진행 중.",
    official_url: "https://www.imo.org/en/MediaCentre/PressBriefings/Pages/GHG-reduction-strategy.aspx",
    badge_color: "bg-cyan-800",
    status_label: "협상 진행 중",
    status_tone: "uncertain",
  },
];

// ── reg_tracking ──────────────────────────────────────────────────────────────

export interface RegTracking {
  regulation_id: RegId;
  current_stage_label: string;
  current_stage_detail: string;
  current_stage_owner: string;
  next_event_label: string;
  next_event_date: string; // ISO date string or "예상 YYYY.MM"
  next_event_date_iso: string | null; // for D-day calc
  next_event_is_confirmed: boolean;
  schedule_risk: "low" | "medium" | "high";
  schedule_risk_note: string;
  business_action_now: string;
  business_action_owners: string[];
  last_verified_at: string;
}

export const REG_TRACKING: RegTracking[] = [
  {
    regulation_id: "espr",
    current_stage_label: "위임법령 채택 준비",
    current_stage_detail: "규정 발효(2024.07.18) 후 품목별 위임법(Delegated Acts) 마련 중. 철강·전자·섬유가 우선 품목으로 선정.",
    current_stage_owner: "EU 집행위원회",
    next_event_label: "우선 품목군 위임법 초안 공개",
    next_event_date: "2026년 하반기 예상",
    next_event_date_iso: null,
    next_event_is_confirmed: false,
    schedule_risk: "medium",
    schedule_risk_note: "Omnibus 패키지 영향으로 위임법 채택 일정이 지연될 가능성 있음",
    business_action_now: "EU 수출 주요 제품군의 ESPR 해당 여부 사전 점검. 제품 데이터 관리 체계(DPP 대비) 준비 착수.",
    business_action_owners: ["제품기획팀", "ESG팀", "IT팀"],
    last_verified_at: "2026-06-09",
  },
  {
    regulation_id: "cbam",
    current_stage_label: "본격 단계 — 인증서 구매 의무",
    current_stage_detail: "2026.01.01부터 CBAM 인증서 구매 의무 발효. 수입업자는 전년도 수입분에 대한 인증서를 2027.05.31까지 제출해야 함.",
    current_stage_owner: "EU 집행위원회 / 관세청",
    next_event_label: "CBAM 인증서 판매 플랫폼 가동",
    next_event_date: "2027.02.01",
    next_event_date_iso: "2027-02-01",
    next_event_is_confirmed: true,
    schedule_risk: "low",
    schedule_risk_note: "일정 확정. 탄소 배출량 데이터 확보 지연 시 인증서 구매 비용 증가 가능",
    business_action_now: "EU 수출 철강·알루미늄 제품의 내재 탄소 배출량(EE) 계산 방법론 확정. 공급업체 탄소 데이터 제공 여부 확인.",
    business_action_owners: ["ESG팀", "구매팀", "재무팀"],
    last_verified_at: "2026-06-09",
  },
  {
    regulation_id: "ai-act",
    current_stage_label: "고위험 AI 의무 적용 임박",
    current_stage_detail: "금지 AI(2025.02) · GPAI(2025.08) 이미 적용 완료. 고위험 AI 시스템 의무(Annex III) 2026.08.02 시행 임박.",
    current_stage_owner: "EU 집행위원회 / 각국 AI 감독기관",
    next_event_label: "고위험 AI 의무 적용 시작 (Annex III)",
    next_event_date: "2026.08.02",
    next_event_date_iso: "2026-08-02",
    next_event_is_confirmed: true,
    schedule_risk: "high",
    schedule_risk_note: "2026.08.02 고정 기한. 채용·신용평가·의료·안전 AI 보유 기업은 즉시 대응 필요",
    business_action_now: "사내 AI 시스템 전체 목록 작성 및 리스크 등급 분류 착수. 고위험 해당 시 적합성 평가·등록 준비.",
    business_action_owners: ["법무팀", "IT팀", "ESG팀"],
    last_verified_at: "2026-06-09",
  },
  {
    regulation_id: "imo-nzf",
    current_stage_label: "MEPC 협상 진행 중",
    current_stage_detail: "MEPC 83(2025.04) 에서 글로벌 탄소 부과금(GFS) 및 탄소 강도 기준(CII 2.0) 초안 합의. 2025년 10월 MEPC 84 최종 채택 예정.",
    current_stage_owner: "IMO / 회원국",
    next_event_label: "IMO NZF 최종 채택 및 탄소 부과금 발효",
    next_event_date: "2027.01.01 예상",
    next_event_date_iso: "2027-01-01",
    next_event_is_confirmed: false,
    schedule_risk: "medium",
    schedule_risk_note: "MEPC 84 채택 결과에 따라 발효 시점과 부과금 구조 변동 가능",
    business_action_now: "현재 CII 등급(A~E) 유지 점검. 저탄소 연료(LNG·메탄올·암모니아) 전환 중장기 계획 검토.",
    business_action_owners: ["해운·물류팀", "ESG팀", "재무팀"],
    last_verified_at: "2026-06-09",
  },
];

// ── reg_scope ─────────────────────────────────────────────────────────────────

export interface RegScope {
  regulation_id: RegId;
  who_applies: string[];
  threshold_note: string;
  geography: string;
  product_categories: string[];
  exclusions: string;
}

export const REG_SCOPE: RegScope[] = [
  {
    regulation_id: "espr",
    who_applies: ["EU 시장 출시 제조사", "EU 수출 기업", "수입업자·유통사"],
    threshold_note: "품목별 위임법령에 따라 적용 범위 및 시점 상이",
    geography: "EU 전역",
    product_categories: ["철강·금속 제품", "전자·가전", "섬유·의류", "가구", "타이어", "배터리"],
    exclusions: "군사용·항공우주 제품 제외",
  },
  {
    regulation_id: "cbam",
    who_applies: ["EU 수입업자", "관세신고자", "CBAM 신고인"],
    threshold_note: "연간 수입 탄소 배출량 100tCO₂e 이하 소규모 수입업자는 간소화 적용",
    geography: "EU 전역 (역외 제조국 기준)",
    product_categories: ["철강·금속", "알루미늄", "시멘트", "비료", "전력", "수소"],
    exclusions: "EU ETS 가격에 상응하는 탄소 비용을 이미 지불한 경우 CBAM 면제",
  },
  {
    regulation_id: "ai-act",
    who_applies: ["AI 시스템 제공자(Provider)", "배포자(Deployer)", "EU 내 AI 운영 기업"],
    threshold_note: "고위험 AI(Annex III): 채용·신용·의료·교육·법집행·이민 분야 AI 시스템",
    geography: "EU 전역 및 EU 시장 대상 AI 시스템",
    product_categories: ["채용·HR 관리 AI", "신용평가 AI", "의료 진단 AI", "교육 평가 AI", "범용 AI(GPAI)"],
    exclusions: "국가 안보·군사 목적 AI, 개인 비상업적 사용 제외",
  },
  {
    regulation_id: "imo-nzf",
    who_applies: ["400GT 이상 국제 항해 선박", "선사·운항자", "연료 공급사"],
    threshold_note: "5,000GT 이상 선박: CII 등급 연간 의무 보고 / GFS: 전체 400GT+ 대상",
    geography: "국제 항해 전 노선",
    product_categories: ["벌크선", "컨테이너선", "탱커", "여객선·크루즈"],
    exclusions: "군함·군 지원 선박, 어선 제외",
  },
];

// ── tracking_units ────────────────────────────────────────────────────────────

export interface TrackingUnit {
  regulation_id: RegId;
  unit_name: string;
  status: TrackingUnitStatus;
  progress_pct: number;
  note: string;
}

export const TRACKING_UNITS: TrackingUnit[] = [
  // ESPR
  { regulation_id: "espr", unit_name: "철강·금속", status: "준비 기간", progress_pct: 20, note: "우선 품목 — 위임법 초안 준비 중" },
  { regulation_id: "espr", unit_name: "전자·가전", status: "준비 기간", progress_pct: 25, note: "에너지 관련 제품 우선 적용 예정" },
  { regulation_id: "espr", unit_name: "섬유·의류", status: "준비 기간", progress_pct: 15, note: "우선 품목 — 2028 적용 목표" },
  { regulation_id: "espr", unit_name: "타이어", status: "준비 기간", progress_pct: 30, note: "위임법 초안 공개 임박" },
  { regulation_id: "espr", unit_name: "가구", status: "준비 기간", progress_pct: 10, note: "2029년 이후 예상" },
  { regulation_id: "espr", unit_name: "배터리", status: "적용 예정", progress_pct: 60, note: "Battery Reg와 연계, DBP 2027 적용" },
  // CBAM
  { regulation_id: "cbam", unit_name: "철강·금속", status: "적용 중", progress_pct: 100, note: "2026.01.01 인증서 구매 의무 발효" },
  { regulation_id: "cbam", unit_name: "알루미늄", status: "적용 중", progress_pct: 100, note: "2026.01.01 인증서 구매 의무 발효" },
  { regulation_id: "cbam", unit_name: "시멘트", status: "적용 중", progress_pct: 100, note: "2026.01.01 인증서 구매 의무 발효" },
  { regulation_id: "cbam", unit_name: "비료", status: "적용 중", progress_pct: 100, note: "2026.01.01 인증서 구매 의무 발효" },
  { regulation_id: "cbam", unit_name: "전력·수소", status: "적용 중", progress_pct: 100, note: "2026.01.01 인증서 구매 의무 발효" },
  { regulation_id: "cbam", unit_name: "다운스트림 확장", status: "적용 예정", progress_pct: 20, note: "2028년 이후 확장 예정" },
  // AI Act
  { regulation_id: "ai-act", unit_name: "금지 AI (Annex I)", status: "시행 완료", progress_pct: 100, note: "2025.02.02 적용 완료" },
  { regulation_id: "ai-act", unit_name: "GPAI / 범용 AI", status: "시행 완료", progress_pct: 100, note: "2025.08.02 적용 완료" },
  { regulation_id: "ai-act", unit_name: "고위험 AI (Annex III)", status: "적용 예정", progress_pct: 70, note: "2026.08.02 D-53 임박" },
  { regulation_id: "ai-act", unit_name: "고위험 AI (Annex II)", status: "적용 예정", progress_pct: 50, note: "2027.08.02 적용 예정" },
  // IMO NZF
  { regulation_id: "imo-nzf", unit_name: "CII 탄소 강도 기준", status: "적용 중", progress_pct: 60, note: "현행 CII 시행 중, 2.0 강화 협상 중" },
  { regulation_id: "imo-nzf", unit_name: "GFS 글로벌 연료 기준", status: "협상 중", progress_pct: 40, note: "MEPC 84(2025.10) 채택 예정" },
  { regulation_id: "imo-nzf", unit_name: "탄소 부과금 (Levy)", status: "협상 중", progress_pct: 30, note: "2027.01.01 발효 목표 — 금액·구조 미확정" },
  { regulation_id: "imo-nzf", unit_name: "저탄소 연료 기준 (FuelEU)", status: "적용 예정", progress_pct: 20, note: "2027 이후 강화 일정 협의 중" },
];

// ── checkpoints ───────────────────────────────────────────────────────────────

export interface Checkpoint {
  id: string;
  regulation_id: RegId;
  phase: PhaseType;
  action: string;
  dept: string[];
  deadline_note: string;
  detail: string;
}

export const CHECKPOINTS: Checkpoint[] = [
  // ── 지금 (D-90 이내 / 즉시 착수) ────────────────────────────────────────
  {
    id: "cp-ai-1",
    regulation_id: "ai-act",
    phase: "지금",
    action: "AI 시스템 전체 목록 작성 및 리스크 등급 분류 착수",
    dept: ["법무팀", "IT팀"],
    deadline_note: "2026.08.02 이전 (D-53)",
    detail: "Annex III 고위험 분류 기준(채용·신용·의료·교육·법집행·이민)에 해당하는 AI 확인. 고위험 AI는 적합성 평가·EU DB 등록 필요.",
  },
  {
    id: "cp-cbam-1",
    regulation_id: "cbam",
    phase: "지금",
    action: "EU 수출 제품의 내재 탄소 배출량(EE) 계산 방법론 확정",
    dept: ["ESG팀", "재무팀"],
    deadline_note: "2026 하반기 — 2026년 수입분 신고 준비",
    detail: "CBAM 규정 방법론 또는 동등 국내 방법론 중 선택. 기본값(Default Values) 사용 시 비용 불이익 발생 가능.",
  },
  {
    id: "cp-cbam-2",
    regulation_id: "cbam",
    phase: "지금",
    action: "공급업체 탄소 데이터 제공 체계 구축",
    dept: ["구매팀", "ESG팀"],
    deadline_note: "2026 하반기",
    detail: "EU 수출 대상 철강·알루미늄 공급사에 내재 탄소 데이터(직접+간접 배출량) 요청. 미제공 시 기본값 적용.",
  },
  // ── 준비 (D-90~180 또는 위임법 채택 전) ─────────────────────────────────
  {
    id: "cp-espr-1",
    regulation_id: "espr",
    phase: "준비",
    action: "EU 수출 제품군 ESPR 대상 여부 내부 점검",
    dept: ["제품기획팀", "ESG팀"],
    deadline_note: "위임법 초안 공개 전 (2026 하반기 예상)",
    detail: "철강·전자·섬유·타이어 우선 품목 해당 여부 확인. 위임법 공개 즉시 의무 사항 분석 착수 가능하도록 내부 준비.",
  },
  {
    id: "cp-espr-2",
    regulation_id: "espr",
    phase: "준비",
    action: "디지털 제품 여권(DPP) 데이터 체계 설계 착수",
    dept: ["IT팀", "제품기획팀"],
    deadline_note: "2027 적용 품목 기준",
    detail: "ESPR 제9조 DPP 의무화 대비. 제품별 소재·에너지 데이터 수집 체계 및 QR/RFID 연동 방식 검토.",
  },
  {
    id: "cp-ai-2",
    regulation_id: "ai-act",
    phase: "준비",
    action: "GPAI 모델 사용 내역 투명성 의무 이행 점검",
    dept: ["법무팀", "IT팀"],
    deadline_note: "2026.08.02 이전",
    detail: "ChatGPT·Gemini 등 GPAI 모델을 제품·서비스에 통합한 경우 사용자 고지·저작권 정책 준수 여부 확인.",
  },
  {
    id: "cp-imo-1",
    regulation_id: "imo-nzf",
    phase: "준비",
    action: "현행 CII 등급(A~E) 연간 실적 점검 및 개선 계획 수립",
    dept: ["해운·물류팀", "ESG팀"],
    deadline_note: "2026 연간 보고 기준",
    detail: "CII D·E 등급 선박은 개선 조치 계획(SEEMP Part III) 제출 의무. 2027 GFS 발효 전 연료 효율 선행 개선 권고.",
  },
  // ── 모니터링 (중장기 / 협상 진행 중) ───────────────────────────────────
  {
    id: "cp-imo-2",
    regulation_id: "imo-nzf",
    phase: "모니터링",
    action: "저탄소 연료(LNG·메탄올·암모니아) 전환 중장기 로드맵 검토",
    dept: ["해운·물류팀", "재무팀"],
    deadline_note: "2027~2030 중장기",
    detail: "GFS 탄소 부과금 구조 확정 후 연료 전환 비용·편익 분석. 선박 개조 또는 신조 시 저탄소 연료 대응 여부 설계에 반영.",
  },
  {
    id: "cp-cbam-3",
    regulation_id: "cbam",
    phase: "모니터링",
    action: "다운스트림 CBAM 확장(2028+) 품목 사전 점검",
    dept: ["ESG팀", "법무팀"],
    deadline_note: "2028 확장 예정",
    detail: "유기화학물·플라스틱·기타 금속 등 다운스트림 확장 논의 모니터링. 확장 대상 품목 포함 시 대응 체계 확대 필요.",
  },
  {
    id: "cp-espr-3",
    regulation_id: "espr",
    phase: "모니터링",
    action: "에코디자인 요건 반영 제품 설계 지침 마련",
    dept: ["제품기획팀", "ESG팀"],
    deadline_note: "품목별 위임법 채택 후",
    detail: "내구성·수리 가능성·재활용 재료 함량 등 에코디자인 요건을 제품 설계 기준에 선제 반영. 위임법 확정 즉시 대응 가능하도록 준비.",
  },
];

// ── 편의 헬퍼 ─────────────────────────────────────────────────────────────────

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

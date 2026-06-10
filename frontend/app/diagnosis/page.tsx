"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────
type Priority = "즉시 대응" | "준비 필요" | "모니터링";

interface RegResult {
  code: string;
  name: string;
  priority: Priority;
  deadline: string;
  reason: string;
  color: string;
}

interface FormState {
  industry: string;
  companyType: string;
  regions: string[];
  revenue: string;
  listed: string;
  extra: string[];
  dataManagement: string;
}

// ─────────────────────────────────────────
// 규제 매핑 로직
// ─────────────────────────────────────────
function computeRegulations(form: FormState): RegResult[] {
  const results: RegResult[] = [];

  const hasEU     = form.regions.includes("EU");
  const hasUS     = form.regions.includes("미국·캘리포니아");
  const hasBattery    = form.extra.includes("배터리 생산");
  const hasAI         = form.extra.includes("AI 시스템 운영");
  const hasSupplyChain = form.extra.includes("공급망 보유");
  const isListed      = form.listed === "상장사";
  const isLargeRevenue = form.revenue === "1조 이상";
  const isMidRevenue   = form.revenue === "5000억~1조";
  const dataReady     = form.dataManagement === "완비";
  const dataPartial   = form.dataManagement === "일부 있음";

  // ── EU 수출 관련 규제 ──────────────────
  if (hasEU) {
    // CBAM: 이미 시행 중 (2026-01-01 본격 단계)
    results.push({
      code: "CBAM",
      name: "탄소국경조정메커니즘",
      priority: "즉시 대응",
      deadline: "2027-02-01 (인증서 구매 시작)",
      reason:
        "철강·알루미늄·시멘트·비료·수소 EU 수출 시 탄소 비용 발생. 2026년 수입분 재정책임 이미 발생 중. 탄소배출량 데이터 확보 시급.",
      color: "bg-violet-600",
    });

    // PPWR: D-64 (2026-08-12) → 즉시 대응
    results.push({
      code: "PPWR",
      name: "포장재 및 포장폐기물 규정",
      priority: "즉시 대응",
      deadline: "2026-08-12 (D-64)",
      reason:
        "EU 수출 제품 포장재의 재생원료 함량·재활용 가능성 의무화. 8월 12일부터 주요 조항 적용 시작.",
      color: "bg-cyan-600",
    });

    // EUDR: D-204 (2026-12-30) → 준비 필요
    results.push({
      code: "EUDR",
      name: "EU 산림벌채 규정",
      priority: "준비 필요",
      deadline: "2026-12-30 (대기업)",
      reason:
        "팜유·고무·목재·코코아·커피·대두 원료 포함 제품 EU 수출 시 공급망 추적·DDS 제출 의무. 데이터 준비 현황에 따라 긴급도 상이.",
      color: "bg-yellow-600",
    });

    // CSRD
    results.push({
      code: "CSRD",
      name: "기업 지속가능성 보고 지침",
      priority: isListed || isLargeRevenue || isMidRevenue ? "준비 필요" : "모니터링",
      deadline: "2028 (Wave 2 FY2027 기준)",
      reason: isListed
        ? "상장사로 EU 매출 규모에 따라 Wave 2 적용 가능성 높음. ESRS 간소화 버전 2026년 중 확정 예정."
        : "EU 내 순매출 €4.5억 초과 시 보고 의무 발생. EU 자회사·매출 규모 재확인 필요.",
      color: "bg-rose-600",
    });

    // CSDDD
    results.push({
      code: "CSDDD",
      name: "기업 지속가능성 실사 지침",
      priority: hasSupplyChain && (isLargeRevenue || isMidRevenue) ? "준비 필요" : "모니터링",
      deadline: "2029-07-26",
      reason:
        "Omnibus I로 직원 5,000명 초과 & EU 매출 €15억 초과 대기업 중심 축소. 공급망 보유 기업은 EU 고객사 실사 요청 대비.",
      color: "bg-orange-600",
    });

    // ESPR
    results.push({
      code: "ESPR",
      name: "지속가능제품 에코디자인 규정",
      priority: dataReady ? "모니터링" : "준비 필요",
      deadline: "품목별 위임입법 채택 후 순차 적용",
      reason:
        "철강·섬유·가구·타이어·전자 우선 품목. DPP 데이터 체계 미비 시 대응 난이도 높음.",
      color: "bg-teal-600",
    });
  }

  // ── 미국·캘리포니아 관련 규제 ──────────
  if (hasUS) {
    results.push({
      code: "SB253",
      name: "캘리포니아 기후공시법 (SB 253)",
      priority: isListed || isLargeRevenue ? "준비 필요" : "모니터링",
      deadline: "2026~ (단계적 적용)",
      reason:
        "캘리포니아 연매출 $10억+ 기업 Scope 1·2·3 온실가스 공시 의무. 상장사·대기업은 우선 대응 필요.",
      color: "bg-blue-600",
    });

    results.push({
      code: "SB261",
      name: "캘리포니아 기후리스크 공시 (SB 261)",
      priority: "모니터링",
      deadline: "2026~ (단계적 적용)",
      reason:
        "캘리포니아 연매출 $5억+ 기업 기후 재무 리스크 공시 의무. TCFD 프레임워크 기반.",
      color: "bg-sky-700",
    });
  }

  // ── AI 시스템 운영 ──────────────────────
  if (hasAI) {
    // AI Act Phase 3: 2026-08-02 → D-54 → 즉시 대응
    results.push({
      code: "AI Act",
      name: "EU AI 법",
      priority: "즉시 대응",
      deadline: "2026-08-02 (고위험 AI, D-54)",
      reason:
        "채용·신용평가·안전·의료 관련 AI는 고위험 분류 → 2026년 8월 의무화. GPAI(GPT류)는 2025.8 이미 적용 완료.",
      color: "bg-indigo-600",
    });
  }

  // ── 배터리 생산 ─────────────────────────
  if (hasBattery) {
    results.push({
      code: "Battery Reg",
      name: "EU 배터리 규정",
      priority: "준비 필요",
      deadline: "2027-02-18 (DBP 의무 시작)",
      reason:
        "EU 배터리 공급 시 탄소발자국 신고(이미 시작)·디지털 배터리 여권(DBP)·공급망 실사(Li·Co·Ni) 의무.",
      color: "bg-sky-600",
    });

    results.push({
      code: "DPP",
      name: "디지털 제품 여권 (ESPR 기반)",
      priority: dataReady ? "모니터링" : "준비 필요",
      deadline: "배터리 DBP 2027-02-18 / 기타 품목 미정",
      reason:
        "ESPR 제9조 기반 의무. 배터리 DBP 선행 적용 후 섬유·전자 순. 제품 데이터 관리 체계 구축 필요.",
      color: "bg-fuchsia-600",
    });
  }

  // ── 중복 제거 ───────────────────────────
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.code)) return false;
    seen.add(r.code);
    return true;
  });
}

// ─────────────────────────────────────────
// 칩 선택 컴포넌트
// ─────────────────────────────────────────
function ChipGroup({
  label,
  options,
  multi,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  multi: boolean;
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  function toggle(opt: string) {
    if (multi) {
      const arr = value as string[];
      onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    } else {
      onChange((value as string) === opt ? "" : opt);
    }
  }

  function isSelected(opt: string) {
    return multi ? (value as string[]).includes(opt) : value === opt;
  }

  return (
    <div>
      <p className="mb-2 text-xs font-bold text-slate-500">
        {label}
        {multi && <span className="ml-1 text-slate-400 font-normal">(복수 선택)</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
              isSelected(opt)
                ? "border-emeraldBrand bg-emeraldBrand text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-emeraldBrand hover:text-emeraldBrand"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 우선순위 배지
// ─────────────────────────────────────────
const PRIORITY_STYLE: Record<Priority, { bg: string; text: string; border: string; dot: string }> = {
  "즉시 대응": { bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200",   dot: "bg-red-500"   },
  "준비 필요": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  "모니터링":  { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
};

const CODE_COLORS: Record<string, string> = {
  CBAM:          "bg-violet-600",
  PPWR:          "bg-cyan-600",
  CSRD:          "bg-rose-600",
  CSDDD:         "bg-orange-600",
  ESPR:          "bg-teal-600",
  EUDR:          "bg-yellow-600",
  GCD:           "bg-lime-600",
  "AI Act":      "bg-indigo-600",
  "Battery Reg": "bg-sky-600",
  DPP:           "bg-fuchsia-600",
  SB253:         "bg-blue-600",
  SB261:         "bg-sky-700",
};

// ─────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────
export default function DiagnosisPage() {
  const [form, setForm] = useState<FormState>({
    industry: "",
    companyType: "",
    regions: [],
    revenue: "",
    listed: "",
    extra: [],
    dataManagement: "",
  });
  const [results, setResults] = useState<RegResult[] | null>(null);

  function handleDiagnose() {
    setResults(computeRegulations(form));
  }

  const isFormReady =
    form.industry !== "" &&
    form.companyType !== "" &&
    form.regions.length > 0 &&
    form.revenue !== "" &&
    form.listed !== "" &&
    form.dataManagement !== "";

  const grouped = results
    ? ({
        "즉시 대응": results.filter((r) => r.priority === "즉시 대응"),
        "준비 필요": results.filter((r) => r.priority === "준비 필요"),
        "모니터링":  results.filter((r) => r.priority === "모니터링"),
      } as Record<Priority, RegResult[]>)
    : null;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[900px] space-y-6 p-6">

          {/* 헤더 */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emeraldBrand">
              Impact ON ESG Regulation Intelligence
            </p>
            <h1 className="mt-1.5 text-2xl font-black text-navy">기업 진단</h1>
            <p className="mt-1 text-sm text-slate-400">기업 정보 입력 → 관련 EU/글로벌 규제 자동 매핑</p>
          </div>

          {/* 입력 폼 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-navy">기업 정보 입력</h2>

            {/* ① 업종 */}
            <ChipGroup
              label="① 업종"
              multi={false}
              options={["전자·반도체", "자동차", "철강", "배터리", "화학", "패션·섬유", "해운·물류", "기타 제조"]}
              value={form.industry}
              onChange={(v) => setForm({ ...form, industry: v as string })}
            />

            {/* ② 기업 유형 */}
            <ChipGroup
              label="② 기업 유형"
              multi={false}
              options={["제조사", "수입업자", "유통사", "금융기관", "선사"]}
              value={form.companyType}
              onChange={(v) => setForm({ ...form, companyType: v as string })}
            />

            {/* ③ 주요 수출지역 */}
            <ChipGroup
              label="③ 주요 수출지역"
              multi={true}
              options={["EU", "미국·캘리포니아", "해당없음"]}
              value={form.regions}
              onChange={(v) => setForm({ ...form, regions: v as string[] })}
            />

            {/* ④ 연매출 규모 */}
            <ChipGroup
              label="④ 연매출 규모"
              multi={false}
              options={["1조 이상", "5000억~1조", "5000억 미만"]}
              value={form.revenue}
              onChange={(v) => setForm({ ...form, revenue: v as string })}
            />

            {/* ⑤ 상장 여부 */}
            <ChipGroup
              label="⑤ 상장 여부"
              multi={false}
              options={["상장사", "비상장"]}
              value={form.listed}
              onChange={(v) => setForm({ ...form, listed: v as string })}
            />

            {/* ⑥ 추가 조건 */}
            <ChipGroup
              label="⑥ 추가 조건"
              multi={true}
              options={["공급망 보유", "AI 시스템 운영", "배터리 생산"]}
              value={form.extra}
              onChange={(v) => setForm({ ...form, extra: v as string[] })}
            />

            {/* ⑦ 제품 데이터 관리 */}
            <ChipGroup
              label="⑦ 제품 데이터 관리 수준"
              multi={false}
              options={["완비", "일부 있음", "없음"]}
              value={form.dataManagement}
              onChange={(v) => setForm({ ...form, dataManagement: v as string })}
            />

            {/* 진단 버튼 */}
            <button
              type="button"
              onClick={handleDiagnose}
              disabled={!isFormReady}
              className={`w-full rounded-xl py-3.5 text-sm font-black transition-all ${
                isFormReady
                  ? "bg-navy text-white hover:bg-navy/90 shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              규제 진단하기 →
            </button>
            {!isFormReady && (
              <p className="text-center text-xs text-slate-400">
                ①②③④⑤⑦ 항목을 모두 선택하면 진단이 활성화됩니다
              </p>
            )}
          </div>

          {/* 결과 */}
          {grouped && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-black text-navy">진단 결과</h2>
                <span className="rounded-full bg-emeraldBrand px-3 py-0.5 text-xs font-bold text-white">
                  총 {results!.length}개 규제
                </span>
              </div>

              {(["즉시 대응", "준비 필요", "모니터링"] as Priority[]).map((priority) => {
                const items = grouped[priority];
                if (items.length === 0) return null;
                const style = PRIORITY_STYLE[priority];
                return (
                  <div key={priority} className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden`}>
                    {/* 섹션 헤더 */}
                    <div className={`flex items-center gap-2 px-5 py-3 border-b ${style.border}`}>
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                      <span className={`text-sm font-black ${style.text}`}>{priority}</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${style.text} bg-white/70`}>
                        {items.length}개
                      </span>
                    </div>

                    {/* 규제 카드 목록 */}
                    <div className="divide-y divide-white/50">
                      {items.map((reg) => (
                        <div key={reg.code} className="flex items-start gap-4 px-5 py-4 bg-white/40">
                          <span
                            className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-black text-white ${
                              CODE_COLORS[reg.code] ?? "bg-slate-600"
                            }`}
                          >
                            {reg.code}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-navy">{reg.name}</p>
                            <p className="mt-0.5 text-xs font-bold text-slate-500">
                              📅 {reg.deadline}
                            </p>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                              {reg.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {results!.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                  <p className="text-sm text-slate-400">
                    선택한 조건에 해당하는 규제가 없습니다.
                  </p>
                </div>
              )}

              <p className="text-center text-[11px] text-slate-400">
                ※ 진단 결과는 입력 조건 기반 자동 매핑이며, 법적 조언을 대체하지 않습니다.
              </p>
            </div>
          )}

          {!results && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-sm text-slate-400">
                기업 정보를 입력하고 <strong>규제 진단하기</strong>를 클릭하면 해당 규제 매트릭스가 표시됩니다
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

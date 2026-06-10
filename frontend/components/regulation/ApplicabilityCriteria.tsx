import type { RegulationDetail } from "@/types/dashboard";

function stringifyThreshold(value: string | string[]) {
  return Array.isArray(value) ? value.join(" / ") : value;
}

function getCriterionState(key: string) {
  const normalized = key.toLowerCase();
  if (normalized.includes("exemption") || normalized.includes("예외")) {
    return { icon: "✗", label: "해당없음", tone: "bg-slate-100 text-slate-500" };
  }
  if (normalized.includes("scope") || normalized.includes("threshold")) {
    return { icon: "✓", label: "해당", tone: "bg-emerald-50 text-emerald-700" };
  }
  return { icon: "?", label: "확인필요", tone: "bg-amber-50 text-amber-700" };
}

export function ApplicabilityCriteria({
  regulation,
}: {
  regulation: RegulationDetail;
}) {
  const thresholds = Object.entries(regulation.legal.thresholds ?? {});
  const hasScope = thresholds.some(([key]) => key.toLowerCase().includes("scope"));
  const result = hasScope ? "해당 가능성 높음" : "품목 확인 필요";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-black text-navy">적용 대상 판단</h2>
          <p className="mt-1 text-sm text-slate-500">
            법적 적용 범위와 예외 조건을 먼저 확인합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {result}
        </span>
      </div>

      {thresholds.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {thresholds.map(([key, value]) => {
            const state = getCriterionState(key);
            return (
              <div key={key} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black uppercase text-slate-500">{key}</p>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${state.tone}`}
                  >
                    <span>{state.icon}</span>
                    {state.label}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {stringifyThreshold(value)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
          적용 대상 기준은 공식 문서 확인이 필요합니다.
        </div>
      )}
    </section>
  );
}

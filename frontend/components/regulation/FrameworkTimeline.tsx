import type { RegulationDetail } from "@/types/dashboard";

export function FrameworkTimeline({ regulation }: { regulation: RegulationDetail }) {
  const history = regulation.history ?? [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-black text-navy">프레임워크 진행 현황</h2>
        <p className="mt-1 text-sm text-slate-500">
          법 자체의 발효와 후속 세부규칙 준비를 분리해서 봅니다.
        </p>
      </div>
      <div className="space-y-3">
        {history.map((item, index) => (
          <div key={`${item.date}-${item.event}`} className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <p className="pt-2 text-xs font-bold text-slate-400">{item.date}</p>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800">
              <p className="text-sm font-black leading-snug">{item.event}</p>
              {item.source_org && <p className="mt-1 text-xs opacity-70">{item.source_org}</p>}
            </div>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <p className="pt-2 text-xs font-bold text-slate-400">현재</p>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
            <p className="text-sm font-black leading-snug">
              {regulation.tracking?.current_stage?.stage_label || "품목별 세부규칙 준비 단계"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

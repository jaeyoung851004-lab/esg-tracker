import type { RegulationDetail } from "@/types/dashboard";
import { getNextEventDateLabel, getNextEventLabel } from "@/lib/tracking";

function firstItems(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value.slice(0, 2) : [value];
}

function preferItems(primary?: string | string[], fallback?: string | string[]) {
  const primaryItems = firstItems(primary);
  return primaryItems.length > 0 ? primaryItems : firstItems(fallback);
}

export function PhaseCard({ regulation }: { regulation: RegulationDetail }) {
  const checkpoints = regulation.action_checkpoints ?? {};
  const phases = [
    {
      title: "법적 기반",
      date: regulation.legal.dates?.entry_into_force?.date || regulation.legal.dates?.adopted?.date || "확인 필요",
      active: false,
      obligations: firstItems(regulation.summary_short || regulation.summary),
    },
    {
      title: regulation.tracking?.current_stage?.stage_label || "현재 단계",
      date: "현재",
      active: true,
      obligations: preferItems(regulation.tracking?.business_action?.now, checkpoints["지금"]),
    },
    {
      title: getNextEventLabel(regulation),
      date: getNextEventDateLabel(regulation),
      active: false,
      obligations: preferItems(
        regulation.tracking?.business_action?.before_next_event,
        checkpoints["준비"]
      ),
    },
    {
      title: "의무 적용·집행",
      date: regulation.legal.dates?.application_date?.date || "단계별 적용",
      active: false,
      obligations: firstItems("증빙자료와 내부 통제 체계를 유지합니다."),
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-black text-navy">현재 단계 + 다음 이벤트</h2>
        <p className="mt-1 text-sm text-slate-500">
          다단계 시행형 규제는 단계별 의무를 분리해서 확인합니다.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {phases.map((phase, index) => (
          <div
            key={`${phase.title}-${index}`}
            className={`rounded-lg border p-4 ${
              phase.active
                ? "border-blue-300 bg-blue-50 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <p className="text-[11px] font-black text-slate-400">STEP {index + 1}</p>
            <h3 className="mt-2 text-sm font-black leading-snug text-navy">{phase.title}</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">{phase.date}</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
              {phase.obligations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

import type { RegulationDetail } from "@/types/dashboard";

export function UncertaintyBanner({ regulation }: { regulation: RegulationDetail }) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-xs font-black uppercase text-amber-700">Uncertain Track</p>
      <h2 className="mt-2 text-base font-black text-amber-950">
        {regulation.tracking?.current_stage?.stage_label || "입법·일정 불확실성 확인 필요"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-amber-900">
        {regulation.tracking?.schedule_risk?.user_message ||
          "일정과 최종 의무 범위가 불확실합니다. 현 단계에서는 기존 규제 방향과 공식 발표를 모니터링해야 합니다."}
      </p>
    </section>
  );
}

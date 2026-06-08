import type { RegulationDetail } from "@/types/dashboard";
import {
  formatTrackingDateLabel,
  formatTrackingEventTiming,
  hasTracking,
} from "@/lib/tracking";

type TimelineState = "done" | "current" | "next" | "upcoming";

const STATE_STYLE: Record<TimelineState, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  current: "border-blue-300 bg-blue-50 text-blue-700 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]",
  next: "border-orange-300 bg-orange-50 text-orange-700 border-dashed",
  upcoming: "border-slate-200 bg-slate-50 text-slate-500",
};

export function RegulationTimeline({
  regulation,
  dotted = false,
}: {
  regulation: RegulationDetail;
  dotted?: boolean;
}) {
  const history = regulation.history ?? [];
  const currentStage = regulation.tracking?.current_stage?.stage_label;
  const dday = hasTracking(regulation) ? formatTrackingEventTiming(regulation.tracking) : null;
  const items = [
    ...history.map((item) => ({
      key: `${item.date}-${item.event}`,
      date: item.date,
      label: item.event,
      source: item.source_org,
      state: "done" as TimelineState,
    })),
    currentStage
      ? {
          key: "current",
          date: "현재",
          label: currentStage,
          source: regulation.tracking?.current_stage?.stage_owner,
          state: "current" as TimelineState,
        }
      : null,
    {
      key: "next",
      date: hasTracking(regulation) ? formatTrackingDateLabel(regulation.tracking) : (regulation.card_date_value || regulation.deadline || "시점 미정"),
      label: regulation.tracking?.next_event?.event_label || regulation.card_date_label || "다음 이벤트 확인 필요",
      source: regulation.tracking?.next_event?.owner,
      state: "next" as TimelineState,
    },
  ].filter(Boolean);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-navy">현재 단계 + 다음 이벤트</h2>
          <p className="mt-1 text-sm text-slate-500">
            {dotted ? "입법 확정 전 단계는 점선으로 표시합니다." : "완료·현재·다음 이벤트를 시간순으로 봅니다."}
          </p>
        </div>
        {dday && (
          <span className="rounded-full bg-red-50 px-3 py-1 font-mono text-xs font-black text-red-600">
            {dday}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item!.key} className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <p className="pt-2 text-xs font-bold text-slate-400">{item!.date}</p>
            <div
              className={`relative rounded-lg border px-4 py-3 ${STATE_STYLE[item!.state]} ${
                dotted && item!.state !== "done" ? "border-dashed" : ""
              }`}
            >
              {index < items.length - 1 && (
                <span className="absolute left-[-18px] top-8 hidden h-[calc(100%+12px)] border-l border-slate-200 sm:block" />
              )}
              <p className="text-sm font-black leading-snug">{item!.label}</p>
              {item!.source && <p className="mt-1 text-xs opacity-70">{item!.source}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

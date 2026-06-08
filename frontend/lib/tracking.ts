import type {
  Regulation,
  RegulationDatePrecision,
  RegulationNextEventStatus,
  RegulationScheduleRiskLevel,
  RegulationTracking,
} from "@/types/dashboard";

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isScheduledDayEvent(tracking?: RegulationTracking) {
  const event = tracking?.next_event;
  return (
    event?.status === "scheduled" &&
    event.date_precision === "day" &&
    Boolean(event.expected_date?.match(ISO_DAY_PATTERN))
  );
}

export function calculateTrackingDDay(
  tracking?: RegulationTracking,
  today = new Date()
) {
  if (!isScheduledDayEvent(tracking)) return null;

  const eventDate = new Date(`${tracking?.next_event?.expected_date}T00:00:00`);
  if (Number.isNaN(eventDate.getTime())) return null;

  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  return Math.ceil(
    (eventDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatDay(value: string) {
  return value.replaceAll("-", ".");
}

function formatExpectedDate(
  value?: string,
  precision?: RegulationDatePrecision,
  status?: RegulationNextEventStatus
) {
  if (status === "delayed") return value ? `${value} 지연 가능` : "지연 가능";
  if (status === "uncertain") return value ? `${value} 불확실` : "시점 미정";
  if (!value) return "시점 미정";

  if (precision === "day") {
    return status === "scheduled" ? formatDay(value) : `${formatDay(value)} 예상`;
  }
  if (precision === "month") {
    const [year, month] = value.split("-");
    return year && month ? `${year}년 ${Number(month)}월 예상` : `${value} 예상`;
  }
  if (precision === "quarter") return `${value} 예상`;
  if (precision === "half_year") return `${value} 예상`;
  if (precision === "year") return `${value}년 예상`;
  return value || "시점 미정";
}

export function formatTrackingEventTiming(tracking?: RegulationTracking) {
  const event = tracking?.next_event;
  if (!event) return "시점 미정";

  const dDay = calculateTrackingDDay(tracking);
  if (dDay !== null) {
    if (dDay < 0) return "일정 도래";
    if (dDay === 0) return "D-Day";
    return `D-${dDay}`;
  }

  return formatExpectedDate(
    event.expected_date,
    event.date_precision,
    event.status
  );
}

export function formatTrackingDateLabel(tracking?: RegulationTracking) {
  const event = tracking?.next_event;
  if (!event) return "시점 미정";
  return formatExpectedDate(
    event.expected_date,
    event.date_precision,
    event.status
  );
}

export function getTrackingOwner(tracking?: RegulationTracking) {
  return (
    tracking?.current_stage?.stage_owner ||
    tracking?.next_event?.owner ||
    "담당 주체 확인 필요"
  );
}

export function getTrackingRiskLabel(level?: RegulationScheduleRiskLevel) {
  const labels: Record<RegulationScheduleRiskLevel, string> = {
    low: "낮음",
    medium: "중간",
    high: "높음",
    unknown: "미정",
  };
  return labels[level ?? "unknown"];
}

export function getTrackingRiskClass(level?: RegulationScheduleRiskLevel) {
  if (level === "high") return "border-red-100 bg-red-50 text-red-700";
  if (level === "medium") return "border-amber-100 bg-amber-50 text-amber-800";
  if (level === "low") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  return "border-slate-100 bg-slate-50 text-slate-600";
}

export function getTrackingEventSortValue(regulation: Regulation) {
  const dDay = calculateTrackingDDay(regulation.tracking);
  if (dDay !== null) return dDay;
  return Number.POSITIVE_INFINITY;
}

export function hasTracking(regulation: Regulation) {
  return Boolean(
    regulation.tracking?.current_stage?.stage_label ||
      regulation.tracking?.next_event?.event_label
  );
}

export function buildOneLineBrief(regulation: Regulation) {
  const event = regulation.tracking?.next_event?.event_label;
  if (event) return `${event} · ${formatTrackingDateLabel(regulation.tracking)}`;

  const label = regulation.display?.card_date_label || regulation.card_date_label;
  const value = regulation.display?.card_date_value || regulation.card_date_value;
  if (label || value) return [label, value].filter(Boolean).join(" · ");

  return regulation.summary_short || regulation.summary;
}

export function getRiskBorderClass(statusTone?: string) {
  if (statusTone === "danger" || statusTone === "delayed") return "border-red-500";
  if (statusTone === "warning" || statusTone === "uncertain") return "border-amber-500";
  if (statusTone === "info") return "border-blue-500";
  return "border-emerald-500";
}

import type { Regulation, RegulationTracking } from "@/types/dashboard";

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
  eventDate.setHours(0, 0, 0, 0);

  return Math.ceil(
    (eventDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatDay(value: string) {
  return value.replaceAll("-", ".");
}

export function formatNextEventDateText(tracking?: RegulationTracking) {
  const event = tracking?.next_event;
  if (tracking?.next_event_date_text) return tracking.next_event_date_text;
  if (!event?.expected_date) return "시점 미정";
  if (event.status === "delayed") return `${event.expected_date} 지연 가능`;
  if (event.status === "uncertain") return "시점 미정";

  if (event.date_precision === "day") {
    return event.status === "scheduled"
      ? formatDay(event.expected_date)
      : `${formatDay(event.expected_date)} 예상`;
  }

  if (event.date_precision === "month") {
    const [year, month] = event.expected_date.split("-");
    return year && month
      ? `${year}년 ${Number(month)}월 예상`
      : `${event.expected_date} 예상`;
  }

  if (event.date_precision === "unknown") return "시점 미정";
  return `${event.expected_date} 예상`;
}

export function formatTrackingDday(tracking?: RegulationTracking) {
  const dDay = calculateTrackingDDay(tracking);
  if (dDay === null) return null;
  if (dDay < 0) return "일정 도래";
  if (dDay === 0) return "D-Day";
  return `D-${dDay}`;
}

export function getCurrentStageLabel(regulation: Regulation) {
  return (
    regulation.tracking?.current_stage?.stage_label ||
    regulation.display?.status_label ||
    regulation.status ||
    "현재 단계 확인 필요"
  );
}

export function getNextEventLabel(regulation: Regulation) {
  return (
    regulation.tracking?.next_event?.event_label ||
    regulation.card_date_label ||
    regulation.display?.card_date_label ||
    "다음 이벤트 확인 필요"
  );
}

export function getNextEventDateLabel(regulation: Regulation) {
  if (regulation.tracking?.next_event) {
    return formatNextEventDateText(regulation.tracking);
  }
  return (
    regulation.card_date_value ||
    regulation.display?.card_date_value ||
    regulation.deadline ||
    "시점 미정"
  );
}

export function getTrackingOwner(tracking?: RegulationTracking) {
  return (
    tracking?.current_stage?.stage_owner ||
    tracking?.next_event?.owner ||
    "담당 주체 확인 필요"
  );
}

export function buildOneLineBrief(regulation: Regulation) {
  if (regulation.tracking?.one_line_brief) {
    return regulation.tracking.one_line_brief;
  }

  const event = regulation.tracking?.next_event?.event_label;
  if (event) return `${event} · ${formatNextEventDateText(regulation.tracking)}`;

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

export function hasTracking(regulation: Regulation) {
  return Boolean(
    regulation.tracking?.current_stage?.stage_label ||
      regulation.tracking?.next_event?.event_label
  );
}

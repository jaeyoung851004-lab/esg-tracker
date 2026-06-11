"use client";

import { useMemo, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import {
  REG_MASTER,
  REG_TRACKING,
  type RegId,
} from "@/data/regulation-db.mock";

const FILTERS = ["전체", "다음 이벤트", "일정 리스크", "현재 단계", "확인 필요"] as const;
type FilterType = (typeof FILTERS)[number];
type ChangeType = Exclude<FilterType, "전체">;

type TimelineItem = {
  id: string;
  regId: RegId;
  type: ChangeType;
  title: string;
  date: string;
  status: "scheduled" | "expected" | "uncertain" | "risk";
  detail: string;
};

const statusClass = {
  scheduled: "border-brand-100 bg-brand-50 text-brand-700",
  expected: "border-amber-200 bg-amber-50 text-amber-700",
  uncertain: "border-slate-200 bg-slate-100 text-slate-600",
  risk: "border-red-200 bg-red-50 text-red-700",
};

const statusLabel = {
  scheduled: "확정",
  expected: "예상",
  uncertain: "불확실",
  risk: "주의",
};

function formatDate(value: string) {
  if (!value) return "일정 미정";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(`${value}T00:00:00`));
  }
  return value;
}

function buildTimeline(): TimelineItem[] {
  return REG_TRACKING.flatMap((tracking) => {
    const reg = REG_MASTER.find((item) => item.id === tracking.regulation_id);
    if (!reg) return [];

    const baseDate = tracking.next_event_date_iso ?? tracking.last_verified_at;
    const riskStatus = tracking.schedule_risk_level === "high" ? "risk" : tracking.next_event_status;

    return [
      {
        id: `${tracking.regulation_id}-next-event`,
        regId: tracking.regulation_id,
        type: "다음 이벤트",
        title: tracking.next_event_label,
        date: tracking.next_event_date_iso ?? tracking.next_event_expected_date,
        status: tracking.next_event_status,
        detail: `${reg.acronym}의 다음 확인 지점이 ${tracking.next_event_expected_date}로 관리되고 있습니다.`,
      },
      {
        id: `${tracking.regulation_id}-risk`,
        regId: tracking.regulation_id,
        type: "일정 리스크",
        title: tracking.schedule_risk_message,
        date: tracking.last_verified_at,
        status: riskStatus,
        detail: `현재 일정 리스크는 ${tracking.schedule_risk_level === "high" ? "높음" : tracking.schedule_risk_level === "low" ? "낮음" : "중간"}으로 분류됩니다.`,
      },
      {
        id: `${tracking.regulation_id}-stage`,
        regId: tracking.regulation_id,
        type: "현재 단계",
        title: tracking.current_stage_label,
        date: tracking.last_verified_at,
        status: tracking.current_stage_status === "done" ? "scheduled" : "expected",
        detail: `${tracking.current_stage_owner} 기준으로 단계 상태가 업데이트되었습니다.`,
      },
      {
        id: `${tracking.regulation_id}-action`,
        regId: tracking.regulation_id,
        type: "확인 필요",
        title: tracking.business_action_now,
        date: baseDate,
        status: tracking.delay_risk_flag ? "risk" : "expected",
        detail: tracking.business_action_before,
      },
    ];
  });
}

const timelineItems = buildTimeline();

export default function ChangesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("전체");

  const filteredItems = useMemo(
    () =>
      activeFilter === "전체"
        ? timelineItems
        : timelineItems.filter((item) => item.type === activeFilter),
    [activeFilter]
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto max-w-[1040px] space-y-6 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              Regulation Change Timeline
            </p>
            <h1 className="mt-1 text-2xl font-black text-ink-900">최근 변경사항</h1>
            <p className="mt-1 text-sm text-slate-500">
              현재 mock 범위에서는 REG_TRACKING 기반으로 다음 이벤트, 단계, 리스크 변화를 임시 타임라인으로 표시합니다.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    activeFilter === filter
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand-600 hover:text-brand-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white shadow-none">
            <div className="grid grid-cols-[90px_1fr_120px_92px] gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-black text-slate-500">
              <span>규제</span>
              <span>변경 제목</span>
              <span>날짜</span>
              <span>상태</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const reg = REG_MASTER.find((target) => target.id === item.regId);
                return (
                  <article
                    key={item.id}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[90px_1fr_120px_92px]"
                  >
                    <div>
                      <span className="rounded bg-brand-600 px-2 py-0.5 text-[11px] font-black text-white">
                        {reg?.acronym ?? item.regId}
                      </span>
                      <p className="mt-2 text-[11px] font-bold text-slate-400">{item.type}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black leading-snug text-ink-900">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</p>
                    </div>
                    <p className="text-xs font-bold text-slate-600">{formatDate(item.date)}</p>
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass[item.status]}`}
                      >
                        {statusLabel[item.status]}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

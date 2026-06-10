"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import {
  REG_MASTER,
  CHECKPOINTS,
  calcDDay,
  REG_TRACKING,
  type RegId,
  type PhaseType,
} from "@/data/regulation-db.mock";

const CODE_COLORS: Record<string, string> = {
  ESPR: "bg-teal-600",
  CBAM: "bg-violet-600",
  "AI Act": "bg-indigo-600",
  "IMO NZF": "bg-cyan-800",
};

const PHASE_STYLE: Record<PhaseType, { bg: string; border: string; text: string; dot: string; headerBg: string }> = {
  지금: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
    headerBg: "bg-red-100",
  },
  준비: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    headerBg: "bg-amber-100",
  },
  모니터링: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400",
    headerBg: "bg-slate-100",
  },
};

const REG_FILTERS: { label: string; id: RegId | "전체" }[] = [
  { label: "전체", id: "전체" },
  { label: "ESPR", id: "espr" },
  { label: "CBAM", id: "cbam" },
  { label: "AI Act", id: "ai_act" },
  { label: "IMO NZF", id: "imo_nzf" },
];

export default function CheckpointsPage() {
  const [regFilter, setRegFilter] = useState<RegId | "전체">("전체");

  const filtered = CHECKPOINTS.filter(
    (cp) => regFilter === "전체" || cp.regulation_id === regFilter
  );

  const phases: PhaseType[] = ["지금", "준비", "모니터링"];

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
            <h1 className="mt-1 text-2xl font-black text-navy">체크포인트</h1>
            <p className="mt-1 text-sm text-slate-400">
              규제별 지금 / 준비 / 모니터링 단계 액션 아이템
            </p>
          </div>

          {/* 요약 배지 */}
          <div className="grid grid-cols-3 gap-3">
            {phases.map((phase) => {
              const count = CHECKPOINTS.filter((c) => c.phase === phase).length;
              const s = PHASE_STYLE[phase];
              return (
                <div key={phase} className={`rounded-xl border ${s.border} ${s.bg} px-4 py-3`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    <span className={`text-xs font-black ${s.text}`}>{phase}</span>
                  </div>
                  <p className={`mt-1 text-2xl font-black ${s.text}`}>{count}<span className="text-sm font-bold ml-0.5">건</span></p>
                </div>
              );
            })}
          </div>

          {/* 규제 필터 */}
          <div className="flex flex-wrap gap-2">
            {REG_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRegFilter(f.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  regFilter === f.id
                    ? "border-navy bg-navy text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emeraldBrand hover:text-emeraldBrand"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 체크포인트 목록 */}
          {phases.map((phase) => {
            const items = filtered.filter((c) => c.phase === phase);
            if (!items.length) return null;
            const s = PHASE_STYLE[phase];

            return (
              <div key={phase}>
                {/* 섹션 헤더 */}
                <div className={`mb-3 flex items-center gap-2 rounded-xl border ${s.border} ${s.headerBg} px-4 py-2.5`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  <span className={`text-sm font-black ${s.text}`}>{phase}</span>
                  <span className={`ml-auto text-xs font-bold ${s.text}`}>{items.length}건</span>
                </div>

                {/* 체크포인트 카드 */}
                <div className="space-y-3">
                  {items.map((cp) => {
                    const reg = REG_MASTER.find((r) => r.id === cp.regulation_id);
                    const tracking = REG_TRACKING.find((t) => t.regulation_id === cp.regulation_id);
                    const dDay = calcDDay(tracking?.next_event_date_iso ?? null);
                    return (
                      <div key={cp.checkpoint_id} className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden`}>
                        <div className="flex items-start gap-3 px-4 py-3.5 bg-white/60">
                          <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-black text-white ${CODE_COLORS[reg?.acronym ?? ""] ?? "bg-slate-600"}`}>
                            {reg?.acronym}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-navy">{cp.action}</p>
                            {cp.notes && (
                              <p className="mt-1 text-xs leading-relaxed text-slate-600">{cp.notes}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {cp.target_function.map((d) => (
                                <span key={d} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{d}</span>
                              ))}
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                cp.priority === "high" ? `${s.text} ${s.border} bg-white/70` :
                                "text-slate-500 border-slate-200 bg-white/70"
                              }`}>
                                {cp.priority === "high" ? "우선순위 높음" : cp.priority === "medium" ? "중간" : "낮음"}
                              </span>
                            </div>
                          </div>
                          {dDay !== null && dDay >= 0 && dDay <= 90 && (
                            <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 font-mono text-[11px] font-bold text-red-600">
                              D-{dDay}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <p className="text-center text-[11px] text-slate-400">
            ※ 체크포인트는 2026-06-11 기준 작성되었습니다. 규제 변경 시 업데이트됩니다.
          </p>

        </div>
      </div>
    </div>
  );
}

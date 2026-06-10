"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import {
  REG_MASTER,
  REG_TRACKING,
  REG_SCOPE,
  TRACKING_UNITS,
  calcDDay,
  type StageStatus,
} from "@/data/regulation-db.mock";

const CODE_COLORS: Record<string, string> = {
  ESPR: "bg-teal-600",
  CBAM: "bg-violet-600",
  "AI Act": "bg-indigo-600",
  "IMO NZF": "bg-cyan-800",
};

const STATUS_STYLE: Record<string, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  uncertain: "bg-orange-50 text-orange-700 border-orange-200",
};

const CATEGORY_FILTERS = ["전체", "순환경제", "탄소·기후", "AI·디지털", "해운·물류"];

function stageProgress(s: StageStatus): number {
  return s === "done" ? 100 : s === "in_progress" ? 65 : 5;
}

function stageLabel(s: StageStatus): string {
  return s === "done" ? "완료" : s === "in_progress" ? "진행 중" : "미시작";
}

function DDayBadge({ dDay }: { dDay: number | null }) {
  if (dDay === null) return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">예상</span>;
  if (dDay < 0) return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">시행 중</span>;
  if (dDay <= 90) return <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[11px] font-bold text-red-600">D-{dDay}</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">D-{dDay}</span>;
}

export default function RegulationsPage() {
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REG_MASTER.filter((reg) => {
      const matchCat = category === "전체" || reg.category === category;
      const matchQ =
        !q ||
        reg.acronym.toLowerCase().includes(q) ||
        reg.name_ko.toLowerCase().includes(q) ||
        reg.name_en.toLowerCase().includes(q) ||
        reg.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [category, query]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[1200px] space-y-5 p-6">

          {/* 헤더 */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emeraldBrand">
              Impact ON ESG Regulation Intelligence
            </p>
            <h1 className="mt-1 text-2xl font-black text-navy">규제 DB</h1>
            <p className="mt-1 text-sm text-slate-400">
              규제의 현재 단계, 다음 이벤트, 적용 범위, 체크포인트를 빠르게 확인합니다.
            </p>
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    category === cat
                      ? "border-navy bg-navy text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emeraldBrand hover:text-emeraldBrand"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-1 max-w-xs items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="text-xs text-slate-400">검색</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="규제명, 약칭 검색..."
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* 규제 카드 그리드 */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
            {filtered.map((reg) => {
              const tracking = REG_TRACKING.find((t) => t.regulation_id === reg.id);
              const scope = REG_SCOPE.find((s) => s.regulation_id === reg.id);
              const units = TRACKING_UNITS.filter((u) => u.regulation_id === reg.id).slice(0, 4);
              const dDay = calcDDay(tracking?.next_event_date_iso ?? null);

              return (
                <a
                  key={reg.id}
                  href={`/regulations/${reg.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emeraldBrand hover:shadow-md"
                >
                  {/* 상단 헤더 */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${CODE_COLORS[reg.acronym] ?? "bg-slate-600"}`}>
                        {reg.acronym}
                      </span>
                      <span className="text-xs text-slate-400">{reg.category}</span>
                    </div>
                    <DDayBadge dDay={dDay} />
                  </div>

                  <h3 className="text-base font-black text-navy leading-snug">{reg.name_ko}</h3>
                  <p className="mt-1 text-xs text-slate-400">{reg.name_en}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">{reg.summary_short}</p>

                  {/* 현재 단계 + 다음 이벤트 */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] text-slate-400 mb-0.5">현재 단계</p>
                      <p className="text-xs font-bold text-navy leading-snug line-clamp-2">{tracking?.current_stage_label}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400 truncate">{tracking?.current_stage_owner}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] text-slate-400 mb-0.5">다음 이벤트</p>
                      <p className="text-xs font-bold text-navy leading-snug line-clamp-2">{tracking?.next_event_label}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{tracking?.next_event_expected_date}</p>
                    </div>
                  </div>

                  {/* 적용 범위 */}
                  {scope && (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold text-slate-400 mb-1.5">적용 대상</p>
                      <div className="flex flex-wrap gap-1">
                        {scope.affected_company_types.slice(0, 3).map((w) => (
                          <span key={w} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 섹터 트래킹 미니 */}
                  {units.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400">단위 추적 현황</p>
                      {units.map((u) => (
                        <div key={u.unit_id} className="flex items-center gap-2">
                          <span className="w-24 shrink-0 text-[10px] text-slate-500 truncate">{u.unit_label}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-1.5">
                            <div
                              className="h-full rounded-full bg-emeraldBrand"
                              style={{ width: `${stageProgress(u.stage_status)}%` }}
                            />
                          </div>
                          <span className="w-14 shrink-0 text-right text-[10px] text-slate-500">{stageLabel(u.stage_status)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[reg.status_tone]}`}>
                      {reg.status_label}
                    </span>
                    <span className="text-xs font-bold text-emeraldBrand">상세 보기 →</span>
                  </div>
                </a>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
              조건에 맞는 규제가 없습니다.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

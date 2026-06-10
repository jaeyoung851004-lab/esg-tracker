import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import {
  REG_MASTER,
  REG_TRACKING,
  REG_SCOPE,
  TRACKING_UNITS,
  CHECKPOINTS,
  calcDDay,
  type RegId,
} from "@/data/regulation-db.mock";

export const dynamic = "force-dynamic";

const CODE_COLORS: Record<string, string> = {
  ESPR: "bg-teal-600",
  CBAM: "bg-violet-600",
  "AI Act": "bg-indigo-600",
  "IMO NZF": "bg-cyan-800",
};

const RISK_STYLE = {
  low: { label: "낮음", cls: "bg-green-50 text-green-700 border-green-200" },
  medium: { label: "중간", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "높음", cls: "bg-red-50 text-red-700 border-red-200" },
};

const PHASE_STYLE = {
  지금: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
  준비: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  모니터링: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
};

const STATUS_TONE_STYLE: Record<string, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  uncertain: "bg-orange-50 text-orange-700 border-orange-200",
};

function DDayBadge({ dDay }: { dDay: number | null }) {
  if (dDay === null) return <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-500">예상</span>;
  if (dDay < 0) return <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-500">시행 중</span>;
  if (dDay <= 90) return <span className="rounded-full bg-red-100 px-2.5 py-1 font-mono text-xs font-bold text-red-600">D-{dDay}</span>;
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-500">D-{dDay}</span>;
}

export default async function RegulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reg = REG_MASTER.find((r) => r.id === id);
  if (!reg) notFound();

  const tracking = REG_TRACKING.find((t) => t.regulation_id === reg.id);
  const scope = REG_SCOPE.find((s) => s.regulation_id === reg.id);
  const units = TRACKING_UNITS.filter((u) => u.regulation_id === reg.id);
  const checkpoints = CHECKPOINTS.filter((c) => c.regulation_id === reg.id);
  const dDay = calcDDay(tracking?.next_event_date_iso ?? null);
  const risk = tracking?.schedule_risk ?? "medium";
  const riskStyle = RISK_STYLE[risk];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[1000px] space-y-6 p-6">

          {/* 브레드크럼 */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <a href="/regulations" className="hover:text-emeraldBrand">규제 DB</a>
            <span>›</span>
            <span className="font-bold text-navy">{reg.code}</span>
          </div>

          {/* 헤더 */}
          <div className="flex items-start gap-3">
            <span className={`mt-1 shrink-0 rounded px-2.5 py-1 text-sm font-black text-white ${CODE_COLORS[reg.code] ?? "bg-slate-600"}`}>
              {reg.code}
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-navy">{reg.name_ko}</h1>
              <p className="mt-0.5 text-sm text-slate-400">{reg.name_en}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <DDayBadge dDay={dDay} />
              <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE_STYLE[reg.status_tone]}`}>
                {reg.status_label}
              </span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">{reg.description_short}</p>

          {/* 현재 단계 + 다음 이벤트 */}
          {tracking && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">현재 단계</p>
                <p className="text-sm font-black text-navy">{tracking.current_stage_label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{tracking.current_stage_detail}</p>
                <p className="mt-2 text-[11px] text-slate-400">담당: {tracking.current_stage_owner}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">다음 이벤트</p>
                <p className="text-sm font-black text-navy">{tracking.next_event_label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">{tracking.next_event_date}</span>
                  {!tracking.next_event_is_confirmed && (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">예상 일정</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold ${riskStyle.cls}`}>
                    일정 리스크 {riskStyle.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{tracking.schedule_risk_note}</p>
              </div>
            </div>
          )}

          {/* 지금 해야 할 일 */}
          {tracking && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black text-emeraldBrand mb-1">지금 해야 할 일</p>
              <p className="text-sm text-slate-700 leading-relaxed">{tracking.business_action_now}</p>
              <p className="mt-2 text-[11px] text-slate-500">담당: {tracking.business_action_owners.join(", ")}</p>
            </div>
          )}

          {/* 적용 범위 */}
          {scope && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black text-navy mb-3">적용 범위</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1.5">적용 대상</p>
                  <ul className="space-y-1">
                    {scope.who_applies.map((w) => (
                      <li key={w} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emeraldBrand" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1.5">적용 지역</p>
                  <p className="text-xs text-slate-600">{scope.geography}</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-400 mb-1">임계값</p>
                  <p className="text-xs text-slate-600">{scope.threshold_note}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1.5">대상 품목·섹터</p>
                  <div className="flex flex-wrap gap-1">
                    {scope.product_categories.map((p) => (
                      <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{p}</span>
                    ))}
                  </div>
                  {scope.exclusions && (
                    <p className="mt-2 text-[10px] text-slate-400">제외: {scope.exclusions}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 섹터·단위 트래킹 */}
          {units.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black text-navy mb-3">섹터 추적 현황</h2>
              <div className="space-y-3">
                {units.map((u) => (
                  <div key={u.unit_name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">{u.unit_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">{u.status}</span>
                        <span className="font-mono text-[11px] font-bold text-emeraldBrand">{u.progress_pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emeraldBrand transition-all"
                        style={{ width: `${u.progress_pct}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">{u.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 체크포인트 */}
          {checkpoints.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-navy">체크포인트</h2>
                <a href="/checkpoints" className="text-xs font-bold text-emeraldBrand hover:underline">전체 보기 →</a>
              </div>
              <div className="space-y-3">
                {(["지금", "준비", "모니터링"] as const).map((phase) => {
                  const items = checkpoints.filter((c) => c.phase === phase);
                  if (!items.length) return null;
                  const s = PHASE_STYLE[phase];
                  return (
                    <div key={phase}>
                      <div className={`mb-2 flex items-center gap-2 rounded-lg border ${s.border} ${s.bg} px-3 py-1.5`}>
                        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                        <span className={`text-xs font-black ${s.text}`}>{phase}</span>
                        <span className={`ml-auto text-[11px] font-bold ${s.text}`}>{items.length}건</span>
                      </div>
                      <div className="space-y-2 pl-2">
                        {items.map((cp) => (
                          <div key={cp.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                            <p className="text-xs font-bold text-navy">{cp.action}</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{cp.detail}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
                                {cp.deadline_note}
                              </span>
                              {cp.dept.map((d) => (
                                <span key={d} className="text-[10px] text-slate-400">{d}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 공식 출처 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-400 mb-1">공식 출처</p>
            <a
              href={reg.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-emeraldBrand hover:underline break-all"
            >
              {reg.official_url}
            </a>
            {tracking?.last_verified_at && (
              <p className="mt-1 text-[11px] text-slate-400">마지막 확인: {tracking.last_verified_at}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import {
  REG_MASTER,
  REG_TRACKING,
  CHECKPOINTS,
  calcDDay,
} from "@/data/regulation-db.mock";

// ── 뉴스 fetch (대시보드용) ───────────────────────────────────────────────────
function getApiBase() {
  return (
    process.env.ESG_TRACKER_API_BASE_URL ||
    process.env.NEXT_PUBLIC_ESG_TRACKER_API_BASE_URL ||
    "http://127.0.0.1:8000"
  );
}

async function getDashboardNews() {
  try {
    const res = await fetch(`${getApiBase()}/api/news?limit=20`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || [];
    return items
      .sort((a: any, b: any) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))
      .slice(0, 6);
  } catch {
    return [];
  }
}

async function getNewsTotalCount(): Promise<number> {
  try {
    const res = await fetch(`${getApiBase()}/api/news?limit=200`, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = await res.json();
    return (data.items || []).length;
  } catch {
    return 0;
  }
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(new Date(dateStr));
  } catch {
    return "";
  }
}

const CODE_COLORS: Record<string, string> = {
  ESPR: "bg-teal-600",
  CBAM: "bg-violet-600",
  "AI Act": "bg-indigo-600",
  "IMO NZF": "bg-cyan-800",
};

function codeColor(code: string) {
  return CODE_COLORS[code] ?? "bg-slate-600";
}

function DDayBadge({ dDay }: { dDay: number | null }) {
  if (dDay === null) return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">예상</span>;
  if (dDay < 0) return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">시행 중</span>;
  if (dDay <= 90) return <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[11px] font-bold text-red-600">D-{dDay}</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">D-{dDay}</span>;
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [latestNews, totalNewsCount] = await Promise.all([
    getDashboardNews(),
    getNewsTotalCount(),
  ]);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  // 규제별 D-day 계산
  const regWithDDay = REG_MASTER.map((reg) => {
    const tracking = REG_TRACKING.find((t) => t.regulation_id === reg.id);
    const dDay = calcDDay(tracking?.next_event_date_iso ?? null);
    return { reg, tracking, dDay };
  });

  // 이번 주 확인 이벤트 (D-day 기준 정렬)
  const upcomingEvents = [...regWithDDay]
    .sort((a, b) => {
      const da = a.dDay ?? 9999;
      const db = b.dDay ?? 9999;
      return da - db;
    });

  // 지금 단계 체크포인트 (최대 3개)
  const nowCheckpoints = CHECKPOINTS.filter((c) => c.phase === "지금").slice(0, 3);

  // 긴급 카운트 (D-90 이내)
  const urgentCount = regWithDDay.filter((r) => r.dDay !== null && r.dDay >= 0 && r.dDay <= 90).length;
  // 90일 내 일정 카운트
  const within90 = regWithDDay.filter((r) => r.dDay !== null && r.dDay >= 0 && r.dDay <= 90).length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[1200px] space-y-6 p-6">

          {/* 헤더 */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emeraldBrand">
              Impact ON ESG Regulation Intelligence
            </p>
            <h1 className="mt-1 text-2xl font-black text-navy">오늘의 규제 브리핑</h1>
            <p className="mt-0.5 text-sm text-slate-400">{today} · 모니터링 규제 {REG_MASTER.length}개 기준</p>
          </div>

          {/* 상단 4개 지표 */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "긴급 대응 필요", value: urgentCount, unit: "건", sub: "D-90 이내 규제", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
              { label: "90일 내 일정", value: within90, unit: "건", sub: "확정 기한 기준", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
              { label: "최근 30일 뉴스", value: totalNewsCount > 0 ? `${totalNewsCount}` : "—", unit: "건", sub: "Google News RSS 수집", color: "text-emeraldBrand", bg: "bg-white", border: "border-slate-200" },
              { label: "모니터링 규제", value: REG_MASTER.length, unit: "개", sub: "ESPR · CBAM · AI Act · IMO NZF", color: "text-navy", bg: "bg-white", border: "border-slate-200" },
            ].map((card) => (
              <div key={card.label} className={`rounded-xl border ${card.border} ${card.bg} p-5 shadow-sm`}>
                <p className="text-xs font-bold text-slate-400">{card.label}</p>
                <p className={`mt-2 text-3xl font-black ${card.color}`}>
                  {card.value}<span className="ml-0.5 text-base font-bold">{card.unit}</span>
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* 이번 주 확인해야 할 것 + 지금 체크포인트 */}
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

            {/* 규제 이벤트 카드 */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black text-navy">이번 주 확인해야 할 것</h2>
                  <p className="mt-0.5 text-xs text-slate-400">모니터링 규제 4개 기준 · D-day 순</p>
                </div>
                <a href="/regulations" className="text-xs font-bold text-emeraldBrand hover:underline">규제 DB 보기 →</a>
              </div>
              <div className="divide-y divide-slate-50">
                {upcomingEvents.map(({ reg, tracking, dDay }) => (
                  <a
                    key={reg.id}
                    href={`/regulations/${reg.id}`}
                    className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div className="mt-0.5 min-w-[52px] text-right">
                      <DDayBadge dDay={dDay} />
                    </div>
                    <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(reg.code)}`}>
                      {reg.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy">{tracking?.next_event_label ?? "다음 이벤트 확인 필요"}</p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{tracking?.business_action_now ?? ""}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {tracking?.next_event_date} · 담당: {tracking?.business_action_owners.join(", ")}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* 지금 체크포인트 */}
            <div className="overflow-hidden rounded-xl border border-red-100 bg-red-50 shadow-sm">
              <div className="flex items-center justify-between border-b border-red-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black text-red-700">지금 해야 할 일</h2>
                  <p className="mt-0.5 text-xs text-red-400">즉시 착수 필요 체크포인트</p>
                </div>
                <a href="/checkpoints" className="text-xs font-bold text-red-600 hover:underline">전체 보기 →</a>
              </div>
              <div className="divide-y divide-red-100">
                {nowCheckpoints.map((cp) => {
                  const reg = REG_MASTER.find((r) => r.id === cp.regulation_id);
                  return (
                    <div key={cp.id} className="flex items-start gap-3 px-5 py-3.5 bg-white/50">
                      <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(reg?.code ?? "")}`}>
                        {reg?.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-navy leading-snug">{cp.action}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">담당: {cp.dept.join(", ")}</p>
                        <p className="mt-0.5 text-[11px] text-red-600 font-bold">{cp.deadline_note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 규제 현황 카드 4개 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-navy">모니터링 규제 현황</h2>
              <a href="/regulations" className="text-xs font-bold text-emeraldBrand hover:underline">전체 보기 →</a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {regWithDDay.map(({ reg, tracking, dDay }) => (
                <a
                  key={reg.id}
                  href={`/regulations/${reg.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emeraldBrand hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(reg.code)}`}>
                      {reg.code}
                    </span>
                    <DDayBadge dDay={dDay} />
                  </div>
                  <p className="text-sm font-black text-navy leading-snug">{reg.name_ko}</p>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{reg.description_short}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-600">{tracking?.current_stage_label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 truncate">{tracking?.next_event_label}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* 주요 최신 뉴스 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-navy">주요 최신 뉴스</h2>
                <p className="mt-0.5 text-xs text-slate-400">Google News RSS · 규제, 지역, 반응 유형 태그 포함</p>
              </div>
              <a href="/news" className="text-xs font-bold text-emeraldBrand hover:underline">전체 보기 →</a>
            </div>

            {latestNews.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                뉴스를 불러오는 중이거나 수집된 기사가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {latestNews.map((item: any, idx: number) => {
                  const title = item.titleKo || item.title || item.originalTitle || "제목 없음";
                  const code = item.relatedRegulationNames?.[0] || item.regulationId?.toUpperCase() || "";
                  const date = formatDate(item.publishedAt);
                  return (
                    <a
                      key={`${item.url}-${idx}`}
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50"
                    >
                      <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(code)}`}>
                        {code || "—"}
                      </span>
                      <span className="flex-1 text-sm font-medium leading-snug text-navy hover:text-emeraldBrand">
                        {title}
                      </span>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {item.sourceRegion && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{item.sourceRegion}</span>
                        )}
                        {item.newsType && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{item.newsType}</span>
                        )}
                        {date && <span className="text-[10px] text-slate-400">{date}</span>}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

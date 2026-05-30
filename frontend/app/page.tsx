import { AlertCTA, NewsCard, PriorityCard, RegulationTable } from "@/components/cards";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getNews, getRegulations, getStats } from "@/lib/api";

export default async function DashboardPage() {
  const [regulations, news, stats] = await Promise.all([getRegulations(), getNews(), getStats()]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[1280px] space-y-4 p-5">

          {/* 페이지 헤더 */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-black text-navy">대시보드</h1>
              <p className="mt-1 text-sm text-slate-500">오늘 확인해야 할 규제 현황 — Impact ON Co.</p>
            </div>
            <p className="text-xs text-slate-400">마지막 업데이트  2026.05.28  09:30</p>
          </div>

          {/* Alert CTA */}
          <AlertCTA regulations={regulations} />

          {/* 메트릭 카드 */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="추적 규제" value={`${stats.totalRegulations}건`} sub="전체 해당 규제" />
            <MetricCard label="즉시 대응 필요" value={`${stats.urgentTasks}건`} sub="D-120 이내 마감" danger />
            <MetricCard label="평균 준비도" value={`${stats.averageReadiness}%`} sub="전사 대응 현황" />
            <MetricCard label="높은 우선순위" value={`${stats.highPriority}건`} sub="리스크 집중 관리" danger />
          </div>

          {/* 과제 + 뉴스 */}
          <div className="grid gap-4 xl:grid-cols-2">
            <PriorityCard regulations={regulations} />
            <NewsCard news={news} />
          </div>

          {/* 규제 테이블 */}
          <RegulationTable regulations={regulations} />

        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, danger = false }: { label: string; value: string; sub: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-black tracking-tight ${danger ? "text-red-600" : "text-navy"}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{sub}</p>
    </div>
  );
}

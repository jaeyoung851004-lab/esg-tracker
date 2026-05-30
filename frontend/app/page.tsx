import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getNews, getRegulations } from "@/lib/api";

export default async function DashboardPage() {
  const [regulations, news] = await Promise.all([getRegulations(), getNews()]);

  const now = new Date();

  // 시행 임박 (D-120 이내)
  const urgent = regulations
    .filter((r) => typeof r.dDay === "number" && r.dDay >= 0 && r.dDay <= 120)
    .sort((a, b) => (a.dDay ?? 999) - (b.dDay ?? 999))
    .slice(0, 3);

  // 주의 필요 (축소·지연 or 유예)
  const watchlist = regulations
    .filter((r) => r.statusTone === "delayed" || r.statusTone === "uncertain")
    .slice(0, 3);

  // 최근 업데이트 (단계적 시행 중이거나 새로 시행)
  const recentUpdates = regulations
    .filter((r) => r.statusTone === "partial" || r.statusTone === "success")
    .slice(0, 3);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[1280px] space-y-6 p-5">

          {/* 헤더 */}
          <div>
            <h1 className="text-xl font-black text-navy">대시보드</h1>
            <p className="mt-1 text-sm text-slate-500">오늘의 ESG 규제 브리핑 — Impact ON Co.</p>
          </div>

          {/* 3개 섹션 그리드 */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* 시행 임박 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs">!</span>
                  시행 임박
                </h2>
                <a href="/regulations" className="text-xs text-slate-400 hover:text-emeraldBrand">전체 보기 →</a>
              </div>
              <div className="space-y-3">
                {urgent.length === 0 && <p className="text-xs text-slate-400">해당 규제 없음</p>}
                {urgent.map((r) => (
                  <a key={r.id} href={`/regulations/${r.id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white bg-red-500 px-2 py-0.5 rounded">{r.code}</span>
                      <span className="text-xs font-bold text-red-500 font-mono">D-{r.dDay}</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-navy leading-snug line-clamp-2">{r.name_ko || r.title}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* 주의 필요 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs">⚠</span>
                  주의 필요
                </h2>
                <a href="/regulations" className="text-xs text-slate-400 hover:text-emeraldBrand">전체 보기 →</a>
              </div>
              <div className="space-y-3">
                {watchlist.length === 0 && <p className="text-xs text-slate-400">해당 규제 없음</p>}
                {watchlist.map((r) => (
                  <a key={r.id} href={`/regulations/${r.id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white bg-amber-500 px-2 py-0.5 rounded">{r.code}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.statusTone === "delayed" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      }`}>{r.status}</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-navy leading-snug line-clamp-2">{r.name_ko || r.title}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* 최근 업데이트 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs">↑</span>
                  최근 업데이트
                </h2>
                <a href="/regulations" className="text-xs text-slate-400 hover:text-emeraldBrand">전체 보기 →</a>
              </div>
              <div className="space-y-3">
                {recentUpdates.length === 0 && <p className="text-xs text-slate-400">해당 규제 없음</p>}
                {recentUpdates.map((r) => (
                  <a key={r.id} href={`/regulations/${r.id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white bg-emeraldBrand px-2 py-0.5 rounded">{r.code}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">{r.status}</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-navy leading-snug line-clamp-2">{r.name_ko || r.title}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 최신 뉴스 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-navy">최신 규제 뉴스</h2>
              <a href="/news" className="text-xs text-slate-400 hover:text-emeraldBrand">전체 보기 →</a>
            </div>
            <div className="divide-y divide-slate-100">
              {news.slice(0, 5).map((item: any) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                  <span className="w-20 shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-[10px] font-black text-slate-600">
                    {item.source}
                  </span>
                  <span className="flex-1 text-sm font-medium text-navy leading-snug">{item.title}</span>
                  <span className="shrink-0 text-xs text-slate-400">{item.age}</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

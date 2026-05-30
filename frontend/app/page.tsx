import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getNews, getRegulations } from "@/lib/api";

export default async function DashboardPage() {
  const [regulations, news] = await Promise.all([
    getRegulations(),
    getNews(),
  ]);

  // 시행 임박 (D-120 이내)
const urgent = regulations
  .filter((r) => typeof r.dDay === "number")
  .sort((a, b) => (a.dDay ?? 9999) - (b.dDay ?? 9999))
  .slice(0, 3);

  // 주의 필요
const watchlist = regulations
  .filter(
    (r) =>
      r.statusTone === "warning" ||
      r.statusTone === "delayed" ||
      r.statusTone === "uncertain" ||
      r.priority === "높음"
  )
  .slice(0, 3);

  // 최근 업데이트
 const recentUpdates = regulations.slice(0, 3);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <div className="mx-auto max-w-[1280px] space-y-6 p-5">
          {/* 헤더 */}
          <div>
            <h1 className="text-xl font-black text-navy">
              대시보드
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              오늘의 ESG 규제 브리핑 — Impact ON Co.
            </p>
          </div>

          {/* 카드 3개 */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* 시행 임박 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-600">
                    !
                  </span>
                  시행 임박
                </h2>

                <a
                  href="/regulations"
                  className="text-xs text-slate-400 hover:text-emeraldBrand"
                >
                  전체 보기 →
                </a>
              </div>

              <div className="space-y-3">
                {urgent.length === 0 && (
                  <p className="text-xs text-slate-400">
                    해당 규제 없음
                  </p>
                )}

                {urgent.map((r) => (
                  <a
                    key={r.id}
                    href={`/regulations/${r.id}`}
                    className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-black text-white">
                        {r.code}
                      </span>

                      <span className="font-mono text-xs font-bold text-red-500">
                        D-{r.dDay}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-navy">
                      {r.title}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            {/* 주의 필요 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs text-amber-600">
                    ⚠
                  </span>
                  주의 필요
                </h2>

                <a
                  href="/regulations"
                  className="text-xs text-slate-400 hover:text-emeraldBrand"
                >
                  전체 보기 →
                </a>
              </div>

              <div className="space-y-3">
                {watchlist.length === 0 && (
                  <p className="text-xs text-slate-400">
                    해당 규제 없음
                  </p>
                )}

                {watchlist.map((r) => (
                  <a
                    key={r.id}
                    href={`/regulations/${r.id}`}
                    className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-black text-white">
                        {r.code}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          r.statusTone === "delayed"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-navy">
                      {r.title}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            {/* 최근 업데이트 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
                    ↑
                  </span>
                  최근 업데이트
                </h2>

                <a
                  href="/regulations"
                  className="text-xs text-slate-400 hover:text-emeraldBrand"
                >
                  전체 보기 →
                </a>
              </div>

              <div className="space-y-3">
                {recentUpdates.length === 0 && (
                  <p className="text-xs text-slate-400">
                    해당 규제 없음
                  </p>
                )}

                {recentUpdates.map((r) => (
                  <a
                    key={r.id}
                    href={`/regulations/${r.id}`}
                    className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-emeraldBrand px-2 py-0.5 text-xs font-black text-white">
                        {r.code}
                      </span>

                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600">
                        {r.status}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-navy">
                      {r.title}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 최신 뉴스 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-navy">
                최신 규제 뉴스
              </h2>

              <a
                href="/news"
                className="text-xs text-slate-400 hover:text-emeraldBrand"
              >
                전체 보기 →
              </a>
            </div>

            <div className="divide-y divide-slate-100">
              {news.slice(0, 5).map((item: any) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50"
                >
                  <span className="w-20 shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-[10px] font-black text-slate-600">
                    {item.source}
                  </span>

                  <span className="flex-1 text-sm font-medium leading-snug text-navy">
                    {item.title}
                  </span>

                  <span className="shrink-0 text-xs text-slate-400">
                    {item.age}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

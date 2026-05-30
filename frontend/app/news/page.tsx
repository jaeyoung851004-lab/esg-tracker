import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getNews } from "@/lib/api";

export default async function NewsPage() {
  const news = await getNews();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[900px] space-y-5 p-5">
          <div>
            <h1 className="text-xl font-black text-navy">뉴스 & 인사이트</h1>
            <p className="mt-1 text-sm text-slate-500">글로벌 ESG 규제 최신 뉴스</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {news.length === 0 && (
                <div className="p-10 text-center text-sm text-slate-400">뉴스를 불러오는 중...</div>
              )}
              {news.map((item: any, i: number) => (
                <a key={item.id || i} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50">
                  <span className="mt-0.5 w-20 shrink-0 block rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-[10px] font-black text-slate-600 truncate">
                    {item.source}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy leading-snug">{item.title}</p>
                    {item.summary && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.summary}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{item.age || item.date}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch("/api/news?limit=30", {
          cache: "no-store",
        });

        const data = await res.json();
        setNews(data.news ?? []);
      } catch (error) {
        console.error("Failed to load news:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <div className="mx-auto max-w-[900px] space-y-5 p-5">
          <div>
            <h1 className="text-xl font-black text-navy">뉴스 & 인사이트</h1>
            <p className="mt-1 text-sm text-slate-500">
              글로벌 ESG 규제 최신 뉴스
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {loading && (
                <div className="p-10 text-center text-sm text-slate-400">
                  뉴스를 불러오는 중...
                </div>
              )}

              {!loading && news.length === 0 && (
                <div className="p-10 text-center text-sm text-slate-400">
                  표시할 뉴스가 없습니다.
                </div>
              )}

              {news.map((item, i) => (
                <a
                  key={item.id || i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50"
                >
                  <span className="mt-0.5 block w-20 shrink-0 truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-[10px] font-black text-slate-600">
                    {item.source}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-navy">
                      {item.title}
                    </p>

                    {item.country && (
                      <p className="mt-1 text-xs text-slate-400">
                        {item.country} · {item.newsType || "규제 뉴스"}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-xs text-slate-400">
                    {item.age || item.date}
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

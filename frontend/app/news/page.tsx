"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  titleKo: string;
  originalTitle: string;
  source: string;
  sourceCountryKo: string;
  publishedAt: string;
  url: string;
  regulationId: string;
  regulationName: string;
  stakeholderType: string;
  reactionType: string;
  countryKo: string;
  relevanceScore: number;
};

type NewsSection = {
  regulationId: string;
  regulationName: string;
  count: number;
  news: NewsItem[];
};

function formatDate(date: string) {
  if (!date) return "날짜 미확인";

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return "날짜 미확인";
  }
}

export default function NewsPage() {
  const [sections, setSections] = useState<NewsSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const response = await fetch("/api/news?limit=5", {
          cache: "no-store",
        });

        const data = await response.json();

        if (data.sections) {
          setSections(data.sections);
        } else if (data.news) {
          setSections([
            {
              regulationId: data.regulationId || "unknown",
              regulationName: data.regulationName || "뉴스",
              count: data.news.length,
              news: data.news,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to load news", error);
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Impact ON ESG 규제 트래커
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            뉴스 & 인사이트
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            주요 ESG 규제별로 글로벌 뉴스와 시장 반응을 분류합니다.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            규제별 뉴스를 불러오는 중입니다.
          </div>
        ) : (
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.regulationId}>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {section.regulationName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      관련 뉴스 {section.count}건
                    </p>
                  </div>

                  <a
                    href={`/api/news?regulationId=${section.regulationId}&limit=10`}
                    target="_blank"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    API 보기
                  </a>
                </div>

                {section.news.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                    현재 표시할 뉴스가 없습니다.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {section.news.map((item) => (
                      <article
                        key={`${item.regulationId}-${item.url}`}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                            {item.regulationName}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {item.stakeholderType}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {item.reactionType}
                          </span>
                        </div>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <h3 className="line-clamp-3 text-base font-bold leading-6 text-slate-900 hover:text-blue-700">
                            {item.titleKo}
                          </h3>
                        </a>

                        {item.originalTitle !== item.titleKo && (
                          <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                            원문: {item.originalTitle}
                          </p>
                        )}

                        <div className="mt-4 space-y-1 text-xs text-slate-500">
                          <p>
                            매체:{" "}
                            <span className="font-medium text-slate-700">
                              {item.source}
                            </span>
                          </p>
                          <p>
                            매체 국가/지역:{" "}
                            <span className="font-medium text-slate-700">
                              {item.sourceCountryKo}
                            </span>
                          </p>
                          <p>
                            관련 국가:{" "}
                            <span className="font-medium text-slate-700">
                              {item.countryKo}
                            </span>
                          </p>
                          <p>
                            보도일자:{" "}
                            <span className="font-medium text-slate-700">
                              {formatDate(item.publishedAt)}
                            </span>
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

type NewsItem = {
  titleKo?: string;
  originalTitle?: string;
  title?: string;
  source?: string;
  sourceCountryKo?: string;
  publishedAt?: string;
  date?: string;
  url?: string;
  regulationId?: string;
  regulationName?: string;
  stakeholderType?: string;
  reactionType?: string;
  countryKo?: string;
  relevanceScore?: number;
};

type NewsSection = {
  regulationId: string;
  regulationName: string;
  count: number;
  news: NewsItem[];
};

function formatDate(date?: string) {
  if (!date) return "날짜 미확인";

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  } catch {
    return "날짜 미확인";
  }
}

function getTitle(item: NewsItem) {
  return item.titleKo || item.title || item.originalTitle || "제목 없음";
}

function getAllSection(sections: NewsSection[]): NewsSection {
  const news = sections.flatMap((section) =>
    section.news.map((item) => ({
      ...item,
      regulationId: item.regulationId || section.regulationId,
      regulationName: item.regulationName || section.regulationName,
    }))
  );

return {
  regulationId: "all",
  regulationName: "전체",
  count: news.length,
  news: news.sort((a, b) => getTime(b) - getTime(a)),
};

export default function NewsPage() {
  const [sections, setSections] = useState<NewsSection[]>([]);
  const [activeRegulationId, setActiveRegulationId] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const response = await fetch("/api/news?limit=10", {
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

  const displaySections = useMemo(() => {
    if (sections.length === 0) return [];
    return [getAllSection(sections), ...sections];
  }, [sections]);

  const activeSection =
    displaySections.find((section) => section.regulationId === activeRegulationId) ||
    displaySections[0];

 function getTime(item: NewsItem) {
  const rawDate = item.publishedAt || item.date || "";
  const time = new Date(rawDate).getTime();
  return Number.isNaN(time) ? 0 : time;
}

const activeNews = [...(activeSection?.news ?? [])].sort((a, b) => {
  return getTime(b) - getTime(a);
});

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="mx-auto max-w-[1280px] space-y-6 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emeraldBrand">
              Impact ON ESG Regulation Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-black text-navy">
              뉴스 & 인사이트
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              주요 ESG 규제별 뉴스와 시장 반응을 매체, 지역, 플레이어, 반응 유형 기준으로 검증합니다.
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              규제별 뉴스를 불러오는 중입니다.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {displaySections.map((section) => {
                    const isActive = section.regulationId === activeRegulationId;

                    return (
                      <button
                        key={section.regulationId}
                        type="button"
                        onClick={() => setActiveRegulationId(section.regulationId)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          isActive
                            ? "bg-navy text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {section.regulationName}
                        <span className="ml-1 opacity-70">
                          {section.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="grid gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">선택 규제</p>
                  <p className="mt-2 text-lg font-black text-navy">
                    {activeSection?.regulationName ?? "전체"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">뉴스 수</p>
                  <p className="mt-2 text-lg font-black text-navy">
                    {activeNews.length}건
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">현재 상태</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    수집/분류 검증 중
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">데이터 기준</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Google News RSS · 최근 30일
                  </p>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-black text-navy">
                      {activeSection?.regulationName ?? "전체"} 뉴스 검증 리스트
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      보도일자, 매체, 지역, 플레이어, 반응 유형을 한 줄에서 확인합니다.
                    </p>
                  </div>

                  {activeSection?.regulationId && activeSection.regulationId !== "all" && (
                    <a
                      href={`/api/news?regulationId=${activeSection.regulationId}&limit=10`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emeraldBrand hover:underline"
                    >
                      API 보기
                    </a>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="w-28 px-4 py-3 text-left text-xs font-black text-slate-500">
                          보도일자
                        </th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-black text-slate-500">
                          규제
                        </th>
                        <th className="w-36 px-4 py-3 text-left text-xs font-black text-slate-500">
                          매체
                        </th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-black text-slate-500">
                          매체 지역
                        </th>
                        <th className="w-36 px-4 py-3 text-left text-xs font-black text-slate-500">
                          플레이어
                        </th>
                        <th className="w-36 px-4 py-3 text-left text-xs font-black text-slate-500">
                          반응 유형
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-black text-slate-500">
                          기사 제목
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activeNews.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-sm text-slate-400"
                          >
                            표시할 뉴스가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        activeNews.map((item, index) => (
                          <tr
                            key={`${item.regulationId}-${item.url}-${index}`}
                            className="hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                              {formatDate(item.publishedAt || item.date)}
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-navy px-2 py-1 text-[11px] font-black text-white">
                                {item.regulationName || item.regulationId || "-"}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-xs font-bold text-slate-700">
                              {item.source || "미확인"}
                            </td>

                            <td className="px-4 py-3 text-xs text-slate-600">
                              {item.sourceCountryKo || "미확인"}
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                                {item.stakeholderType || "미분류"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                {item.reactionType || "미분류"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <a
                                href={item.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold leading-snug text-navy hover:text-emeraldBrand hover:underline"
                              >
                                {getTitle(item)}
                              </a>
                              {item.originalTitle && item.originalTitle !== getTitle(item) && (
                                <p className="mt-1 text-xs text-slate-400">
                                  원문: {item.originalTitle}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

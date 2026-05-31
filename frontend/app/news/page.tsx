"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

type NewsItem = {
  id?: string;
  title?: string;
  titleKo?: string;
  originalTitle?: string;
  source?: string;
  sourceRegion?: string;
  publishedAt?: string;
  age?: string;
  url?: string;
  regulationId?: string;
  relatedRegulationNames?: string[];
  actorType?: string;
  newsType?: string;
  relevanceScore?: number;
};

type RegulationMeta = {
  id: string;
  code: string;
  name: string;
  count: number;
};

function formatDate(date?: string) {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

const CODE_COLORS: Record<string, string> = {
  ESPR: "bg-teal-600", PPWR: "bg-cyan-600", CSDDD: "bg-orange-600",
  CSRD: "bg-rose-600", CBAM: "bg-violet-600", EUDR: "bg-yellow-600",
  GCD: "bg-lime-600", "AI ACT": "bg-indigo-600", "AI Act": "bg-indigo-600",
  "BATTERY REG": "bg-sky-600", "Battery Reg": "bg-sky-600", DPP: "bg-fuchsia-600",
};

function codeColor(code: string) {
  return CODE_COLORS[code] ?? "bg-slate-600";
}

function getApiBase() {
  return (
    process.env.NEXT_PUBLIC_ESG_TRACKER_API_BASE_URL ||
    "https://esg-tracker.onrender.com"
  );
}

export default function NewsPage() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [regulations, setRegulations] = useState<RegulationMeta[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${getApiBase()}/api/news?limit=60`, {
          cache: "no-store",
        });
        const data = await res.json();
        const items: NewsItem[] = data.items || [];
        setAllNews(items.sort((a, b) => {
          const ta = Date.parse(a.publishedAt || "") || 0;
          const tb = Date.parse(b.publishedAt || "") || 0;
          return tb - ta;
        }));
        setRegulations(data.availableRegulations || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === "all") return allNews;
    return allNews.filter((item) => item.regulationId === activeTab);
  }, [allNews, activeTab]);

  const totalByTab = useMemo(() => {
    const map: Record<string, number> = { all: allNews.length };
    for (const reg of regulations) {
      map[reg.id] = reg.count;
    }
    return map;
  }, [allNews, regulations]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto max-w-[1280px] space-y-6 p-5">

          {/* 헤더 */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emeraldBrand">
              Impact ON ESG Regulation Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-black text-navy">뉴스 & 인사이트</h1>
            <p className="mt-2 text-sm text-slate-500">
              각 규제별 최근 30일 수집 결과를 합쳐서 보여주는 화면입니다.
            </p>
          </div>

          {/* 탭 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === "all" ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                전체 <span className="opacity-70">{totalByTab["all"] ?? 0}</span>
              </button>
              {regulations.map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setActiveTab(reg.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    activeTab === reg.id ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {reg.code} <span className="opacity-70">{reg.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 요약 카드 */}
          <div className="grid gap-4 lg:grid-cols-4">
            {[
              { label: "선택 규제", value: activeTab === "all" ? "전체" : regulations.find(r => r.id === activeTab)?.code ?? activeTab },
              { label: "표시 기사", value: `${filtered.length}건` },
              { label: "시행/단계 적용", value: `${regulations.filter(r => r.count > 0).length}개` },
              { label: "데이터 기준", value: "Google News RSS · 최근 30일" },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400">{card.label}</p>
                <p className="mt-2 text-sm font-black text-navy">{card.value}</p>
              </div>
            ))}
          </div>

          {/* 뉴스 테이블 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-black text-navy">
                {activeTab === "all" ? "전체" : regulations.find(r => r.id === activeTab)?.code ?? activeTab} 뉴스 목록
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                보도일자, 매체, 지역, 플레이어, 반응 유형을 한 줄에서 확인합니다.
              </p>
            </div>

            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">뉴스를 불러오는 중입니다...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-28 px-4 py-3 text-left text-[11px] font-black text-slate-500">보도일자</th>
                      <th className="w-28 px-4 py-3 text-left text-[11px] font-black text-slate-500">규제</th>
                      <th className="w-36 px-4 py-3 text-left text-[11px] font-black text-slate-500">매체</th>
                      <th className="w-28 px-4 py-3 text-left text-[11px] font-black text-slate-500">매체 지역</th>
                      <th className="w-32 px-4 py-3 text-left text-[11px] font-black text-slate-500">플레이어</th>
                      <th className="w-32 px-4 py-3 text-left text-[11px] font-black text-slate-500">반응 유형</th>
                      <th className="min-w-[400px] px-4 py-3 text-left text-[11px] font-black text-slate-500">기사 제목</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                          표시할 뉴스가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((item, idx) => {
                        const code = item.relatedRegulationNames?.[0] || item.regulationId?.toUpperCase() || "—";
                        return (
                          <tr key={`${item.url}-${idx}`} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                              {formatDate(item.publishedAt)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(code)}`}>
                                {code}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-700">
                              {item.source || "미확인"}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">
                              {item.sourceRegion || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                                {item.actorType || "미분류"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                {item.newsType || "미분류"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={item.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block font-bold leading-snug text-navy hover:text-emeraldBrand hover:underline"
                              >
                                {item.titleKo || item.title || "제목 없음"}
                              </a>
                              {item.originalTitle && item.originalTitle !== item.titleKo && (
                                <p className="mt-0.5 text-xs text-slate-400">{item.originalTitle}</p>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

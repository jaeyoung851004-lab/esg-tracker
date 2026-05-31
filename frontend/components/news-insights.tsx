import Link from "next/link";
import type {
  NewsItem,
  NewsRegulationMeta,
  RegulationSummary,
} from "@/types/dashboard";

function formatPublishedDate(date?: string): string {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toISOString().slice(0, 10).replaceAll("-", ".");
}

function buildTabHref(basePath: string, tab: string): string {
  return tab === "all" ? basePath : `${basePath}?tab=${encodeURIComponent(tab)}`;
}

const statusTone: Record<string, string> = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  info: "border-blue-100 bg-blue-50 text-blue-700",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
  danger: "border-red-100 bg-red-50 text-red-700",
};

const actorTone: Record<string, string> = {
  "정부/규제기관": "bg-slate-100 text-slate-700",
  기업: "bg-blue-50 text-blue-700",
  "산업/협회": "bg-amber-50 text-amber-800",
  NGO: "bg-emerald-50 text-emerald-700",
  "로펌/자문": "bg-violet-50 text-violet-700",
  "투자자/금융": "bg-cyan-50 text-cyan-700",
  "시장/솔루션": "bg-slate-100 text-slate-600",
  언론: "bg-slate-100 text-slate-600",
};

export function NewsInsightsBoard({
  regulations,
  tabs,
  selectedTab,
  news,
  basePath,
  lookbackDays,
  compact = false,
  maxRows,
  title = "뉴스 & 인사이트",
  description = "각 규제별 최근 30일 수집 기준으로 기사 흐름과 플레이어 반응을 정리했습니다.",
}: {
  regulations: RegulationSummary[];
  tabs: NewsRegulationMeta[];
  selectedTab: string;
  news: NewsItem[];
  basePath: string;
  lookbackDays: number;
  compact?: boolean;
  maxRows?: number;
  title?: string;
  description?: string;
}) {
  const rows = typeof maxRows === "number" ? news.slice(0, maxRows) : news;
  const selectedRegulation =
    selectedTab === "all"
      ? null
      : regulations.find((item) => item.id === selectedTab) ?? null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-navy">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <p className="text-xs text-slate-400">
              각 규제별 최근 {lookbackDays}일 수집 기준
            </p>
          </div>

          <div className="-mx-1 overflow-x-auto">
            <div className="flex min-w-max gap-2 px-1">
              <Link
                href={buildTabHref(basePath, "all")}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  selectedTab === "all"
                    ? "border-emeraldBrand bg-emeraldBrand text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emeraldBrand hover:text-emeraldBrand"
                }`}
              >
                전체
              </Link>
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={buildTabHref(basePath, tab.id)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    selectedTab === tab.id
                      ? "border-emeraldBrand bg-emeraldBrand text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emeraldBrand hover:text-emeraldBrand"
                  }`}
                >
                  {tab.code}
                  <span className="ml-2 text-xs opacity-80">{tab.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        {selectedRegulation ? (
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-navy px-2 py-1 text-xs font-black text-white">
                  {selectedRegulation.code}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                    statusTone[selectedRegulation.statusTone] ??
                    "border-slate-100 bg-slate-100 text-slate-600"
                  }`}
                >
                  {selectedRegulation.status}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-navy">
                {selectedRegulation.title}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
                {selectedRegulation.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
              <SummaryPill label="현재 상태" value={selectedRegulation.status} />
              <SummaryPill
                label={selectedRegulation.deadlineLabel}
                value={selectedRegulation.deadline}
              />
              <SummaryPill label="우선순위" value={selectedRegulation.priority} />
              <SummaryPill
                label="뉴스 설정"
                value={`${selectedRegulation.newsQueryCount}개`}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy">전체 규제 뉴스 흐름</h3>
              <p className="mt-1 text-sm text-slate-500">
                규제를 선택하면 해당 규제의 최근 30일 기사만 추려서 볼 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
              <SummaryPill label="활성 탭" value={`${tabs.length}개`} />
              <SummaryPill label="표시 기사" value={`${rows.length}건`} />
              <SummaryPill
                label="시행/단계 적용"
                value={`${
                  regulations.filter((item) =>
                    ["phased", "active"].includes(item.statusKey)
                  ).length
                }개`}
              />
              <SummaryPill
                label="점검 필요"
                value={`${
                  regulations.filter((item) =>
                    ["delayed", "paused", "legislative"].includes(item.statusKey)
                  ).length
                }개`}
              />
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="bg-white text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 text-left">보도일자</th>
              <th className="px-4 py-3 text-left">매체</th>
              <th className="px-4 py-3 text-left">매체 지역</th>
              <th className="px-4 py-3 text-left">플레이어</th>
              <th className="px-4 py-3 text-left">반응 유형</th>
              <th className="px-4 py-3 text-left">기사 제목</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 text-xs text-slate-500">
                  {formatPublishedDate(item.publishedAt)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-semibold text-navy">{item.source}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {item.relatedRegulationNames?.join(", ") || "-"}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-500">
                  {item.sourceRegion || "-"}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      actorTone[item.actorType || "언론"] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.actorType || "언론"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
                  {item.newsType || "시장 동향"}
                </td>
                <td className="px-4 py-3.5">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold leading-relaxed text-navy hover:text-emeraldBrand"
                  >
                    {item.titleKo || item.title}
                  </a>
                  {item.originalTitle && item.originalTitle !== (item.titleKo || item.title) && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      원문: {item.originalTitle}
                    </p>
                  )}
                  {!compact && item.summary && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {item.summary}
                    </p>
                  )}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  최근 {lookbackDays}일 기준으로 표시할 기사가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-navy">{value}</p>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { NewsInsightsBoard } from "@/components/news-insights";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getNewsFeed, getRegulations } from "@/lib/api";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const regulations = await getRegulations();
  const selectedTab =
    searchParams?.tab &&
    regulations.some((item) => item.id === searchParams.tab)
      ? searchParams.tab
      : "all";

  const dashboardFeed = await getNewsFeed({
    regulationId: selectedTab === "all" ? undefined : selectedTab,
    limit: 5,
  });

  const urgent = regulations
    .filter((item) => typeof item.dDay === "number" && item.dDay >= 0)
    .sort((a, b) => (a.dDay ?? 9999) - (b.dDay ?? 9999))
    .slice(0, 3);

  const watchlist = regulations
    .filter((item) => ["delayed", "paused", "legislative"].includes(item.statusKey))
    .slice(0, 3);

  const recentUpdates = regulations
    .filter((item) => ["phased", "active"].includes(item.statusKey))
    .slice(0, 3);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="mx-auto max-w-[1280px] space-y-6 p-5">
          <div>
            <h1 className="text-xl font-black text-navy">대시보드</h1>
            <p className="mt-1 text-sm text-slate-500">
              오늘 확인할 규제 상태와 최근 뉴스 흐름입니다.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <SummaryCard
              title="시행 임박"
              tone="red"
              href="/regulations"
              items={urgent}
              emptyText="가까운 시행 일정이 없습니다."
              valueRenderer={(item) =>
                typeof item.dDay === "number" ? `D-${item.dDay}` : item.deadline || "-"
              }
            />

            <SummaryCard
              title="점검 필요"
              tone="amber"
              href="/regulations"
              items={watchlist}
              emptyText="지금 바로 점검이 필요한 규제가 없습니다."
              valueRenderer={(item) => item.status}
            />

            <SummaryCard
              title="진행 중 규제"
              tone="green"
              href="/regulations"
              items={recentUpdates}
              emptyText="표시할 진행 중 규제가 없습니다."
              valueRenderer={(item) => item.deadlineLabel || item.status}
            />
          </div>

          <NewsInsightsBoard
            regulations={regulations}
            tabs={
              selectedTab === "all"
                ? dashboardFeed.availableRegulations
                : regulations
                    .filter((item) => item.newsQueryCount > 0)
                    .map((item) => ({
                      id: item.id,
                      code: item.code,
                      name: item.title,
                      count: 0,
                    }))
            }
            selectedTab={selectedTab}
            news={dashboardFeed.items}
            basePath="/"
            lookbackDays={dashboardFeed.lookbackDays}
            compact
            maxRows={5}
            title="최신 뉴스"
            description="하드코딩이 아닌 실제 API 수집 결과만 표시합니다."
          />
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  tone,
  href,
  items,
  emptyText,
  valueRenderer,
}: {
  title: string;
  tone: "red" | "amber" | "green";
  href: string;
  items: {
    id: string;
    code: string;
    title: string;
    status: string;
    dDay?: number | null;
    deadline?: string;
    deadlineLabel?: string;
  }[];
  emptyText: string;
  valueRenderer: (item: {
    status: string;
    dDay?: number | null;
    deadline?: string;
    deadlineLabel?: string;
  }) => string;
}) {
  const toneMap = {
    red: {
      dot: "bg-red-100 text-red-600",
      badge: "bg-red-500 text-white",
      value: "text-red-500",
    },
    amber: {
      dot: "bg-amber-100 text-amber-600",
      badge: "bg-amber-500 text-white",
      value: "text-amber-600",
    },
    green: {
      dot: "bg-green-100 text-green-600",
      badge: "bg-emeraldBrand text-white",
      value: "text-green-600",
    },
  } as const;

  const selectedTone = toneMap[tone];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${selectedTone.dot}`}
          >
            !
          </span>
          {title}
        </h2>

        <a href={href} className="text-xs text-slate-400 hover:text-emeraldBrand">
          전체 보기
        </a>
      </div>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-xs text-slate-400">{emptyText}</p>}

        {items.map((item) => (
          <a
            key={item.id}
            href={`/regulations/${item.id}`}
            className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`rounded px-2 py-0.5 text-xs font-black ${selectedTone.badge}`}>
                {item.code}
              </span>
              <span className={`text-xs font-bold ${selectedTone.value}`}>
                {valueRenderer(item)}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-navy">
              {item.title}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

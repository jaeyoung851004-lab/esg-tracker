import { NewsInsightsBoard } from "@/components/news-insights";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getNewsFeed, getRegulations } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const regulations = await getRegulations();
  const feed = await getNewsFeed({ limit: 60 });
  const tabs = feed.availableRegulations;
  const selectedTab =
    searchParams?.tab && tabs.some((item) => item.id === searchParams.tab)
      ? searchParams.tab
      : "all";

  const filteredNews =
    selectedTab === "all"
      ? feed.items
      : feed.items.filter((item) =>
          (item.relatedRegulationIds ?? [item.regulationId]).includes(selectedTab)
        );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="mx-auto max-w-[1280px] space-y-6 p-5">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Impact ON ESG 규제 트래커
            </p>
            <h1 className="mt-2 text-2xl font-black text-navy">
              뉴스 & 인사이트
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              전체 뉴스가 아니라, 각 규제별 최근 30일 수집 결과를 합쳐서
              보여주는 화면입니다.
            </p>
          </div>

          <NewsInsightsBoard
            regulations={regulations}
            tabs={tabs}
            selectedTab={selectedTab}
            news={filteredNews}
            basePath="/news"
            lookbackDays={feed.lookbackDays}
          />
        </main>
      </div>
    </div>
  );
}

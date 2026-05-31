import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import {
  getNews,
  getRegulationDetail,
  summarizeRegulation,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const statusToneMap: Record<string, string> = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  info: "border-blue-100 bg-blue-50 text-blue-700",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
  danger: "border-red-100 bg-red-50 text-red-700",
};

export default async function RegulationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const regulation = await getRegulationDetail(params.id);
  if (!regulation) notFound();

  const summary = summarizeRegulation(regulation);
  const news = await getNews(regulation.id, 8);
  const dates = Object.values(regulation.legal.dates ?? {}).filter(
    (item) => item?.date
  );
  const thresholds = Object.entries(regulation.legal.thresholds ?? {});
  const checkpoints = regulation.action_checkpoints ?? {};
  const mapping = regulation.company_mapping ?? {};
  const keyPointGroups = ["지금", "준비", "모니터링"].map((key) => ({
    key,
    items: Array.isArray(checkpoints[key]) ? checkpoints[key] : [],
  }));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="mx-auto max-w-[1180px] space-y-5 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <Link href="/" className="text-xs font-bold text-emeraldBrand">
                전체 규제로 돌아가기
              </Link>
              <h1 className="mt-2 text-2xl font-black text-navy">
                {regulation.acronym} · {regulation.name_ko}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{regulation.name_en}</p>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                statusToneMap[summary.statusTone] ??
                "border-slate-100 bg-slate-100 text-slate-600"
              }`}
            >
              {summary.status}
            </span>
          </div>

          <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <Panel title="현재 상황">
                <p className="text-sm leading-relaxed text-slate-600">
                  {regulation.ai_layer.situation_summary || regulation.summary}
                </p>
                {regulation.why_it_matters && (
                  <div className="mt-3 rounded-lg border-l-4 border-emeraldBrand bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                    {regulation.why_it_matters}
                  </div>
                )}
              </Panel>

              <Panel title="실무 체크포인트">
                <div className="grid gap-3 md:grid-cols-3">
                  {keyPointGroups.map((group) => (
                    <div
                      key={group.key}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-black text-slate-500">{group.key}</p>
                      <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Panel>

              {regulation.korean_company_note && (
                <Panel title="한국 기업 영향">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {regulation.korean_company_note}
                  </p>
                </Panel>
              )}

              <Panel title="예상 영향 기업">
                {mapping.note && (
                  <p className="mb-3 text-sm leading-relaxed text-slate-500">
                    {mapping.note}
                  </p>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <ImpactColumn
                    title="직접 영향 가능성 높음"
                    tone="danger"
                    items={mapping.direct ?? []}
                  />
                  <ImpactColumn
                    title="간접 영향 가능"
                    tone="warning"
                    items={mapping.indirect ?? []}
                  />
                </div>
              </Panel>

              <Panel title="적용 대상 및 기준">
                <div className="space-y-3">
                  {thresholds.map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs font-black text-slate-500">{key}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">
                        {Array.isArray(value) ? value.join(" / ") : value}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="핵심 포인트">
                <ul className="space-y-2 text-sm leading-relaxed text-slate-600">
                  {(regulation.ai_layer.key_points ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Panel>

              <Panel title="입법 히스토리">
                <div className="space-y-3">
                  {(regulation.history ?? []).map((item) => (
                    <div
                      key={`${item.date}-${item.event}`}
                      className="grid gap-2 border-l-2 border-slate-200 pl-3 sm:grid-cols-[110px_1fr]"
                    >
                      <p className="text-xs font-bold text-slate-400">{item.date}</p>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {item.event}
                        {item.source_org && (
                          <span className="ml-1 text-xs text-slate-400">
                            · {item.source_org}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="관련 뉴스">
                <div className="divide-y divide-slate-100">
                  {news.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 py-3 hover:opacity-80"
                    >
                      <span className="mt-0.5 h-5 w-24 shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-center text-[10px] font-black text-slate-600">
                        {item.source}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-snug text-navy">
                          {item.titleKo || item.title}
                        </span>
                        {item.summary && (
                          <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                            {item.summary}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {item.age}
                      </span>
                    </a>
                  ))}
                </div>
              </Panel>
            </div>

            <aside className="space-y-4">
              <Panel title="주요 일정">
                <div className="space-y-3">
                  {dates.map((item) => (
                    <div
                      key={`${item.label}-${item.date}`}
                      className="rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm font-bold text-navy">{item.date}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="영향 산업">
                <div className="flex flex-wrap gap-2">
                  {(regulation.ai_layer.affected_industries ?? []).map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel title="공식 출처">
                <div className="space-y-2">
                  {(regulation.legal.sources ?? []).map((source) => (
                    <a
                      key={`${source.org}-${source.label}`}
                      href={source.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-600 hover:border-emeraldBrand hover:text-emeraldBrand"
                    >
                      <span className="font-bold">{source.org}</span>
                      <span className="block">{source.label}</span>
                    </a>
                  ))}
                </div>
              </Panel>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-navy">{title}</h2>
      {children}
    </section>
  );
}

function ImpactColumn({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "danger" | "warning";
  items: { name: string; reason: string }[];
}) {
  const toneClass =
    tone === "danger" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800";

  return (
    <div>
      <p className="mb-2 text-xs font-black text-slate-500">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className={`rounded-lg px-3 py-2 ${toneClass}`}>
            <p className="text-sm font-bold">{item.name}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-80">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

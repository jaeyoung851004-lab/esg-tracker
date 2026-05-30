import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getRegulations } from "@/lib/api";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-green-50", text: "text-green-700" },
  partial: { bg: "bg-blue-50", text: "text-blue-700" },
  warning: { bg: "bg-amber-50", text: "text-amber-700" },
  delayed: { bg: "bg-red-50", text: "text-red-700" },
  uncertain: { bg: "bg-orange-50", text: "text-orange-700" },
};

function formatDateLabel(key: string) {
  const labels: Record<string, string> = {
    proposed: "제안",
    adopted: "채택",
    entry_into_force: "발효",
    application_date: "적용 시작",
    published_oj: "관보 게재",
  };

  return labels[key] ?? key.replaceAll("_", " ");
}

export default async function RegulationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const regulations = await getRegulations();
  const reg = regulations.find((r) => r.id === params.id);

  if (!reg) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar />
          <div className="p-10 text-center">
            <p className="text-slate-500">규제를 찾을 수 없습니다.</p>
            <a
              href="/regulations"
              className="mt-4 inline-block text-emeraldBrand"
            >
              ← 규제 DB로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLE[reg.statusTone] ?? {
    bg: "bg-slate-50",
    text: "text-slate-700",
  };

  const dates = reg.legal?.dates ? Object.entries(reg.legal.dates) : [];
  const sources = reg.legal?.sources ?? [];
  const history = reg.history ?? [];
  const checkpoints = reg.action_checkpoints?.items ?? [];
  const affectedIndustries =
    reg.company_mapping?.industries ?? reg.ai_layer?.affected_industries ?? [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <div className="mx-auto max-w-[1180px] space-y-5 p-5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <a href="/regulations" className="hover:text-emeraldBrand">
              규제 DB
            </a>
            <span>›</span>
            <span className="font-medium text-slate-600">{reg.code}</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <main className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex flex-wrap items-start gap-3">
                  <span className="rounded bg-navy px-3 py-1 text-sm font-black text-white">
                    {reg.code}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {reg.status}
                  </span>

                  {typeof reg.dDay === "number" && reg.dDay < 999 && (
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${
                        reg.dDay <= 120
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      D-{reg.dDay}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-black text-navy">{reg.title}</h1>

                {reg.name_en && (
                  <p className="mt-1 text-sm text-slate-500">{reg.name_en}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                  {reg.category && <span>📁 {reg.category}</span>}
                  {reg.country && <span>🌍 {reg.country}</span>}
                  {reg.industry && <span>🏭 {reg.industry}</span>}
                  {reg.risk && reg.risk !== "—" && (
                    <span>
                      ⚠️ 주요 리스크:{" "}
                      <span className="font-bold text-red-500">
                        {reg.risk}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {reg.summary && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-navy">
                    📋 현재 법적 상태
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {reg.ai_layer?.situation_detail || reg.summary}
                  </p>
                </section>
              )}

              {reg.key_points && reg.key_points.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-bold text-navy">
                    🎯 핵심 포인트
                  </h2>

                  <div className="space-y-2">
                    {reg.key_points.map((point, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emeraldBrand/10 text-[10px] font-black text-emeraldBrand">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed text-slate-700">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {checkpoints.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-bold text-navy">
                    ✅ 실무 체크포인트
                  </h2>

                  <div className="grid gap-3 md:grid-cols-2">
                    {checkpoints.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {reg.why_it_matters && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-navy">
                    ⚠️ 기업이 주의해야 하는 이유
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {reg.why_it_matters}
                  </p>
                </section>
              )}
            </main>

            <aside className="space-y-5">
              {sources.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-navy">
                    🔗 공식 출처
                  </h2>

                  <div className="space-y-2">
                    {sources.slice(0, 4).map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-emeraldBrand/20 bg-emeraldBrand/5 px-4 py-3 text-sm font-medium text-emeraldBrand hover:bg-emeraldBrand/10"
                      >
                        <span className="block">{source.label}</span>
                        <span className="mt-1 block text-xs font-normal text-slate-500">
                          {source.org || source.type || "Official source"}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {dates.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-sm font-bold text-navy">
                    📅 주요 일정
                  </h2>

                  <div className="space-y-3">
                    {dates.slice(0, 8).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg bg-slate-50 px-3 py-3"
                      >
                        <p className="text-xs text-slate-500">
                          {value.label || formatDateLabel(key)}
                        </p>
                        <p className="mt-1 text-sm font-bold text-navy">
                          {value.date}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {history.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-sm font-bold text-navy">
                    🧭 입법 히스토리
                  </h2>

                  <div className="space-y-4">
                    {history.slice(0, 7).map((item, i) => (
                      <div key={i} className="relative border-l border-slate-200 pl-4">
                        <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-emeraldBrand" />
                        <p className="text-xs font-bold text-slate-500">
                          {item.date}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">
                          {item.event}
                        </p>
                        {(item.source_org || item.source_type) && (
                          <p className="mt-1 text-xs text-slate-400">
                            {item.source_org || item.source_type}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {affectedIndustries.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-navy">
                    🏭 영향 산업
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {affectedIndustries.map((item, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>

          <div className="pb-6">
            <a
              href="/regulations"
              className="text-sm text-slate-400 hover:text-emeraldBrand"
            >
              ← 규제 DB로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

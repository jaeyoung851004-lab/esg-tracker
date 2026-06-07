import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ApplicabilityCriteria } from "@/components/regulation/ApplicabilityCriteria";
import { DelegatedActsGrid } from "@/components/regulation/DelegatedActsGrid";
import { FrameworkTimeline } from "@/components/regulation/FrameworkTimeline";
import { PhaseCard } from "@/components/regulation/PhaseCard";
import { RegulationTimeline } from "@/components/regulation/RegulationTimeline";
import { UncertaintyBanner } from "@/components/regulation/UncertaintyBanner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getRegulationDetail, summarizeRegulation } from "@/lib/api";
import {
  buildOneLineBrief,
  getRiskBorderClass,
} from "@/lib/tracking";
import type {
  RegulationDetail,
  RegulationOfficialMetadata,
} from "@/types/dashboard";

export const dynamic = "force-dynamic";

const statusToneMap: Record<string, string> = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  info: "border-blue-100 bg-blue-50 text-blue-700",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
  danger: "border-red-100 bg-red-50 text-red-700",
};

const CODE_COLOR: Record<string, string> = {
  ESPR: "bg-emerald-600",
  PPWR: "bg-teal-600",
  CSDDD: "bg-orange-500",
  CSRD: "bg-red-600",
  CBAM: "bg-purple-600",
  EUDR: "bg-lime-700",
  GCD: "bg-pink-600",
  "AI Act": "bg-indigo-600",
  "Battery Reg": "bg-cyan-700",
  DPP: "bg-sky-600",
  ELV: "bg-slate-600",
};

function getOfficialMetadata(
  regulation: RegulationDetail
): RegulationOfficialMetadata {
  return (
    regulation.official_metadata ||
    regulation.officialMetadata ||
    regulation.legal?.official_metadata || {
      source_name: regulation.source_name || regulation.sourceName || "",
      source_url: regulation.source_url || regulation.sourceUrl || "",
      celex_id: regulation.celex_id || regulation.celexId || "",
      official_document_url:
        regulation.official_document_url ||
        regulation.officialDocumentUrl ||
        regulation.official_url ||
        "",
      last_synced_at: regulation.last_synced_at ?? regulation.lastSyncedAt ?? null,
      last_verified_at:
        regulation.last_verified_at ?? regulation.lastVerifiedAt ?? null,
    }
  );
}

function formatDate(date?: string | null) {
  if (!date) return "미확인";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toISOString().slice(0, 10).replaceAll("-", ".");
}

function toItems(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isText(value: string | undefined): value is string {
  return Boolean(value);
}

function getCheckpointItems(
  regulation: RegulationDetail,
  key: "지금" | "준비" | "모니터링"
) {
  return toItems(regulation.action_checkpoints?.[key]);
}

function StageSection({ regulation }: { regulation: RegulationDetail }) {
  if (regulation.governance_type === "single_dday") {
    return <RegulationTimeline regulation={regulation} />;
  }

  if (regulation.governance_type === "multiphase") {
    return <PhaseCard regulation={regulation} />;
  }

  if (regulation.governance_type === "framework") {
    return (
      <div className="space-y-4">
        <FrameworkTimeline regulation={regulation} />
        <DelegatedActsGrid regulation={regulation} />
      </div>
    );
  }

  if (regulation.governance_type === "legislative") {
    return <RegulationTimeline regulation={regulation} dotted />;
  }

  return <UncertaintyBanner regulation={regulation} />;
}

export default async function RegulationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const regulation = await getRegulationDetail(params.id);
  if (!regulation) notFound();

  const summary = summarizeRegulation(regulation);
  const officialMetadata = getOfficialMetadata(regulation);
  const summaryShort =
    regulation.summary_short || regulation.summary || regulation.ai_layer.situation_summary;
  const oneLineBrief = buildOneLineBrief(regulation);
  const penalty = regulation.legal.thresholds?.penalty;
  const nowItems = [
    regulation.tracking?.business_action?.now,
    ...getCheckpointItems(regulation, "지금"),
  ].filter(isText);
  const beforeEventItems = [
    regulation.tracking?.business_action?.before_next_event,
    ...getCheckpointItems(regulation, "준비"),
  ].filter(isText);
  const monitoringItems = getCheckpointItems(regulation, "모니터링");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="mx-auto max-w-[1180px] space-y-5 p-5">
          <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Link href="/regulations" className="text-xs font-bold text-emeraldBrand">
              전체 규제로 돌아가기
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${
                  CODE_COLOR[regulation.acronym || regulation.code] ?? "bg-slate-600"
                }`}
              >
                {regulation.acronym || regulation.code}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {regulation.category}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                  statusToneMap[summary.statusTone] ??
                  "border-slate-100 bg-slate-100 text-slate-600"
                }`}
              >
                {summary.status}
              </span>
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-black leading-tight text-navy">
                {regulation.name_ko || regulation.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{regulation.name_en}</p>
              {officialMetadata.celex_id && (
                <p className="mt-2 font-mono text-xs font-bold text-slate-400">
                  CELEX {officialMetadata.celex_id}
                </p>
              )}
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-500">
              {summaryShort}
            </p>

            <div
              className={`mt-4 rounded-r-lg border-l-4 bg-slate-50 px-4 py-3 text-sm font-bold leading-relaxed text-navy ${getRiskBorderClass(
                summary.statusTone
              )}`}
            >
              {oneLineBrief}
            </div>
          </header>

          <ApplicabilityCriteria regulation={regulation} />

          <StageSection regulation={regulation} />

          <Panel title="핵심 의무">
            <ol className="space-y-3 text-sm leading-relaxed text-slate-700">
              {(regulation.ai_layer.key_points ?? []).slice(0, 5).map((item, index) => (
                <li key={item} className="grid grid-cols-[28px_1fr] gap-2">
                  <span className="font-mono text-xs font-black text-slate-400">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="행동 포인트">
            <div className="grid gap-3 md:grid-cols-3">
              <ActionColumn title="지금" items={nowItems} />
              <ActionColumn title="다음 이벤트 전까지" items={beforeEventItems} />
              <ActionColumn title="모니터링" items={monitoringItems} />
            </div>
          </Panel>

          <Panel title="최근 규제 신호">
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
              최근 규제 신호를 불러오는 중입니다
            </div>
          </Panel>

          <Panel title="벌금·제재">
            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold leading-relaxed text-slate-700">
              {penalty
                ? Array.isArray(penalty)
                  ? penalty.join(" / ")
                  : penalty
                : "회원국 이행법에 따라 결정 (확인 필요)"}
            </p>
          </Panel>

          <Panel title="Impact ON 해설">
            <p className="text-sm leading-relaxed text-slate-600">
              {regulation.ai_layer.situation_summary || regulation.summary}
            </p>
            {regulation.why_it_matters && (
              <div className="mt-4 rounded-r-lg border-l-4 border-emeraldBrand bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                {regulation.why_it_matters}
              </div>
            )}

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
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
              <div className="rounded-lg bg-slate-50 px-3 py-3">
                <p className="text-xs font-black text-slate-500">최종 확인일</p>
                <p className="mt-1 text-sm font-bold text-navy">
                  {formatDate(officialMetadata.last_verified_at)}
                </p>
              </div>
            </div>
          </Panel>
        </main>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-black text-navy">{title}</h2>
      {children}
    </section>
  );
}

function ActionColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-black text-navy">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-400">확인 필요</p>
      )}
    </div>
  );
}

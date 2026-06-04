"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getRegulations } from "@/lib/api";
import type {
  Regulation,
  RegulationOfficialMetadata,
  RegulationSummary,
} from "@/types/dashboard";

const STATUS_STYLE: Record<string, string> = {
  success: "bg-green-50 text-green-700",
  partial: "bg-blue-50 text-blue-700",
  phased: "bg-blue-50 text-blue-700",
  info: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  delayed: "bg-red-50 text-red-700",
  danger: "bg-red-50 text-red-700",
  uncertain: "bg-orange-50 text-orange-700",
  paused: "bg-orange-50 text-orange-700",
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

const CATEGORY_FILTERS = [
  { label: "전체", categories: [] },
  { label: "제품·순환경제", categories: ["순환경제", "순환경제·배터리", "디지털 전환·제품"] },
  { label: "공급망", categories: ["공급망 실사", "공급망·생물다양성"] },
  { label: "공시·보고", categories: ["공시·보고"] },
  { label: "탄소·기후", categories: ["탄소·기후"] },
  { label: "그린워싱/소비자", categories: ["그린워싱 방지"] },
  { label: "AI·디지털", categories: ["AI·디지털"] },
];

const STATUS_FILTER_ALIASES: Record<string, string[]> = {
  phased: ["phased", "partial", "success"],
  legislative: ["legislative", "warning", "info"],
  delayed: ["delayed", "scaled_back", "danger"],
  paused: ["paused", "suspended", "uncertain"],
};

function getOfficialMetadata(reg: Regulation): RegulationOfficialMetadata {
  return (
    reg.official_metadata ||
    reg.officialMetadata ||
    reg.legal?.official_metadata || {
      source_name: reg.source_name || reg.sourceName || "",
      source_url: reg.source_url || reg.sourceUrl || "",
      celex_id: reg.celex_id || reg.celexId || "",
      official_document_url:
        reg.official_document_url || reg.officialDocumentUrl || reg.official_url || "",
      last_synced_at: reg.last_synced_at ?? reg.lastSyncedAt ?? null,
      last_verified_at: reg.last_verified_at ?? reg.lastVerifiedAt ?? null,
    }
  );
}

function formatDate(date?: string | null) {
  if (!date) return "미확인";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toISOString().slice(0, 10).replaceAll("-", ".");
}

function getIndustries(reg: Regulation) {
  const industries = reg.ai_layer?.affected_industries ?? [];
  if (industries.length > 0) return industries.slice(0, 3).join(", ");
  return reg.industry || "산업 전반";
}

function getNextMilestone(reg: RegulationSummary) {
  return {
    label: reg.card_date_label || reg.deadlineLabel || "다음 일정",
    value: reg.card_date_value || reg.deadline || "미정",
  };
}

function matchesStatusFilter(reg: RegulationSummary, status: string) {
  if (!status) return true;
  const values = [reg.statusKey, reg.statusTone].filter(Boolean);
  return (STATUS_FILTER_ALIASES[status] ?? [status]).some((value) =>
    values.includes(value)
  );
}

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<RegulationSummary[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getRegulations().then(setRegulations);
  }, []);

  const activeFilter = CATEGORY_FILTERS.find((item) => item.label === category);

  const filteredRegulations = useMemo(() => {
    const q = query.trim().toLowerCase();

    return regulations.filter((reg) => {
      const metadata = getOfficialMetadata(reg);
      const searchable = [
        reg.code,
        reg.title,
        reg.name_en,
        reg.category,
        reg.country,
        reg.industry,
        reg.status,
        metadata.source_name,
        metadata.celex_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesCategory =
        !activeFilter?.categories.length ||
        activeFilter.categories.includes(reg.category);
      const matchesStatus = matchesStatusFilter(reg, status);

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [activeFilter, regulations, query, status]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <div className="mx-auto max-w-[1360px] space-y-6 p-5">
          <div>
            <h1 className="text-xl font-black text-navy">규제 DB</h1>
            <p className="mt-1 text-sm text-slate-500">
              글로벌 ESG 핵심 규제 {filteredRegulations.length}개 / 전체{" "}
              {regulations.length}개 — 행을 선택하면 상세 정보를 확인할 수 있습니다
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setCategory(filter.label)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    category === filter.label
                      ? "border-navy bg-navy text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emeraldBrand hover:text-emeraldBrand"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span className="text-sm text-slate-400">검색</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="규제명, 약칭, 산업, CELEX 검색..."
                  className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none"
              >
                <option value="">전체 상태</option>
                <option value="phased">단계적 시행</option>
                <option value="legislative">입법 진행</option>
                <option value="delayed">축소·지연</option>
                <option value="paused">유예/불확실</option>
              </select>

              {(query || category !== "전체" || status) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("전체");
                    setStatus("");
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm hover:bg-slate-50"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-[260px] px-4 py-3 text-left text-[11px] font-black text-slate-500">
                      규제명
                    </th>
                    <th className="w-36 px-4 py-3 text-left text-[11px] font-black text-slate-500">
                      분야
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-[11px] font-black text-slate-500">
                      상태
                    </th>
                    <th className="w-44 px-4 py-3 text-left text-[11px] font-black text-slate-500">
                      다음 일정
                    </th>
                    <th className="min-w-[220px] px-4 py-3 text-left text-[11px] font-black text-slate-500">
                      영향 산업
                    </th>
                    <th className="w-36 px-4 py-3 text-left text-[11px] font-black text-slate-500">
                      공식 출처
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-[11px] font-black text-slate-500">
                      최종 확인일
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRegulations.map((reg) => {
                    const metadata = getOfficialMetadata(reg);
                    const milestone = getNextMilestone(reg);
                    const officialUrl =
                      metadata.official_document_url || metadata.source_url || reg.official_url;

                    return (
                      <tr
                        key={reg.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => {
                          window.location.href = `/regulations/${reg.id}`;
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            window.location.href = `/regulations/${reg.id}`;
                          }
                        }}
                        className="cursor-pointer transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-black text-white ${
                                CODE_COLOR[reg.code] ?? "bg-slate-600"
                              }`}
                            >
                              {reg.code}
                            </span>
                            <div className="min-w-0">
                              <a
                                href={`/regulations/${reg.id}`}
                                onClick={(event) => event.stopPropagation()}
                                className="block font-bold leading-snug text-navy hover:text-emeraldBrand"
                              >
                                {reg.title}
                              </a>
                              {reg.name_en && (
                                <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                                  {reg.name_en}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {reg.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              STATUS_STYLE[reg.statusTone] ??
                              STATUS_STYLE[reg.statusKey ?? ""] ??
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-bold text-slate-400">
                            {milestone.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-navy">
                            {milestone.value}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-xs leading-relaxed text-slate-600">
                          {getIndustries(reg)}
                        </td>
                        <td className="px-4 py-3.5">
                          {officialUrl ? (
                            <a
                              href={officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="text-xs font-bold text-emeraldBrand hover:underline"
                            >
                              {metadata.source_name || "원문 보기"}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">미확인</span>
                          )}
                          {metadata.celex_id && (
                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                              {metadata.celex_id}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium text-slate-500">
                          {formatDate(metadata.last_verified_at)}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRegulations.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-slate-400"
                      >
                        조건에 맞는 규제가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

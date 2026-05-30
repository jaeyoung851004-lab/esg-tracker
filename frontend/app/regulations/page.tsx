"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getRegulations } from "@/lib/api";
import type { Regulation } from "@/types/dashboard";

const STATUS_STYLE: Record<string, string> = {
  success: "bg-green-50 text-green-700",
  partial: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  delayed: "bg-red-50 text-red-700",
  uncertain: "bg-orange-50 text-orange-700",
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
  "CA SB253/261": "bg-blue-700",
  ELV: "bg-slate-600",
  "K-ESG": "bg-rose-600",
  SEC: "bg-gray-700",
  ISSB: "bg-violet-600",
};

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getRegulations().then(setRegulations);
  }, []);

  const filteredRegulations = useMemo(() => {
    const q = query.trim().toLowerCase();

    return regulations.filter((reg) => {
      const searchable = [
        reg.code,
        reg.title,
        reg.name_en,
        reg.category,
        reg.country,
        reg.industry,
        reg.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesRegion = !region || reg.country.toLowerCase() === region;
      const matchesStatus = !status || reg.statusTone === status;

      return matchesQuery && matchesRegion && matchesStatus;
    });
  }, [regulations, query, region, status]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <div className="mx-auto max-w-[1280px] space-y-6 p-5">
          <div>
            <h1 className="text-xl font-black text-navy">규제 DB</h1>
            <p className="mt-1 text-sm text-slate-500">
              글로벌 ESG 핵심 규제 {filteredRegulations.length}개 / 전체{" "}
              {regulations.length}개 — 카드를 클릭하면 상세 정보를 확인할 수
              있습니다
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="text-sm text-slate-400">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="규제명, 약칭, 국가, 산업 검색..."
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none"
            >
              <option value="">전체 지역</option>
              <option value="eu">EU</option>
              <option value="us">미국</option>
              <option value="kr">한국</option>
              <option value="global">글로벌</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none"
            >
              <option value="">전체 상태</option>
              <option value="success">시행 중</option>
              <option value="partial">단계적 시행</option>
              <option value="warning">입법 진행</option>
              <option value="delayed">축소·지연</option>
              <option value="uncertain">유예/불확실</option>
            </select>

            {(query || region || status) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setRegion("");
                  setStatus("");
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm hover:bg-slate-50"
              >
                초기화
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRegulations.map((reg) => (
              <a
                key={reg.id}
                href={`/regulations/${reg.id}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emeraldBrand hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span
                    className={`rounded px-2 py-1 text-xs font-black text-white ${
                      CODE_COLOR[reg.code] ?? "bg-slate-600"
                    }`}
                  >
                    {reg.code}
                  </span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      STATUS_STYLE[reg.statusTone] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {reg.status}
                  </span>
                </div>

                <h3 className="mb-1 text-sm font-bold leading-snug text-navy group-hover:text-emeraldBrand">
                  {reg.title}
                </h3>

                {reg.name_en && (
                  <p className="mb-3 text-xs text-slate-400">{reg.name_en}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="line-clamp-1 text-xs text-slate-400">
                    {reg.category}
                  </span>

                  {typeof reg.dDay === "number" &&
                    reg.dDay >= 0 &&
                    reg.dDay < 999 && (
                      <span
                        className={`shrink-0 font-mono text-xs font-bold ${
                          reg.dDay <= 120 ? "text-red-500" : "text-slate-500"
                        }`}
                      >
                        D-{reg.dDay}
                      </span>
                    )}
                </div>
              </a>
            ))}
          </div>

          {filteredRegulations.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
              조건에 맞는 규제가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

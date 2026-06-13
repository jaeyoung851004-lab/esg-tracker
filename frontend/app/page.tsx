export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getRegulations } from "@/lib/api";
import { REGULATION_MASTER } from "@/data/regulations.master";
import {
  getRecentSignals,
  getSignalStats,
  getSignalsByRegId,
} from "@/lib/marketSignals";
import { IntelligencePanel } from "@/components/IntelligencePanel";
import {
  calculateTrackingDDay,
  formatTrackingDateLabel,
  formatTrackingEventTiming,
  getTrackingEventSortValue,
  getTrackingOwner,
  getTrackingRiskClass,
  getTrackingRiskLabel,
  hasTracking,
} from "@/lib/tracking";

// ─────────────────────────────────────────
// 백엔드 API base URL
// ─────────────────────────────────────────
function getApiBase() {
  return (
    process.env.ESG_TRACKER_API_BASE_URL ||
    process.env.NEXT_PUBLIC_ESG_TRACKER_API_BASE_URL ||
    "http://127.0.0.1:8000"
  );
}

// ─────────────────────────────────────────
// 뉴스 전체 건수 fetch
// ─────────────────────────────────────────
async function getNewsTotalCount(): Promise<number> {
  try {
    const res = await fetch(`${getApiBase()}/api/news?limit=200`, {
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return (data.items || []).length;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────
// 뉴스 fetch (대시보드용)
// ─────────────────────────────────────────
async function getDashboardNews() {
  try {
    const res = await fetch(`${getApiBase()}/api/news?limit=20`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || [];
    return items
      .sort((a: any, b: any) => {
        const ta = Date.parse(a.publishedAt || "") || 0;
        const tb = Date.parse(b.publishedAt || "") || 0;
        return tb - ta;
      })
      .slice(0, 8);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────
// 지역별 뉴스 카운트
// ─────────────────────────────────────────
async function getRegionNewsCount() {
  try {
    const res = await fetch(`${getApiBase()}/api/news?limit=20`, {
      cache: "no-store",
    });
    if (!res.ok) return {};
    const data = await res.json();
    const regionCounts: Record<string, number> = {};
    for (const rc of data.regionCounts || []) {
      regionCounts[rc.region] = rc.count;
    }
    return regionCounts;
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────
// 상태 tone → 배지 스타일
// ─────────────────────────────────────────
function getStatusBadge(tone?: string, label?: string) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    success:   { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
    partial:   { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500" },
    phased:    { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500" },
    warning:   { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500" },
    delayed:   { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500" },
    uncertain: { bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-400" },
  };
  const style = map[tone ?? ""] ?? { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
  return { ...style, label: label ?? "확인 필요" };
}

// ─────────────────────────────────────────
// D-day 배지
// ─────────────────────────────────────────
function DDayBadge({ dDay }: { dDay?: number }) {
  if (typeof dDay !== "number" || dDay === 999) return null;
  if (dDay < 0) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">
        시행 중
      </span>
    );
  }
  if (dDay <= 90) {
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[11px] font-bold text-red-600">
        D-{dDay}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">
      D-{dDay}
    </span>
  );
}

// ─────────────────────────────────────────
// 규제 코드 배지 색상
// ─────────────────────────────────────────
const CODE_COLORS: Record<string, string> = {
  ESPR:          "bg-teal-600",
  PPWR:          "bg-cyan-600",
  CSDDD:         "bg-orange-600",
  CSRD:          "bg-rose-600",
  CBAM:          "bg-violet-600",
  EUDR:          "bg-yellow-600",
  GCD:           "bg-lime-600",
  "AI Act":      "bg-indigo-600",
  "AI ACT":      "bg-indigo-600",
  "Battery Reg": "bg-sky-600",
  "BATTERY REG": "bg-sky-600",
  "Battery Regulation": "bg-sky-600",
  DPP:           "bg-fuchsia-600",
};

function codeColor(code: string) {
  return CODE_COLORS[code] ?? "bg-navy";
}

// ─────────────────────────────────────────
// 글로벌 뉴스 맵
// ─────────────────────────────────────────
const REGION_COORDS: Record<string, { x: number; y: number }> = {
  "EU":         { x: 370, y: 118 },
  "EU/벨기에":  { x: 370, y: 118 },
  "EU/유럽":    { x: 370, y: 118 },
  "독일":       { x: 375, y: 108 },
  "프랑스":     { x: 355, y: 122 },
  "이탈리아":   { x: 380, y: 135 },
  "스페인":     { x: 340, y: 135 },
  "네덜란드":   { x: 360, y: 105 },
  "폴란드":     { x: 395, y: 108 },
  "영국":       { x: 340, y: 100 },
  "미국":       { x: 160, y: 130 },
  "미국/EU":    { x: 160, y: 130 },
  "한국":       { x: 580, y: 130 },
  "일본":       { x: 600, y: 125 },
  "중국":       { x: 555, y: 125 },
  "인도":       { x: 510, y: 150 },
  "베트남":     { x: 555, y: 155 },
  "말레이시아": { x: 560, y: 168 },
  "인도네시아": { x: 565, y: 178 },
  "브라질":     { x: 245, y: 195 },
  "튀르키예":   { x: 415, y: 125 },
  "글로벌":     { x: 370, y: 118 },
};

function RegionMap({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).filter(
    ([k]) => k !== "기타"
  );
  const maxCount = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#0f1a2e]">
      <svg viewBox="0 0 740 360" className="w-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 62} y1={0} x2={i * 62} y2={360} stroke="#1e3050" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 60} x2={740} y2={i * 60} stroke="#1e3050" strokeWidth={0.5} />
        ))}
        <path d="M80,70 L220,65 L240,100 L220,160 L180,175 L130,165 L90,140 L70,110 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M180,180 L250,175 L265,200 L255,240 L230,260 L200,255 L185,230 L175,200 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M310,80 L420,75 L435,95 L425,140 L395,150 L355,145 L320,130 L305,105 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M330,150 L410,145 L430,175 L420,230 L390,255 L355,252 L330,220 L320,180 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M430,60 L650,55 L665,80 L660,160 L620,185 L560,190 L490,175 L440,150 L425,110 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M580,210 L660,205 L670,240 L645,260 L600,258 L580,235 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />

        {entries.map(([region, count]) => {
          const coord = REGION_COORDS[region];
          if (!coord) return null;
          const size = 4 + (count / maxCount) * 18;
          const opacity = 0.3 + (count / maxCount) * 0.7;
          return (
            <g key={region}>
              <circle cx={coord.x} cy={coord.y} r={size + 6} fill="none" stroke="#34d399" strokeWidth={1} opacity={opacity * 0.3} />
              <circle cx={coord.x} cy={coord.y} r={size + 3} fill="none" stroke="#34d399" strokeWidth={1.5} opacity={opacity * 0.5} />
              <circle cx={coord.x} cy={coord.y} r={size} fill="#34d399" opacity={opacity} />
              {count >= 2 && (
                <text x={coord.x} y={coord.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={size > 10 ? 9 : 7} fontWeight="bold" fill="white" opacity={0.95}>
                  {count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        {entries.sort(([, a], [, b]) => b - a).slice(0, 5).map(([region, count]) => (
          <div key={region} className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[10px] text-slate-400">
              {region} <span className="text-emerald-400">{count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 날짜 포맷
// ─────────────────────────────────────────
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(new Date(dateStr));
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────
export default async function DashboardPage() {
  const [regulations, latestNews, regionCounts, totalNewsCount] = await Promise.all([
    getRegulations(),
    getDashboardNews(),
    getRegionNewsCount(),
    getNewsTotalCount(),
  ]);

  const urgentCount = regulations.filter(
    (r) => {
      const dDay = calculateTrackingDDay(r.tracking);
      return typeof dDay === "number" && dDay >= 0 && dDay <= 90;
    }
  ).length;

  const updatedCount = regulations.filter(
    (r) => r.statusTone === "delayed" || r.statusTone === "warning" || r.statusTone === "uncertain"
  ).length;

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const trackingEvents = regulations
    .filter(hasTracking)
    .map((reg) => ({
      regulation: reg,
      dDay: calculateTrackingDDay(reg.tracking),
      sortValue: getTrackingEventSortValue(reg),
    }));
  const nextCoreEvents = [
    ...trackingEvents
      .filter((item) => item.dDay !== null)
      .sort((a, b) => a.sortValue - b.sortValue),
    ...trackingEvents
      .filter((item) => item.dDay === null)
      .sort((a, b) =>
        (a.regulation.tracking?.next_event?.expected_date || "9999").localeCompare(
          b.regulation.tracking?.next_event?.expected_date || "9999"
        )
      ),
  ].slice(0, 8);

  const signalStats = getSignalStats();
  const recentSignals = getRecentSignals(7);
  const latestSignalRows = recentSignals.slice(0, 5);
  const signalRegulationGroups = Array.from(
    new Map(recentSignals.map((signal) => [signal.reg_id, signal])).values()
  )
    .slice(0, 5)
    .map((signal) => ({
      regId: signal.reg_id,
      regulationName: signal.regulation_name,
      signals: getSignalsByRegId(signal.reg_id).slice(0, 2),
    }));

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[1360px] space-y-6 p-6">

          {/* 헤더 */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emeraldBrand">
              Impact ON ESG Regulation Intelligence
            </p>
            <h1 className="mt-1.5 text-2xl font-black text-navy">대시보드</h1>
            <p className="mt-1 text-sm text-slate-400">{today} 기준 · Impact ON Co.</p>
          </div>

          {/* 상단 4개 지표 */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "모니터링 규제", value: regulations.length, unit: "개", sub: "EU 핵심 규제 추적 중", color: "text-navy", bg: "bg-white", border: "border-slate-200" },
              { label: "최근 30일 뉴스", value: totalNewsCount > 0 ? `${totalNewsCount}건` : "—", unit: "", sub: "Google News RSS 수집", color: "text-emeraldBrand", bg: "bg-white", border: "border-slate-200" },
              { label: "주의 규제", value: updatedCount, unit: "개", sub: "축소·지연·경고 상태", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
              { label: "시행 임박", value: urgentCount, unit: "개", sub: "D-90 이내", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
            ].map((card) => (
              <div key={card.label} className={`rounded-xl border ${card.border} ${card.bg} p-5 shadow-sm`}>
                <p className="text-xs font-bold text-slate-400">{card.label}</p>
                <p className={`mt-2 text-3xl font-black ${card.color}`}>
                  {card.value}<span className="ml-0.5 text-base font-bold">{card.unit}</span>
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* 다음 핵심 규제 이벤트 */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-navy">다음 핵심 규제 이벤트</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  확정일은 D-day로, 예상 일정은 별도 라벨로 표시합니다
                </p>
              </div>
              <a href="/regulations" className="text-xs font-bold text-emeraldBrand hover:underline">규제 DB 보기 →</a>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
              {nextCoreEvents.map(({ regulation, dDay }) => {
                const riskLevel = regulation.tracking?.schedule_risk?.level;
                return (
                  <a
                    key={regulation.id}
                    href={`/regulations/${regulation.id}`}
                    className="block rounded-lg border border-slate-200 p-4 transition hover:border-emeraldBrand hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(regulation.code)}`}>
                          {regulation.code}
                        </span>
                        <p className="truncate text-sm font-black text-navy">
                          {regulation.name_ko || regulation.title}
                        </p>
                      </div>
                      {riskLevel === "high" && (
                        <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          위험
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-slate-700">
                      {regulation.tracking?.next_event?.event_label || "다음 이벤트 확인 필요"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {formatTrackingDateLabel(regulation.tracking)}
                      </span>
                      {dDay !== null && dDay >= 0 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[11px] font-bold text-red-600">
                          {formatTrackingEventTiming(regulation.tracking)}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                      담당 주체: {getTrackingOwner(regulation.tracking)}
                    </p>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getTrackingRiskClass(riskLevel)}`}>
                      일정 리스크 {getTrackingRiskLabel(riskLevel)}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>

          {/* 규제 동향 테이블 + 지역 맵 */}
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

            {/* 규제 동향 테이블 */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black text-navy">모니터링 규제 동향</h2>
                  <p className="mt-0.5 text-xs text-slate-400">현재 법적 상태 · 다음 체크포인트 · 시행까지</p>
                </div>
                <a href="/regulations" className="text-xs font-bold text-emeraldBrand hover:underline">전체 보기 →</a>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-400">규제</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-400">카테고리</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-400">법적 상태</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-400">다음 체크포인트</th>
                      <th className="px-4 py-3 text-center text-[11px] font-black text-slate-400">D-day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {regulations.map((reg) => {
                      const badge = getStatusBadge(reg.statusTone, reg.status);
                      const master = REGULATION_MASTER.find((m) => m.id === reg.id);
                      const checkpoint =
                        reg.tracking?.next_event?.event_label || reg.card_date_label || "—";
                      const checkpointTiming = hasTracking(reg)
                        ? formatTrackingDateLabel(reg.tracking)
                        : reg.card_date_value || reg.deadline;
                      const trackingDday = calculateTrackingDDay(reg.tracking);
                      return (
                        <tr key={reg.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <a href={`/regulations/${reg.id}`} className="flex items-center gap-2 hover:opacity-80">
                              <span className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(reg.code)}`}>
                                {reg.code}
                              </span>
                              <span className="max-w-[120px] truncate text-xs font-semibold text-navy">
                                {reg.name_ko || reg.title}
                              </span>
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                              {master?.category || reg.category || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.bg} ${badge.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>
                          <td className="max-w-[220px] px-4 py-3 text-xs text-slate-500">
                            <p className="truncate font-semibold text-slate-600">{checkpoint}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">{checkpointTiming}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {trackingDday !== null ? (
                              <DDayBadge dDay={trackingDday} />
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                                {reg.tracking?.next_event?.status === "uncertain" ? "시점 미정" : "예상"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 글로벌 뉴스 맵 */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-black text-navy">글로벌 뉴스 발생 지역</h2>
                <p className="mt-0.5 text-xs text-slate-400">전체 규제 기준 · 최근 30일</p>
              </div>
              <div className="p-4">
                <RegionMap counts={regionCounts} />
                <div className="mt-4 space-y-2">
                  {Object.entries(regionCounts)
                    .filter(([k]) => k !== "기타")
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([region, count]) => {
                      const max = Math.max(...Object.values(regionCounts));
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={region} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 text-right text-[11px] text-slate-500">{region}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-1.5 rounded-full bg-emeraldBrand" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right font-mono text-[11px] font-bold text-emeraldBrand">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* 이번 주 시장 신호 */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-black text-navy">이번 주 시장 신호</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                기사에서 추출한 규제별 플레이어 행동 요약
              </p>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-3">
              {[
                { label: "총 시그널 수", value: signalStats.totalSignals, unit: "건" },
                { label: "관련 규제 수", value: signalStats.totalRegulations, unit: "개" },
                { label: "플레이어 수", value: signalStats.totalPlayers, unit: "개" },
              ].map((card) => (
                <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-black text-navy">
                    {card.value}<span className="ml-0.5 text-sm font-bold text-slate-500">{card.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 border-t border-slate-100 p-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-500">규제별 최신 시그널</h3>
                  <span className="text-[11px] font-bold text-slate-400">최대 5개 규제</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {signalRegulationGroups.map((group) => (
                    <div key={group.regId} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(group.regulationName)}`}>
                          {group.regulationName}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {group.signals.map((signal) => (
                          <div key={signal.signal_id} className="flex gap-2 text-sm leading-snug">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emeraldBrand" />
                            <p className="min-w-0 text-slate-600">
                              <span className="font-black text-navy">{signal.player}</span>
                              <span className="px-1 text-slate-300">/</span>
                              <span>{signal.signal_summary}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-500">최신 시그널</h3>
                  <span className="text-[11px] font-bold text-slate-400">최근 5건</span>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="divide-y divide-slate-100">
                    {latestSignalRows.map((signal) => (
                      <div key={signal.signal_id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {formatDate(signal.published_date)}
                          </span>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-black text-white ${codeColor(signal.regulation_name)}`}>
                            {signal.regulation_name}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            {signal.player_type}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-snug text-slate-600">
                          <span className="font-black text-navy">{signal.player}</span>
                          <span className="px-1 text-slate-300">/</span>
                          {signal.signal_summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────
               인텔리전스 패널 (백엔드 동적 연동)
               ───────────────────────────────────────── */}
          <IntelligencePanel />

          {/* 주요 최신 뉴스 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-navy">주요 최신 뉴스</h2>
                <p className="mt-0.5 text-xs text-slate-400">Google News RSS · 규제, 지역, 플레이어, 반응 유형 태그 포함</p>
              </div>
              <a href="/news" className="text-xs font-bold text-emeraldBrand hover:underline">전체 보기 →</a>
            </div>

            {latestNews.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                뉴스를 불러오는 중이거나 수집된 기사가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {latestNews.map((item: any, idx: number) => {
                  const title = item.titleKo || item.title || item.originalTitle || "제목 없음";
                  const code = item.relatedRegulationNames?.[0] || item.regulationId?.toUpperCase() || "";
                  const date = formatDate(item.publishedAt);
                  return (
                    <a
                      key={`${item.url}-${idx}`}
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50"
                    >
                      <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-black text-white ${codeColor(code)}`}>
                        {code || "—"}
                      </span>
                      <span className="flex-1 text-sm font-medium leading-snug text-navy hover:text-emeraldBrand">
                        {title}
                      </span>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {item.sourceRegion && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{item.sourceRegion}</span>
                        )}
                        {item.newsType && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{item.newsType}</span>
                        )}
                        {date && <span className="text-[10px] text-slate-400">{date}</span>}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

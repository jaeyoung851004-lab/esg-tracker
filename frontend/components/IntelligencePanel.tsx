"use client";

/**
 * IntelligencePanel — 인텔리전스 대시보드 패널 (Client Component)
 *
 * 담당 영역:
 *  - /api/v1/intelligence/matrix   → 5×5 규제×이해관계자 신호 매트릭스
 *  - /api/v1/intelligence/hotspots → 글로벌 핫스팟 맵 + 바 차트
 *  - /api/v1/intelligence/detail   → 클릭 → 슬라이딩 Drawer (AI 요약 + 타임라인)
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ── 환경 변수 (브라우저 → 백엔드) ──────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_ESG_TRACKER_API_BASE_URL || "http://127.0.0.1:8000";

// ── 상수 ──────────────────────────────────────────────────────────────────
const REGULATION_TAGS = ["PPWR", "CSDDD", "CSRD", "CBAM", "Battery Reg"] as const;
const STAKEHOLDER_TAGS = ["경쟁사", "평가기관", "정부당국", "기관투자자", "시민단체"] as const;
type RegTag = (typeof REGULATION_TAGS)[number];

const REG_COLORS: Record<RegTag, string> = {
  PPWR: "bg-cyan-600",
  CSDDD: "bg-orange-600",
  CSRD: "bg-rose-600",
  CBAM: "bg-violet-600",
  "Battery Reg": "bg-sky-600",
};

const REG_TEXT_COLORS: Record<RegTag, string> = {
  PPWR: "text-cyan-700",
  CSDDD: "text-orange-700",
  CSRD: "text-rose-700",
  CBAM: "text-violet-700",
  "Battery Reg": "text-sky-700",
};

// ISO-2 → SVG 좌표 (740×360 viewBox 기준)
const ISO_COORDS: Record<string, { x: number; y: number; label: string }> = {
  GB: { x: 340, y: 100, label: "영국" },
  DE: { x: 375, y: 108, label: "독일" },
  FR: { x: 355, y: 122, label: "프랑스" },
  IT: { x: 380, y: 135, label: "이탈리아" },
  NL: { x: 360, y: 105, label: "네덜란드" },
  PL: { x: 395, y: 108, label: "폴란드" },
  ES: { x: 340, y: 135, label: "스페인" },
  EU: { x: 370, y: 118, label: "EU" },
  BE: { x: 364, y: 112, label: "벨기에" },
  US: { x: 160, y: 130, label: "미국" },
  CA: { x: 150, y: 105, label: "캐나다" },
  BR: { x: 245, y: 195, label: "브라질" },
  MX: { x: 145, y: 155, label: "멕시코" },
  KR: { x: 580, y: 130, label: "한국" },
  JP: { x: 600, y: 125, label: "일본" },
  CN: { x: 555, y: 125, label: "중국" },
  IN: { x: 510, y: 150, label: "인도" },
  ID: { x: 565, y: 178, label: "인도네시아" },
  VN: { x: 555, y: 155, label: "베트남" },
  MY: { x: 560, y: 168, label: "말레이시아" },
  SG: { x: 562, y: 173, label: "싱가포르" },
  AU: { x: 610, y: 240, label: "호주" },
  ZA: { x: 400, y: 240, label: "남아공" },
  TR: { x: 415, y: 125, label: "터키" },
  RU: { x: 460, y: 90, label: "러시아" },
  ZZ: { x: 370, y: 118, label: "글로벌" },
};

// ── API 타입 ───────────────────────────────────────────────────────────────
interface Hotspot {
  country_iso: string;
  country_name: string;
  regulation_tag: string;
  recent_count: number;
  baseline_count: number;
  spike_pct: number;
  is_spike: boolean;
}

interface HotspotsResponse {
  regulation: string | null;
  spike_threshold_pct: number;
  total_countries: number;
  spike_countries: number;
  hotspots: Hotspot[];
}

interface MatrixCell {
  regulation_tag: string;
  stakeholder_tag: string;
  count: number;
  is_spike: boolean;
}

interface MatrixResponse {
  regulation_tags: string[];
  stakeholder_tags: string[];
  cells: MatrixCell[];
  matrix: Record<string, Record<string, number>>;
}

interface TimelineEvent {
  event_date?: string | null;
  deadline?: string | null;
  phase?: string | null;
  key_actors?: string[];
}

interface DetailArticle {
  id: number;
  title: string;
  excerpt: string;
  source_name: string;
  created_at: string;
  regulation_tag: string;
  stakeholder_tag: string;
  ai_summary: string;
  timeline: TimelineEvent;
}

interface DetailResponse {
  regulation: string | null;
  country_iso: string | null;
  stakeholder: string | null;
  total: number;
  articles: DetailArticle[];
}

interface DrawerQuery {
  regulation?: string;
  country?: string;
  stakeholder?: string;
  label: string;
}

// ── 유틸 ──────────────────────────────────────────────────────────────────
function formatPct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${Math.round(n)}%`;
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(
      new Date(iso)
    );
  } catch {
    return iso.slice(0, 10);
  }
}

// ── 서브 컴포넌트: 글로벌 핫스팟 SVG 맵 ─────────────────────────────────
function HotspotMap({
  hotspots,
  onCountryClick,
}: {
  hotspots: Hotspot[];
  onCountryClick: (iso: string, label: string) => void;
}) {
  const maxCount = Math.max(...hotspots.map((h) => h.recent_count), 1);

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0f1a2e]">
      <svg viewBox="0 0 740 360" className="w-full">
        {/* 그리드 */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 62} y1={0} x2={i * 62} y2={360} stroke="#1e3050" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 60} x2={740} y2={i * 60} stroke="#1e3050" strokeWidth={0.5} />
        ))}
        {/* 대륙 실루엣 */}
        <path d="M80,70 L220,65 L240,100 L220,160 L180,175 L130,165 L90,140 L70,110 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M180,180 L250,175 L265,200 L255,240 L230,260 L200,255 L185,230 L175,200 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M310,80 L420,75 L435,95 L425,140 L395,150 L355,145 L320,130 L305,105 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M330,150 L410,145 L430,175 L420,230 L390,255 L355,252 L330,220 L320,180 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M430,60 L650,55 L665,80 L660,160 L620,185 L560,190 L490,175 L440,150 L425,110 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />
        <path d="M580,210 L660,205 L670,240 L645,260 L600,258 L580,235 Z" fill="#1a2d4a" stroke="#2a4060" strokeWidth={1} />

        {/* 핫스팟 점 */}
        {hotspots.map((h) => {
          const coord = ISO_COORDS[h.country_iso];
          if (!coord) return null;
          const size = 4 + (h.recent_count / maxCount) * 18;
          const opacity = 0.35 + (h.recent_count / maxCount) * 0.65;
          const color = h.is_spike ? "#f97316" : "#34d399"; // 스파이크 = 주황, 일반 = 에메랄드
          const ringColor = h.is_spike ? "#fb923c" : "#34d399";
          return (
            <g
              key={h.country_iso}
              className="cursor-pointer"
              onClick={() => onCountryClick(h.country_iso, coord.label)}
            >
              {h.is_spike && (
                <circle cx={coord.x} cy={coord.y} r={size + 8} fill="none" stroke={ringColor} strokeWidth={1} opacity={0.2}>
                  <animate attributeName="r" values={`${size + 4};${size + 12};${size + 4}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={coord.x} cy={coord.y} r={size + 5} fill="none" stroke={ringColor} strokeWidth={1} opacity={opacity * 0.4} />
              <circle cx={coord.x} cy={coord.y} r={size} fill={color} opacity={opacity} />
              {h.recent_count >= 2 && (
                <text x={coord.x} y={coord.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={size > 10 ? 9 : 7} fontWeight="bold" fill="white" opacity={0.95}>
                  {h.recent_count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 범례 */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-orange-400" />
          <span className="text-[10px] text-slate-400">급등 (spike ≥100%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-slate-400">일반</span>
        </div>
      </div>

      {/* 상위 국가 목록 */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        {hotspots.slice(0, 5).map((h) => (
          <div key={h.country_iso} className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${h.is_spike ? "bg-orange-400" : "bg-emerald-400"}`} />
            <span className="font-mono text-[10px] text-slate-400">
              {ISO_COORDS[h.country_iso]?.label ?? h.country_name}{" "}
              <span className={h.is_spike ? "text-orange-400" : "text-emerald-400"}>
                {h.recent_count}건
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 서브 컴포넌트: 바 차트 ────────────────────────────────────────────────
function HotspotBarChart({
  hotspots,
  onCountryClick,
}: {
  hotspots: Hotspot[];
  onCountryClick: (iso: string, label: string) => void;
}) {
  const top = hotspots.slice(0, 8);
  const maxPct = Math.max(...top.map((h) => Math.abs(h.spike_pct)), 1);

  return (
    <div className="space-y-2">
      {top.map((h) => {
        const label = ISO_COORDS[h.country_iso]?.label ?? h.country_name;
        const barWidth = Math.min((Math.abs(h.spike_pct) / maxPct) * 100, 100);
        return (
          <button
            key={h.country_iso}
            onClick={() => onCountryClick(h.country_iso, label)}
            className="group flex w-full items-center gap-2 text-left"
          >
            <span className="w-16 shrink-0 text-right text-[11px] text-slate-500 group-hover:text-navy">
              {label}
            </span>
            <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all ${h.is_spike ? "bg-orange-500" : "bg-emeraldBrand"}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className={`w-14 text-right font-mono text-[11px] font-bold ${h.is_spike ? "text-orange-600" : "text-emeraldBrand"}`}>
              {formatPct(h.spike_pct)}
            </span>
            {h.is_spike && (
              <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                SPIKE
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── 서브 컴포넌트: 5×5 매트릭스 ──────────────────────────────────────────
function SignalMatrix({
  matrixData,
  onCellClick,
}: {
  matrixData: MatrixResponse | null;
  onCellClick: (reg: string, st: string) => void;
}) {
  if (!matrixData) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        매트릭스 데이터를 불러오는 중...
      </div>
    );
  }

  const allCounts = matrixData.cells.map((c) => c.count);
  const maxCount = Math.max(...allCounts, 1);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="w-24 px-2 py-2 text-left text-[11px] font-black text-slate-400">
              규제 ↓ / 이해관계자 →
            </th>
            {matrixData.stakeholder_tags.map((st) => (
              <th key={st} className="px-2 py-2 text-center text-[11px] font-bold text-slate-500">
                {st}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {matrixData.regulation_tags.map((reg) => (
            <tr key={reg}>
              <td className="px-2 py-2">
                <span className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${REG_COLORS[reg as RegTag] ?? "bg-navy"}`}>
                  {reg}
                </span>
              </td>
              {matrixData.stakeholder_tags.map((st) => {
                const cell = matrixData.cells.find(
                  (c) => c.regulation_tag === reg && c.stakeholder_tag === st
                );
                const count = cell?.count ?? 0;
                const isSpike = cell?.is_spike ?? false;
                const intensity = count / maxCount;
                const bg = count === 0
                  ? "bg-slate-50"
                  : isSpike
                  ? "bg-orange-50 hover:bg-orange-100"
                  : intensity > 0.6
                  ? "bg-emerald-50 hover:bg-emerald-100"
                  : "bg-slate-100 hover:bg-slate-200";
                const textColor = isSpike
                  ? "text-orange-700 font-black"
                  : count > 0
                  ? `${REG_TEXT_COLORS[reg as RegTag] ?? "text-navy"} font-bold`
                  : "text-slate-300";
                return (
                  <td key={st} className="px-1 py-1 text-center">
                    <button
                      onClick={() => onCellClick(reg, st)}
                      disabled={count === 0}
                      className={`h-9 w-full min-w-[52px] rounded-lg text-sm transition-all disabled:cursor-default ${bg} ${textColor} ${count > 0 ? "cursor-pointer shadow-sm" : ""}`}
                      title={`${reg} × ${st} — ${count}건${isSpike ? " 🔺 급등" : ""}`}
                    >
                      {count === 0 ? "—" : count}
                      {isSpike && <span className="ml-0.5 text-[10px]">🔺</span>}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 서브 컴포넌트: Drawer ─────────────────────────────────────────────────
function DetailDrawer({
  open,
  query,
  data,
  loading,
  onClose,
}: {
  open: boolean;
  query: DrawerQuery | null;
  data: DetailResponse | null;
  loading: boolean;
  onClose: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity ${open ? "opacity-30" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      {/* 슬라이딩 Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* 헤더 */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-emeraldBrand">
              Intelligence Detail
            </p>
            <h2 className="mt-1 text-base font-black text-navy">
              {query?.label ?? "AI 인텔리전스 보고서"}
            </h2>
            {data && (
              <p className="mt-0.5 text-xs text-slate-400">
                {data.total}건 매칭
                {query?.regulation && ` · ${query.regulation}`}
                {query?.country && ` · ${query.country}`}
                {query?.stakeholder && ` · ${query.stakeholder}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emeraldBrand border-t-transparent" />
              <span className="ml-3 text-sm text-slate-400">AI 보고서 생성 중...</span>
            </div>
          )}

          {!loading && (!data || data.articles.length === 0) && (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-slate-400">
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx={12} cy={12} r={10} />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <p className="text-sm">아직 처리된 인텔리전스 데이터가 없습니다.</p>
              <p className="text-xs">LLM 파이프라인이 실행된 후 데이터가 표시됩니다.</p>
            </div>
          )}

          {!loading && data && data.articles.length > 0 && (
            <div className="space-y-6">
              {data.articles.map((article, idx) => (
                <div key={article.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  {/* 태그 행 */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${REG_COLORS[article.regulation_tag as RegTag] ?? "bg-navy"}`}>
                      {article.regulation_tag}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {article.stakeholder_tag}
                    </span>
                    {article.source_name && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-200">
                        {article.source_name}
                      </span>
                    )}
                    {article.created_at && (
                      <span className="ml-auto font-mono text-[11px] text-slate-400">
                        {formatDate(article.created_at)}
                      </span>
                    )}
                  </div>

                  {/* 원문 제목 */}
                  <h3 className="text-sm font-black leading-snug text-navy">
                    {idx + 1}. {article.title}
                  </h3>

                  {/* AI 3줄 요약 */}
                  {article.ai_summary && (
                    <div className="mt-3 rounded-lg border border-emerald-100 bg-white p-3">
                      <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-emeraldBrand">
                        AI 3줄 요약 보고서
                      </p>
                      <div className="space-y-1">
                        {article.ai_summary
                          .split("\n")
                          .filter(Boolean)
                          .map((line, i) => (
                            <p key={i} className="text-sm leading-relaxed text-slate-700">
                              {line.startsWith("•") ? line : `• ${line}`}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 뉴스 타임라인 */}
                  {article.timeline && (
                    <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-slate-100">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        뉴스 타임라인
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        {article.timeline.phase && (
                          <>
                            <span className="font-bold text-slate-500">단계</span>
                            <span className="font-bold text-navy">{article.timeline.phase}</span>
                          </>
                        )}
                        {article.timeline.event_date && (
                          <>
                            <span className="font-bold text-slate-500">사건 일자</span>
                            <span className="text-slate-600">{article.timeline.event_date}</span>
                          </>
                        )}
                        {article.timeline.deadline && (
                          <>
                            <span className="font-bold text-slate-500">마감 기한</span>
                            <span className="font-bold text-red-600">{article.timeline.deadline}</span>
                          </>
                        )}
                        {article.timeline.key_actors && article.timeline.key_actors.length > 0 && (
                          <>
                            <span className="font-bold text-slate-500">핵심 주체</span>
                            <span className="text-slate-600">
                              {article.timeline.key_actors.join(", ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 본문 발췌 */}
                  {article.excerpt && (
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-400">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export function IntelligencePanel() {
  const [selectedReg, setSelectedReg] = useState<string | null>(null);

  const [matrixData, setMatrixData] = useState<MatrixResponse | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(true);

  const [hotspotData, setHotspotData] = useState<HotspotsResponse | null>(null);
  const [hotspotLoading, setHotspotLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerQuery, setDrawerQuery] = useState<DrawerQuery | null>(null);
  const [drawerData, setDrawerData] = useState<DetailResponse | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // ── 매트릭스 fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    setMatrixLoading(true);
    fetch(`${API_BASE}/api/v1/intelligence/matrix`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMatrixData(d))
      .catch(() => setMatrixData(null))
      .finally(() => setMatrixLoading(false));
  }, []);

  // ── 핫스팟 fetch (규제 필터 변경 시 리프레시) ─────────────────────────────
  useEffect(() => {
    setHotspotLoading(true);
    const url = selectedReg
      ? `${API_BASE}/api/v1/intelligence/hotspots?regulation=${encodeURIComponent(selectedReg)}&limit=20`
      : `${API_BASE}/api/v1/intelligence/hotspots?limit=20`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setHotspotData(d))
      .catch(() => setHotspotData(null))
      .finally(() => setHotspotLoading(false));
  }, [selectedReg]);

  // ── Drawer 열기 (detail fetch) ────────────────────────────────────────────
  const openDrawer = useCallback((query: DrawerQuery) => {
    setDrawerQuery(query);
    setDrawerOpen(true);
    setDrawerData(null);
    setDrawerLoading(true);

    const params = new URLSearchParams({ limit: "10" });
    if (query.regulation) params.set("regulation", query.regulation);
    if (query.country) params.set("country", query.country);
    if (query.stakeholder) params.set("stakeholder", query.stakeholder);

    fetch(`${API_BASE}/api/v1/intelligence/detail?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDrawerData(d))
      .catch(() => setDrawerData(null))
      .finally(() => setDrawerLoading(false));
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // ── 셀 클릭 핸들러 ───────────────────────────────────────────────────────
  const handleCellClick = useCallback(
    (reg: string, st: string) => {
      openDrawer({
        regulation: reg,
        stakeholder: st,
        label: `${reg} × ${st}`,
      });
    },
    [openDrawer]
  );

  // ── 지도/바차트 국가 클릭 핸들러 ─────────────────────────────────────────
  const handleCountryClick = useCallback(
    (iso: string, label: string) => {
      openDrawer({
        regulation: selectedReg ?? undefined,
        country: iso,
        label: selectedReg ? `${label} — ${selectedReg}` : label,
      });
    },
    [openDrawer, selectedReg]
  );

  // ── KPI 카드 데이터 계산 ─────────────────────────────────────────────────
  const totalSignals =
    matrixData?.cells.reduce((s, c) => s + c.count, 0) ?? null;
  const spikeCount = hotspotData?.spike_countries ?? null;
  const trackedCountries = hotspotData?.total_countries ?? null;

  return (
    <section className="space-y-5">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emeraldBrand">
            Intelligence Layer
          </p>
          <h2 className="mt-0.5 text-lg font-black text-navy">
            글로벌 다차원 인텔리전스
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            5대 규제 × 5대 이해관계자 · 전 세계 핫스팟 · DB 실시간 집계
          </p>
        </div>

        {/* 규제 필터 버튼 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedReg(null)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              selectedReg === null
                ? "bg-navy text-white shadow"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            전체
          </button>
          {REGULATION_TAGS.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedReg(selectedReg === reg ? null : reg)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                selectedReg === reg
                  ? `${REG_COLORS[reg]} text-white shadow`
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 카드 3종 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400">DB 누적 신호</p>
          <p className="mt-2 text-2xl font-black text-navy">
            {matrixLoading ? "—" : (totalSignals ?? 0)}
            <span className="ml-0.5 text-sm font-bold text-slate-400">건</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">규제×이해관계자 매트릭스 기준</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-bold text-orange-400">급등 국가 (Spike)</p>
          <p className="mt-2 text-2xl font-black text-orange-600">
            {hotspotLoading ? "—" : (spikeCount ?? 0)}
            <span className="ml-0.5 text-sm font-bold">개국</span>
          </p>
          <p className="mt-1 text-[11px] text-orange-400">7일 vs 28일 변동률 ≥100%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400">감지 국가</p>
          <p className="mt-2 text-2xl font-black text-emeraldBrand">
            {hotspotLoading ? "—" : (trackedCountries ?? 0)}
            <span className="ml-0.5 text-sm font-bold text-slate-400">개국</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {selectedReg ? `${selectedReg} 기준` : "전체 규제 기준"}
          </p>
        </div>
      </div>

      {/* 매트릭스 + 핫스팟 */}
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">

        {/* 5×5 신호 매트릭스 */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-black text-navy">이해관계자 × 규제 신호 매트릭스</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                셀 클릭 → AI 요약 Drawer · 🔺 표시 = 평균 2배 이상 급등
              </p>
            </div>
            {matrixLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emeraldBrand border-t-transparent" />
            )}
          </div>
          <div className="p-4">
            <SignalMatrix matrixData={matrixData} onCellClick={handleCellClick} />
          </div>
        </div>

        {/* 핫스팟 바 차트 */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-black text-navy">국가별 Volume Spike</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                7일 vs 28일 평균 변동률 내림차순
                {selectedReg && <span className="ml-1 font-bold text-emeraldBrand">· {selectedReg}</span>}
              </p>
            </div>
            {hotspotLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emeraldBrand border-t-transparent" />
            )}
          </div>
          <div className="p-4">
            {hotspotData && hotspotData.hotspots.length > 0 ? (
              <HotspotBarChart
                hotspots={hotspotData.hotspots}
                onCountryClick={handleCountryClick}
              />
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-1 text-slate-400">
                <p className="text-sm">핫스팟 데이터 없음</p>
                <p className="text-xs">LLM 파이프라인 실행 후 집계됩니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 글로벌 핫스팟 맵 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-black text-navy">글로벌 핫스팟 지도</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              국가 점 클릭 → AI 인텔리전스 Drawer · 주황 = Spike 급등
              {selectedReg && <span className="ml-1 font-bold text-emeraldBrand">· {selectedReg} 필터 적용 중</span>}
            </p>
          </div>
        </div>
        <div className="p-4">
          {hotspotData && hotspotData.hotspots.length > 0 ? (
            <HotspotMap
              hotspots={hotspotData.hotspots}
              onCountryClick={handleCountryClick}
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl bg-[#0f1a2e] text-sm text-slate-500">
              핫스팟 데이터 없음 — LLM 파이프라인 실행 후 표시됩니다
            </div>
          )}
        </div>
      </div>

      {/* 슬라이딩 Drawer */}
      <DetailDrawer
        open={drawerOpen}
        query={drawerQuery}
        data={drawerData}
        loading={drawerLoading}
        onClose={closeDrawer}
      />
    </section>
  );
}

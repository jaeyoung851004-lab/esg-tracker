"use client";

/**
 * IntelligencePanel — 임팩트온 ESG 인텔리전스 마스터 대시보드
 * 마스터 디자인: impacton_dashboard_v3_enterprise.html 100% 포팅
 * 다크-라임 시스템: --bg0 #0a0f16 / --lime #D4FF6D
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ── API Base ──────────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_ESG_TRACKER_API_BASE_URL ||
  "https://esg-tracker.onrender.com";

// ── CSS 변수 인라인 (Tailwind 미지원 토큰 보완) ─────────────────────────
const T = {
  bg0: "#0a0f16",
  bg1: "#111822",
  bg2: "#18202c",
  bg3: "#1f2a38",
  bg4: "#263044",
  lime: "#D4FF6D",
  limeDim: "rgba(212,255,109,0.12)",
  limeBorder: "rgba(212,255,109,0.25)",
  border: "#1e2d3d",
  border2: "#2a3d52",
  txt: "#dce8f5",
  txt2: "#7a90a8",
  txt3: "#435a72",
  red: "#ff5f5f",
  redBg: "rgba(255,95,95,0.12)",
  amber: "#f0b429",
  amberBg: "rgba(240,180,41,0.12)",
  green: "#3dd68c",
  greenBg: "rgba(61,214,140,0.1)",
  blue: "#4d9de0",
  blueBg: "rgba(77,157,224,0.1)",
  blueTxt: "#6db3e8",
  grayBg: "rgba(255,255,255,0.04)",
};

// ── 이해관계자 태그 → 뱃지 매핑 ─────────────────────────────────────────
// [기업]=파랑 tag-c  [정책]=초록 tag-p  [금융]=노랑 tag-m  [국내]=빨강 tag-s
function stakeholderBadge(tag: string): { bg: string; color: string; label: string } {
  if (/경쟁|기업|글로벌/.test(tag))
    return { bg: T.blueBg, color: T.blueTxt, label: "기업" };
  if (/정부|규제|당국|정책|평가|이니셔티브/.test(tag))
    return { bg: T.greenBg, color: T.green, label: "정책" };
  if (/금융|투자|기관/.test(tag))
    return { bg: T.amberBg, color: T.amber, label: "금융" };
  return { bg: T.redBg, color: T.red, label: "국내" };
}

// ── 규제 태그 → 셀 배경색 ────────────────────────────────────────────────
const REG_CHIP_COLORS: Record<string, { bg: string; color: string }> = {
  CSRD:          { bg: "rgba(244,63,94,0.15)",   color: "#fb7185" },
  CSDDD:         { bg: "rgba(249,115,22,0.15)",  color: "#fb923c" },
  CBAM:          { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa" },
  PPWR:          { bg: "rgba(6,182,212,0.15)",   color: "#22d3ee" },
  "Battery Reg": { bg: "rgba(14,165,233,0.15)",  color: "#38bdf8" },
  EUDR:                 { bg: "rgba(234,179,8,0.15)",   color: "#facc15" },
  ESPR:                 { bg: "rgba(20,184,166,0.15)",  color: "#2dd4bf" },
  GCD:                  { bg: "rgba(132,204,22,0.15)",  color: "#a3e635" },
  "AI Act":             { bg: "rgba(99,102,241,0.15)",  color: "#818cf8" },
  DPP:                  { bg: "rgba(217,70,239,0.15)",  color: "#e879f9" },
  ELV:         { bg: "rgba(236,72,153,0.15)",  color: "#f472b6" },
  SFDR:        { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  CA_Climate:  { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  IMO_Reg:     { bg: "rgba(20,184,166,0.15)",  color: "#2dd4bf" },
};
function regChip(tag: string) {
  return REG_CHIP_COLORS[tag] ?? { bg: T.grayBg, color: T.txt2 };
}

// ── ISO 좌표 (500×240 viewBox 기준, 마스터 HTML 스케일) ──────────────────
const ISO_COORDS: Record<string, { x: number; y: number; label: string }> = {
  EU: { x: 225, y: 68, label: "EU" },
  GB: { x: 200, y: 62, label: "영국" },
  DE: { x: 228, y: 65, label: "독일" },
  FR: { x: 215, y: 74, label: "프랑스" },
  IT: { x: 228, y: 82, label: "이탈리아" },
  NL: { x: 220, y: 62, label: "네덜란드" },
  PL: { x: 238, y: 62, label: "폴란드" },
  ES: { x: 205, y: 82, label: "스페인" },
  BE: { x: 220, y: 68, label: "벨기에" },
  US: { x: 95, y: 80, label: "미국" },
  CA: { x: 88, y: 62, label: "캐나다" },
  BR: { x: 148, y: 118, label: "브라질" },
  MX: { x: 87, y: 93, label: "멕시코" },
  KR: { x: 357, y: 78, label: "한국" },
  JP: { x: 370, y: 74, label: "일본" },
  CN: { x: 338, y: 75, label: "중국" },
  IN: { x: 310, y: 92, label: "인도" },
  ID: { x: 345, y: 108, label: "인도네시아" },
  VN: { x: 338, y: 94, label: "베트남" },
  MY: { x: 340, y: 101, label: "말레이시아" },
  SG: { x: 342, y: 105, label: "싱가포르" },
  AU: { x: 378, y: 148, label: "호주" },
  ZA: { x: 243, y: 148, label: "남아공" },
  TR: { x: 252, y: 76, label: "터키" },
  RU: { x: 280, y: 55, label: "러시아" },
  ZZ: { x: 225, y: 72, label: "글로벌" },
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
  generated_at: string;
  regulation: string | null;
  country_iso: string | null;
  stakeholder: string | null;
  total: number;
  articles: DetailArticle[];
}
interface NewsFallbackItem {
  title: string;
  summary?: string;
  source?: string;
  publishedAt?: string;
  regulationId?: string;
  actorType?: string;
  reactionType?: string;
  newsType?: string;
}
interface NewsFallbackResponse {
  items?: NewsFallbackItem[];
}
interface DrawerQuery {
  regulation?: string;
  country?: string;
  stakeholder?: string;
  label: string;
}

const NEWS_REGULATION_ID_BY_TAG: Record<string, string> = {
  ESPR: "espr",
  PPWR: "ppwr",
  CSDDD: "csddd",
  CSRD: "csrd",
  CBAM: "cbam",
  EUDR: "eudr",
  GCD: "green_claims",
  "AI Act": "eu_ai_act",
  "Battery Reg": "battery_reg",
  DPP: "dpp",
  ELV: "eu_elv",
};

// ── 유틸 ──────────────────────────────────────────────────────────────────
function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${Math.round(n)}%`;
}
function fmtDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
function buildNewsFallbackUrl(q: DrawerQuery) {
  const params = new URLSearchParams({ limit: "10" });
  if (q.regulation && NEWS_REGULATION_ID_BY_TAG[q.regulation]) {
    params.set("regulation_id", NEWS_REGULATION_ID_BY_TAG[q.regulation]);
  }
  return `/api/news?${params.toString()}`;
}
function toFallbackDetailResponse(q: DrawerQuery, feed: NewsFallbackResponse): DetailResponse {
  const articles = (feed.items ?? []).slice(0, 10).map((item, index) => ({
    id: -1 - index,
    title: item.title || "",
    excerpt: item.summary || "",
    source_name: item.source || "",
    created_at: item.publishedAt || new Date().toISOString(),
    regulation_tag: q.regulation || item.regulationId || "",
    stakeholder_tag: q.stakeholder || item.actorType || "",
    ai_summary: item.summary || item.title || "",
    timeline: {
      phase: item.reactionType || item.newsType || "뉴스 API 폴백",
      key_actors: item.actorType ? [item.actorType] : [],
    },
  }));
  return {
    generated_at: new Date().toISOString(),
    regulation: q.regulation ?? null,
    country_iso: q.country ?? null,
    stakeholder: q.stakeholder ?? null,
    total: articles.length,
    articles,
  };
}

// ── 글로벌 핫스팟 SVG 맵 ────────────────────────────────────────────────
function HotspotMap({
  hotspots,
  onClick,
}: {
  hotspots: Hotspot[];
  onClick: (iso: string, label: string) => void;
}) {
  const max = Math.max(...hotspots.map((h) => h.recent_count), 1);
  const landPaths = [
    "M55,55 L115,50 L128,68 L138,88 L118,98 L78,93 L55,75 Z",
    "M148,52 L198,48 L208,78 L198,108 L158,113 L143,88 Z",
    "M218,38 L278,36 L293,53 L288,78 L258,88 L233,83 L213,63 Z",
    "M223,93 L273,88 L283,123 L258,138 L228,128 L216,113 Z",
    "M283,33 L358,28 L378,53 L368,88 L338,98 L288,83 L276,58 Z",
    "M353,93 L378,88 L393,118 L373,133 L348,123 Z",
    "M398,138 L448,136 L458,168 L428,183 L398,173 Z",
  ];

  return (
    <div
      style={{
        background: T.bg2,
        borderRadius: 8,
        position: "relative",
        overflow: "hidden",
        flex: 1,
        minHeight: 80,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 10,
          fontSize: 9,
          color: T.txt3,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: T.green,
            display: "inline-block",
          }}
        />
        <span style={{ color: T.lime, fontWeight: 500 }}>리스크 감지 중</span>
      </div>
      <svg viewBox="0 0 500 240" style={{ width: "100%", height: "100%" }}>
        <rect width={500} height={240} fill="#0d1520" />
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 30} x2={500} y2={i * 30} stroke="#131e2a" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={240} stroke="#131e2a" strokeWidth={0.5} />
        ))}
        {landPaths.map((d, i) => (
          <path key={i} d={d} fill="#1a2840" stroke={T.border} strokeWidth={0.8} />
        ))}
        {/* 한국 기준점 */}
        <circle cx={357} cy={78} r={3} fill={T.lime} />
        <text x={357} y={72} textAnchor="middle" fontSize={7} fill={T.lime} fontFamily="sans-serif">한국</text>

        {hotspots.map((h) => {
          const coord = ISO_COORDS[h.country_iso];
          if (!coord) return null;
          const size = 3 + (h.recent_count / max) * 10;
          const op = 0.4 + (h.recent_count / max) * 0.6;
          const col = h.is_spike ? T.red : T.green;
          return (
            <g key={h.country_iso} style={{ cursor: "pointer" }} onClick={() => onClick(h.country_iso, coord.label)}>
              {h.is_spike && (
                <>
                  <circle cx={coord.x} cy={coord.y} r={size + 10} fill={`rgba(255,95,95,0)`} stroke="none" style={{ animation: "hs-out 2s ease-in-out infinite" }} />
                  <circle cx={coord.x} cy={coord.y} r={size + 6} fill={`rgba(255,95,95,0.18)`} style={{ animation: "hs-mid 2s ease-in-out infinite" }} />
                </>
              )}
              <circle cx={coord.x} cy={coord.y} r={size} fill={col} opacity={op} />
              {h.recent_count >= 2 && (
                <text x={coord.x} y={coord.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={size > 7 ? 8 : 6} fontWeight="bold" fill="white" opacity={0.95}>
                  {h.recent_count}
                </text>
              )}
              <text x={coord.x} y={coord.y + size + 8} textAnchor="middle" fontSize={7} fill={col} fontFamily="sans-serif" opacity={0.8}>
                {coord.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── 바 차트 ───────────────────────────────────────────────────────────────
function BarChart({
  hotspots,
  onClick,
}: {
  hotspots: Hotspot[];
  onClick: (iso: string, label: string) => void;
}) {
  const top = hotspots.slice(0, 9);
  const maxPct = Math.max(...top.map((h) => Math.abs(h.spike_pct)), 1);

  return (
    <div style={{ flexShrink: 0, marginTop: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: T.txt2, marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ color: T.lime, fontSize: 12 }}>▪</span>
        9대 전략 국가 금주 보도량 변동
      </div>
      {top.map((h) => {
        const label = ISO_COORDS[h.country_iso]?.label ?? h.country_name;
        const w = Math.min((Math.abs(h.spike_pct) / maxPct) * 100, 100);
        return (
          <div
            key={h.country_iso}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer" }}
            onClick={() => onClick(h.country_iso, label)}
          >
            <div style={{ fontSize: 9, color: T.txt2, width: 76, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {label}
            </div>
            <div style={{ flex: 1, height: 4, background: T.bg3, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, width: `${w}%`, background: h.is_spike ? T.red : T.border2 }} />
            </div>
            <div style={{ fontSize: 9, fontWeight: 500, width: 36, textAlign: "right", flexShrink: 0, color: h.is_spike ? "#ff7e7e" : T.txt3 }}>
              {fmtPct(h.spike_pct)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 신호 매트릭스 ─────────────────────────────────────────────────────────
function SignalMatrix({
  data,
  onCellClick,
}: {
  data: MatrixResponse | null;
  onCellClick: (reg: string, st: string, cell: MatrixCell | undefined) => void;
}) {
  if (!data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, fontSize: 12, color: T.txt3 }}>
        매트릭스 데이터 로딩 중...
      </div>
    );
  }

  const maxCount = Math.max(...data.cells.map((c) => c.count), 1);

  // 이해관계자 → 4색 배지 정의 ([경쟁사]=블루, [정부당국]=그린, [기관투자자]=노랑, [시민단체]=레드, [평가기관]=퍼플)
  const stBadge: Record<string, { bg: string; color: string; icon: string }> = {
    "경쟁사":    { bg: "rgba(77,157,224,0.18)",  color: "#6db3e8", icon: "🏭" },
    "평가기관":  { bg: "rgba(139,92,246,0.18)",  color: "#a78bfa", icon: "🏅" },
    "정부당국":  { bg: "rgba(61,214,140,0.15)",  color: "#3dd68c", icon: "⚖️" },
    "기관투자자":{ bg: "rgba(240,180,41,0.18)",  color: "#f0b429", icon: "📈" },
    "시민단체":  { bg: "rgba(255,95,95,0.15)",   color: "#ff7e7e", icon: "🌱" },
  };

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ fontSize: 10, fontWeight: 500, color: T.txt3, padding: "5px 5px 7px", textAlign: "left", borderBottom: `1px solid ${T.border}`, width: 80 }}>
              규제
            </th>
            {data.stakeholder_tags.map((st) => {
              const sb = stBadge[st] ?? { bg: "rgba(255,255,255,0.05)", color: T.txt2, icon: "•" };
              return (
                <th key={st} style={{ padding: "5px 4px 7px", textAlign: "center", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 12 }}>{sb.icon}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: sb.color,
                      background: sb.bg, padding: "1px 5px", borderRadius: 4,
                      whiteSpace: "nowrap",
                    }}>{st.split("·")[0]}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.regulation_tags.map((reg) => {
            const chip = regChip(reg);
            const rowTotal = data.cells
              .filter((c) => c.regulation_tag === reg)
              .reduce((sum, c) => sum + c.count, 0);
            const regColor = rowTotal === 0 ? T.txt3 : chip.color;
            return (
              <tr key={reg} style={{ cursor: "default" }}>
                <td style={{ padding: "3px 4px", verticalAlign: "middle" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: regColor, lineHeight: 1.2 }}>{reg}</div>
                </td>
                {data.stakeholder_tags.map((st) => {
                  const cell = data.cells.find((c) => c.regulation_tag === reg && c.stakeholder_tag === st);
                  const count = cell?.count ?? 0;
                  const isSpike = cell?.is_spike ?? false;
                  const intensity = count / maxCount;

                  let bg = T.grayBg;
                  let labelColor = T.txt3;
                  let labelWeight: string | number = 400;
                  if (count > 0 && isSpike) {
                    bg = T.redBg;
                    labelColor = "#ff7e7e";
                    labelWeight = 700;
                  } else if (count > 0 && intensity > 0.6) {
                    bg = T.greenBg;
                    labelColor = T.green;
                    labelWeight = 700;
                  } else if (count > 0) {
                    bg = chip.bg;
                    labelColor = chip.color;
                    labelWeight = 500;
                  }

                  return (
                    <td key={st} style={{ padding: "3px 4px", textAlign: "center", verticalAlign: "middle" }}>
                      <div
                        role={count > 0 ? "button" : undefined}
                        onClick={count > 0 ? () => onCellClick(reg, st, cell) : undefined}
                        title={count > 0 ? `${reg} × ${st} — ${count}건${isSpike ? " 급등" : ""}` : undefined}
                        style={{
                          borderRadius: 6,
                          padding: "5px 5px",
                          textAlign: "center",
                          cursor: count > 0 ? "pointer" : "default",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                          minHeight: 36,
                          justifyContent: "center",
                          background: bg,
                          transition: "transform 0.12s, box-shadow 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          if (count > 0) {
                            (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${T.lime}`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      >
                        <span style={{ fontSize: 9, fontWeight: labelWeight as number, color: labelColor, lineHeight: 1.2 }}>
                          {count === 0 ? "—" : `+${count}건`}
                        </span>
                        {isSpike && count > 0 && (
                          <span style={{ fontSize: 8, color: "#ff5f5f", fontWeight: 700, lineHeight: 1 }}>SPIKE🔺</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────
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
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  // 뱃지 타입 결정: stakeholder_tag 기반
  const bMap: Record<string, { cls: string; label: string; bg: string; color: string }> = {
    "기업":  { cls: "tag-c", label: "기업",  bg: T.blueBg,  color: T.blueTxt },
    "정책":  { cls: "tag-p", label: "정책",  bg: T.greenBg, color: T.green },
    "금융":  { cls: "tag-m", label: "금융",  bg: T.amberBg, color: T.amber },
    "국내":  { cls: "tag-s", label: "국내",  bg: T.redBg,   color: T.red },
  };
  function artBadge(article: DetailArticle) {
    const b = stakeholderBadge(article.stakeholder_tag);
    return bMap[b.label] ?? { cls: "tag-s", label: b.label, bg: b.bg, color: b.color };
  }

  return (
    <>
      {/* 오버레이 */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* 슬라이딩 서랍 */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          zIndex: 50,
          height: "100%",
          width: open ? 420 : 0,
          overflow: "hidden",
          background: T.bg1,
          borderLeft: `1px solid ${T.border}`,
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "22px 20px",
            width: 420,
            overflowY: "auto",
            height: "100%",
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            style={{
              float: "right",
              cursor: "pointer",
              color: T.txt3,
              fontSize: 15,
              marginTop: 2,
              background: "none",
              border: "none",
            }}
            aria-label="닫기"
          >
            ✕
          </button>

          {query && (
            <>
              {/* 배지 */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "3px 8px",
                  borderRadius: 10,
                  marginBottom: 8,
                  background: T.limeDim,
                  color: T.lime,
                }}
              >
                ⚡ 인텔리전스 보고서
              </div>

              <div style={{ fontSize: 18, fontWeight: 500, color: T.txt, lineHeight: 1.35, marginBottom: 3 }}>
                {query.label}
              </div>
              {data && (
                <div style={{ fontSize: 11, color: T.txt3, marginBottom: 14, lineHeight: 1.5 }}>
                  {data.total}건 매칭
                  {query.regulation && ` · ${query.regulation}`}
                  {query.stakeholder && ` · ${query.stakeholder}`}
                  {query.country && ` · ${query.country}`}
                </div>
              )}
            </>
          )}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: T.txt3, fontSize: 12 }}>
              <span style={{ marginRight: 8 }}>⏳</span>AI 보고서 생성 중...
            </div>
          )}

          {!loading && (!data || data.articles.length === 0) && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 120, color: T.txt3, fontSize: 11, gap: 6, textAlign: "center" }}>
              <span style={{ fontSize: 24 }}>📭</span>
              <p>현재 매칭된 뉴스 API 후보가 없습니다.</p>
              {query && (
                <a
                  href={buildNewsFallbackUrl(query)}
                  style={{ color: T.lime, textDecoration: "underline", textDecorationStyle: "dotted" }}
                >
                  뉴스 API 원문 후보 열기
                </a>
              )}
            </div>
          )}

          {!loading && data && data.articles.map((article, idx) => {
            const badge = artBadge(article);
            return (
              <div key={article.id} style={{ marginBottom: 24 }}>
                {/* AI 3줄 요약 박스 (첫 번째 아티클) */}
                {idx === 0 && article.ai_summary && (
                  <div
                    style={{
                      background: "rgba(212,255,109,0.06)",
                      border: `1px solid ${T.limeBorder}`,
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 500, color: T.lime, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      ✨ AI 시장 동향 요약
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(220,245,255,0.8)", lineHeight: 1.8 }}>
                      {article.ai_summary.split("\n").filter(Boolean).map((line, i) => (
                        <p key={i}>{line.startsWith("•") ? line : `• ${line}`}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 타임라인 아이템 */}
                <div
                  style={{
                    borderLeft: `1px solid ${idx === 0 ? T.lime : T.border2}`,
                    paddingLeft: 10,
                    paddingBottom: 10,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: idx === 0 ? T.lime : T.border2,
                      position: "absolute",
                      left: -3,
                      top: 4,
                    }}
                  />
                  <div style={{ fontSize: 11, color: T.txt3, marginBottom: 2 }}>
                    {fmtDate(article.created_at) ?? ""}
                  </div>
                  <div style={{ fontSize: 13, color: T.txt, lineHeight: 1.5, marginBottom: 2 }}>
                    {article.title}
                  </div>
                  <div style={{ fontSize: 11, color: T.txt3 }}>
                    {article.source_name}
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 10,
                        padding: "1px 5px",
                        borderRadius: 5,
                        marginLeft: 3,
                        background: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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

  useEffect(() => {
    setMatrixLoading(true);
    fetch(`${API_BASE}/api/v1/intelligence/matrix`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setMatrixData)
      .catch(() => setMatrixData(null))
      .finally(() => setMatrixLoading(false));
  }, []);

  useEffect(() => {
    setHotspotLoading(true);
    const url = selectedReg
      ? `${API_BASE}/api/v1/intelligence/hotspots?regulation=${encodeURIComponent(selectedReg)}&limit=20`
      : `${API_BASE}/api/v1/intelligence/hotspots?limit=20`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then(setHotspotData)
      .catch(() => setHotspotData(null))
      .finally(() => setHotspotLoading(false));
  }, [selectedReg]);

  const openDrawer = useCallback((q: DrawerQuery) => {
    setDrawerQuery(q);
    setDrawerOpen(true);
    setDrawerData(null);
    setDrawerLoading(true);
    const params = new URLSearchParams({ limit: "10" });
    if (q.regulation) params.set("regulation", q.regulation);
    if (q.country) params.set("country", q.country);
    if (q.stakeholder) params.set("stakeholder", q.stakeholder);
    fetch(`${API_BASE}/api/v1/intelligence/detail?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(async (detail: DetailResponse | null) => {
        if (detail?.articles?.length) return detail;
        try {
          const fallback = await fetch(buildNewsFallbackUrl(q), { cache: "no-store" });
          if (!fallback.ok) return detail;
          const feed = (await fallback.json()) as NewsFallbackResponse;
          const fallbackDetail = toFallbackDetailResponse(q, feed);
          return fallbackDetail.articles.length > 0 ? fallbackDetail : detail;
        } catch {
          return detail;
        }
      })
      .then(setDrawerData)
      .catch(() => setDrawerData(null))
      .finally(() => setDrawerLoading(false));
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleCellClick = useCallback(
    (reg: string, st: string, _cell?: MatrixCell) => {
      console.log("cell clicked", reg, st);
      openDrawer({
        regulation: reg,
        stakeholder: st,
        label: `${reg} × ${st}`,
      });
    },
    [openDrawer]
  );

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

  const totalSignals = matrixData?.cells.reduce((s, c) => s + c.count, 0) ?? null;
  const spikeCount = hotspotData?.spike_countries ?? null;
  const trackedCountries = hotspotData?.total_countries ?? null;
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const todayDate = new Date();
  const fromDate = new Date(todayDate);
  fromDate.setDate(todayDate.getDate() - 30);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const dateRangeLabel = `데이터 기준: 최근 30일 누적 (${fmt(fromDate)} ~ ${fmt(todayDate)})`;

  return (
    <>
      {/* 애니메이션 키프레임 */}
      <style>{`
        @keyframes hs-core { 0%,100%{r:4} 50%{r:6} }
        @keyframes hs-mid  { 0%,100%{opacity:.5} 50%{opacity:.1} }
        @keyframes hs-out  { 0%,100%{opacity:.25} 50%{opacity:0} }
        @keyframes live-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "100vh",
          background: T.bg0,
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
          color: T.txt,
          overflow: "hidden",
        }}
      >
        {/* ── 사이드바 ──────────────────────────────────────────────────── */}
        <div
          style={{
            width: 196,
            minWidth: 196,
            background: T.bg1,
            borderRight: `1px solid ${T.border}`,
            display: "flex",
            flexDirection: "column",
            padding: "20px 0",
          }}
        >
          {/* 로고 */}
          <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div
              style={{
                display: "inline-block",
                fontSize: 9,
                fontWeight: 500,
                color: T.lime,
                background: T.limeDim,
                border: `1px solid ${T.limeBorder}`,
                borderRadius: 4,
                padding: "2px 6px",
                marginBottom: 6,
                letterSpacing: "0.06em",
              }}
            >
              PREMIUM B2B SOLUTION
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: T.txt, letterSpacing: "0.02em" }}>
              IMPACT<span style={{ color: T.lime }}>ON</span>
            </div>
            <div style={{ fontSize: 10, color: T.txt3, marginTop: 3, lineHeight: 1.4 }}>
              ESG Intelligence<br />글로벌 규제 · 이해관계자 시그널
            </div>
          </div>

          {/* 네비 */}
          <div style={{ padding: "10px 8px", flex: 1 }}>
            {[
              { label: "메뉴", type: "label" },
              { icon: "⊞", label: "종합 대시보드", active: true },
              { icon: "◎", label: "맞춤 규제 진단" },
              { icon: "📰", label: "인텔리전스 뉴스룸", href: "/newsroom" },
              { label: "설정", type: "label" },
              { icon: "🔔", label: "알림 설정" },
              { icon: "⚙", label: "환경설정" },
            ].map((item, i) => {
              if (item.type === "label") {
                return (
                  <div key={i} style={{ fontSize: 9, color: T.txt3, padding: "10px 8px 4px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    {item.label}
                  </div>
                );
              }
              const navContent = (
                <>
                  <span style={{ fontSize: 15, color: item.active ? T.lime : T.txt2 }}>{item.icon}</span>
                  {item.label}
                </>
              );
              if ((item as { href?: string }).href) {
                return (
                  <a
                    key={i}
                    href={(item as { href?: string }).href}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "7px 9px", borderRadius: 8, cursor: "pointer",
                      fontSize: 12, color: T.lime, marginBottom: 1,
                      background: T.limeDim, textDecoration: "none",
                    }}
                  >
                    {navContent}
                  </a>
                );
              }
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "7px 9px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    color: item.active ? T.lime : T.txt2,
                    marginBottom: 1,
                    background: item.active ? T.bg3 : "transparent",
                  }}
                >
                  {navContent}
                </div>
              );
            })}
          </div>

          {/* 사용자 */}
          <div style={{ padding: "10px 8px 0", borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px" }}>
              <div
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: T.limeDim, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, fontWeight: 500,
                  color: T.lime, border: `1px solid ${T.limeBorder}`,
                  flexShrink: 0,
                }}
              >
                IM
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: T.txt }}>ImpactON</div>
                <div style={{ fontSize: 9, color: T.txt3 }}>ESG·공시 팀</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 메인 콘텐츠 ────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          {/* 탑바 */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: T.txt, margin: 0 }}>
                오늘의 이해관계자 시그널 현황
              </h2>
              <p style={{ fontSize: 11, color: T.txt3, marginTop: 3, lineHeight: 1.5, maxWidth: 380 }}>
                "로펌은 법조문을 독해하지만, 임팩트온은 우리 기업을 둘러싼 시장의 역동적 맥박을 봅니다."
              </p>
              <div style={{ fontSize: 10, color: T.lime, marginTop: 5, opacity: 0.8, fontFamily: "monospace" }}>
                [{dateRangeLabel}]
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "live-pulse 2s ease-in-out infinite" }} />
              <div
                style={{
                  fontSize: 11, color: T.txt3, background: T.bg2,
                  padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.border}`, whiteSpace: "nowrap",
                }}
              >
                {today}
              </div>
            </div>
          </div>

          {/* KPI 카드 3종 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {/* DB 누적 신호 */}
            <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: T.redBg, color: "#ff7e7e" }}>⚡</div>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 500, background: T.redBg, color: "#ff7e7e" }}>
                  {matrixLoading ? "..." : `${totalSignals ?? 0}건 집계`}
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: T.txt }}>
                {matrixLoading ? "—" : (totalSignals ?? 0)}
              </div>
              <div style={{ fontSize: 11, color: T.txt3, marginTop: 2 }}>DB 누적 신호 (규제×이해관계자)</div>
            </div>

            {/* 급등 국가 */}
            <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: T.amberBg, color: "#f5c84a" }}>📈</div>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 500, background: T.amberBg, color: "#f5c84a" }}>
                  Spike ≥100%
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: T.txt }}>{hotspotLoading ? "—" : (spikeCount ?? 0)}</div>
              <div style={{ fontSize: 11, color: T.txt3, marginTop: 2 }}>급등 국가 (7일 vs 28일)</div>
            </div>

            {/* 감지 국가 */}
            <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: T.limeDim, color: T.lime }}>🌐</div>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 500, background: T.limeDim, color: T.lime }}>
                  {selectedReg ?? "전체 규제"}
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: T.txt }}>{hotspotLoading ? "—" : (trackedCountries ?? 0)}</div>
              <div style={{ fontSize: 11, color: T.txt3, marginTop: 2 }}>감지 국가</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: T.txt3, marginTop: -2, textAlign: "right" }}>
            *기준: 최근 30일 외신/전문지 데이터
          </div>

          {/* 규제 필터 탭 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedReg(null)}
              style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 500,
                cursor: "pointer", border: "none",
                background: selectedReg === null ? T.lime : T.bg2,
                color: selectedReg === null ? T.bg0 : T.txt2,
              }}
            >전체</button>
            {(matrixData?.regulation_tags ?? []).map((reg) => {
              const chip = regChip(reg);
              return (
                <button
                  key={reg}
                  onClick={() => setSelectedReg(selectedReg === reg ? null : reg)}
                  style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 500,
                    cursor: "pointer", border: "none",
                    background: selectedReg === reg ? chip.color : T.bg2,
                    color: selectedReg === reg ? T.bg0 : T.txt2,
                  }}
                >{reg}</button>
              );
            })}
          </div>

          {/* 트윈 패널 (매트릭스 좌 + 지도+바차트 우) */}
          <div style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 12, flex: 1, minHeight: 0 }}>

            {/* 매트릭스 패널 */}
            <div
              style={{
                background: T.bg1,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: T.txt }}>이해관계자 × 규제 시그널 매트릭스</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { bg: "#ff7e7e", label: "즉각 대응" },
                    { bg: "#f5c84a", label: "모니터링" },
                    { bg: T.green, label: "기회" },
                    { bg: T.blueTxt, label: "주목" },
                  ].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: T.txt3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 1, background: l.bg }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
              {matrixLoading
                ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: T.txt3, fontSize: 12 }}>⏳ 로딩 중...</div>
                : <SignalMatrix data={matrixData} onCellClick={handleCellClick} />
              }
            </div>

            {/* 지도 + 바차트 패널 */}
            <div
              style={{
                background: T.bg1,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: T.txt }}>글로벌 공급망 핫스팟 레이더</span>
                <span style={{ fontSize: 9, color: T.txt3 }}>국가 점 클릭 → 상세 분석</span>
              </div>

              {hotspotLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: T.txt3, fontSize: 12 }}>⏳ 로딩 중...</div>
              ) : hotspotData && hotspotData.hotspots.length > 0 ? (
                <>
                  <HotspotMap hotspots={hotspotData.hotspots} onClick={handleCountryClick} />
                  <BarChart hotspots={hotspotData.hotspots} onClick={handleCountryClick} />
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: T.txt3, fontSize: 11, textAlign: "center" }}>
                  <div>
                    <p>핫스팟 데이터 없음</p>
                    <p style={{ marginTop: 4, fontSize: 10 }}>LLM 파이프라인 실행 후 집계됩니다</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 슬라이딩 Drawer ────────────────────────────────────────────── */}
        <DetailDrawer
          open={drawerOpen}
          query={drawerQuery}
          data={drawerData}
          loading={drawerLoading}
          onClose={closeDrawer}
        />
      </div>
    </>
  );
}

"use client";

/**
 * IntelligencePanel — 임팩트온 ESG 인텔리전스 마스터 대시보드 (P3)
 * KPI 3종 교체 / 이해관계자 6대 체계 / 우측 고정 상세 패널
 */

import { useCallback, useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_ESG_TRACKER_API_BASE_URL ||
  "https://esg-tracker.onrender.com";

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
  purple: "#a78bfa",
  purpleBg: "rgba(139,92,246,0.15)",
  orange: "#fb923c",
  orangeBg: "rgba(251,146,60,0.15)",
  grayBg: "rgba(255,255,255,0.04)",
};

// ── 이해관계자 6대 체계 뱃지 ─────────────────────────────────────────────
const ST_BADGE: Record<string, { bg: string; color: string; icon: string }> = {
  "규제기관/정부": { bg: T.greenBg,  color: T.green,  icon: "⚖️" },
  "기업":          { bg: T.blueBg,   color: T.blueTxt, icon: "🏭" },
  "산업단체":      { bg: T.orangeBg, color: T.orange,  icon: "🤝" },
  "기관투자자":    { bg: T.amberBg,  color: T.amber,   icon: "📈" },
  "시민단체":      { bg: T.redBg,    color: T.red,     icon: "🌱" },
  "전문가·로펌":   { bg: T.purpleBg, color: T.purple,  icon: "📋" },
};

// ── 규제 칩 색상 ──────────────────────────────────────────────────────────
const REG_CHIP_COLORS: Record<string, { bg: string; color: string }> = {
  CSRD:          { bg: "rgba(244,63,94,0.15)",   color: "#fb7185" },
  CSDDD:         { bg: "rgba(249,115,22,0.15)",  color: "#fb923c" },
  CBAM:          { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa" },
  PPWR:          { bg: "rgba(6,182,212,0.15)",   color: "#22d3ee" },
  "Battery Reg": { bg: "rgba(14,165,233,0.15)",  color: "#38bdf8" },
  EUDR:          { bg: "rgba(234,179,8,0.15)",   color: "#facc15" },
  ESPR:          { bg: "rgba(20,184,166,0.15)",  color: "#2dd4bf" },
  GCD:           { bg: "rgba(132,204,22,0.15)",  color: "#a3e635" },
  "AI Act":      { bg: "rgba(99,102,241,0.15)",  color: "#818cf8" },
  DPP:           { bg: "rgba(217,70,239,0.15)",  color: "#e879f9" },
  ELV:           { bg: "rgba(236,72,153,0.15)",  color: "#f472b6" },
  SFDR:          { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  CA_Climate:    { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  IMO_Reg:       { bg: "rgba(20,184,166,0.15)",  color: "#2dd4bf" },
};
function regChip(tag: string) {
  return REG_CHIP_COLORS[tag] ?? { bg: T.grayBg, color: T.txt2 };
}

// ── API 타입 ───────────────────────────────────────────────────────────────
interface KpiData {
  generated_at: string;
  top_signal: {
    title: string;
    source: string;
    regulation: string;
    stakeholder: string;
    date: string;
    confidence: number;
  } | null;
  surging_regulation: {
    regulation: string | null;
    surge_pct: number | null;
    is_new: boolean;
    recent_count: number;
    prev_count: number;
    top_countries: string[];
  };
  leading_stakeholder: {
    stakeholder: string | null;
    pct: number;
    count: number;
    top_regulations: string[];
  };
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
interface PanelQuery {
  regulation?: string;
  stakeholder?: string;
  label: string;
}

// ── 유틸 ──────────────────────────────────────────────────────────────────
function fmtDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

// ── KPI 카드: 오늘의 대표 시그널 ─────────────────────────────────────────
function TopSignalCard({ kpi, loading }: { kpi: KpiData | null; loading: boolean }) {
  const signal = kpi?.top_signal;
  const chip = signal ? regChip(signal.regulation) : null;
  const sb = signal?.stakeholder ? (ST_BADGE[signal.stakeholder] ?? null) : null;

  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.limeBorder}`, borderRadius: 12, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.lime, letterSpacing: "0.06em" }}>오늘의 대표 시그널</div>
        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: T.limeDim, color: T.lime }}>최근 7일</span>
      </div>
      {loading ? (
        <div style={{ fontSize: 11, color: T.txt3 }}>로딩 중...</div>
      ) : signal ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.txt, lineHeight: 1.45, flex: 1 }}>
            {signal.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, color: T.txt3 }}>{signal.date}</span>
            <span style={{ fontSize: 9, color: T.txt2 }}>{signal.source}</span>
            {chip && (
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: chip.bg, color: chip.color, fontWeight: 600 }}>
                {signal.regulation}
              </span>
            )}
            {sb && (
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: sb.bg, color: sb.color }}>
                {sb.icon} {signal.stakeholder}
              </span>
            )}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: T.txt3 }}>최근 7일 분류 기사 없음</div>
      )}
    </div>
  );
}

// ── KPI 카드: 급증 규제 ───────────────────────────────────────────────────
function SurgingRegCard({ kpi, loading }: { kpi: KpiData | null; loading: boolean }) {
  const s = kpi?.surging_regulation;
  const chip = s?.regulation ? regChip(s.regulation) : null;

  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.amber, letterSpacing: "0.06em" }}>급증 규제</div>
        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: T.amberBg, color: T.amber }}>전주 대비</span>
      </div>
      {loading ? (
        <div style={{ fontSize: 11, color: T.txt3 }}>로딩 중...</div>
      ) : s?.regulation ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {chip && (
              <span style={{ fontSize: 18, fontWeight: 700, color: chip.color }}>{s.regulation}</span>
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: T.amber }}>
              {s.is_new ? "신규 급등" : s.surge_pct !== null ? `+${s.surge_pct}%` : ""}
            </span>
          </div>
          {s.top_countries.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, color: T.txt3 }}>주요 지역</span>
              {s.top_countries.map((c) => (
                <span key={c} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: T.bg3, color: T.txt2 }}>{c}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10, color: T.txt3 }}>
            이번 주 {s.recent_count}건 · 지난 주 {s.prev_count}건
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: T.txt3 }}>집계 데이터 없음</div>
      )}
    </div>
  );
}

// ── KPI 카드: 주도 이해관계자 ─────────────────────────────────────────────
function LeadingStakeholderCard({ kpi, loading }: { kpi: KpiData | null; loading: boolean }) {
  const s = kpi?.leading_stakeholder;
  const sb = s?.stakeholder ? (ST_BADGE[s.stakeholder] ?? null) : null;

  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.purple, letterSpacing: "0.06em" }}>주도 이해관계자</div>
        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: T.purpleBg, color: T.purple }}>최근 7일</span>
      </div>
      {loading ? (
        <div style={{ fontSize: 11, color: T.txt3 }}>로딩 중...</div>
      ) : s?.stakeholder ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sb && (
              <span style={{ fontSize: 18 }}>{sb.icon}</span>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: sb?.color ?? T.txt }}>{s.stakeholder}</div>
              <div style={{ fontSize: 10, color: T.txt3 }}>전체 보도의 {s.pct}%</div>
            </div>
          </div>
          {s.top_regulations.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, color: T.txt3 }}>주요 규제</span>
              {s.top_regulations.map((r) => {
                const c = regChip(r);
                return (
                  <span key={r} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: c.bg, color: c.color, fontWeight: 600 }}>{r}</span>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 11, color: T.txt3 }}>집계 데이터 없음</div>
      )}
    </div>
  );
}

// ── 신호 매트릭스 ─────────────────────────────────────────────────────────
function SignalMatrix({
  data,
  selectedCell,
  onCellClick,
}: {
  data: MatrixResponse | null;
  selectedCell: { reg: string; st: string } | null;
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

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ fontSize: 10, fontWeight: 500, color: T.txt3, padding: "5px 5px 7px", textAlign: "left", borderBottom: `1px solid ${T.border}`, width: 80 }}>
              규제
            </th>
            {data.stakeholder_tags.map((st) => {
              const sb = ST_BADGE[st] ?? { bg: T.grayBg, color: T.txt2, icon: "•" };
              return (
                <th key={st} style={{ padding: "5px 4px 7px", textAlign: "center", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 12 }}>{sb.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: sb.color, background: sb.bg, padding: "1px 5px", borderRadius: 4, whiteSpace: "nowrap" }}>
                      {st.split("·")[0]}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.regulation_tags.map((reg) => {
            const chip = regChip(reg);
            const rowTotal = data.cells.filter((c) => c.regulation_tag === reg).reduce((s, c) => s + c.count, 0);
            return (
              <tr key={reg}>
                <td style={{ padding: "3px 4px", verticalAlign: "middle" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: rowTotal === 0 ? T.txt3 : chip.color, lineHeight: 1.2 }}>{reg}</div>
                </td>
                {data.stakeholder_tags.map((st) => {
                  const cell = data.cells.find((c) => c.regulation_tag === reg && c.stakeholder_tag === st);
                  const count = cell?.count ?? 0;
                  const isSpike = cell?.is_spike ?? false;
                  const intensity = count / maxCount;
                  const isSelected = selectedCell?.reg === reg && selectedCell?.st === st;

                  let bg = T.grayBg;
                  let labelColor = T.txt3;
                  let labelWeight: number = 400;
                  if (isSelected) {
                    bg = T.limeDim;
                    labelColor = T.lime;
                    labelWeight = 700;
                  } else if (count > 0 && isSpike) {
                    bg = T.redBg; labelColor = "#ff7e7e"; labelWeight = 700;
                  } else if (count > 0 && intensity > 0.6) {
                    bg = T.greenBg; labelColor = T.green; labelWeight = 700;
                  } else if (count > 0) {
                    bg = chip.bg; labelColor = chip.color; labelWeight = 500;
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
                          border: isSelected ? `1px solid ${T.lime}` : "1px solid transparent",
                          transition: "transform 0.12s, box-shadow 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          if (count > 0 && !isSelected) {
                            (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${T.lime}`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                          if (!isSelected) (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      >
                        <span style={{ fontSize: 9, fontWeight: labelWeight, color: labelColor, lineHeight: 1.2 }}>
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

// ── 우측 고정 상세 패널 ───────────────────────────────────────────────────
function FixedDetailPanel({
  query,
  data,
  loading,
}: {
  query: PanelQuery | null;
  data: DetailResponse | null;
  loading: boolean;
}) {
  if (!query) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: T.txt3, textAlign: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 28, opacity: 0.4 }}>🔍</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: T.txt2 }}>셀을 클릭하면<br />인텔리전스 분석이 여기 표시됩니다</div>
        <div style={{ fontSize: 10, color: T.txt3, lineHeight: 1.6 }}>
          규제 × 이해관계자 조합을<br />선택해 주세요
        </div>
      </div>
    );
  }

  const regChipStyle = query.regulation ? regChip(query.regulation) : null;
  const sb = query.stakeholder ? (ST_BADGE[query.stakeholder] ?? null) : null;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px 16px" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: T.lime, letterSpacing: "0.06em", marginBottom: 6 }}>
          ⚡ 인텔리전스 보고서
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: T.txt, lineHeight: 1.35, marginBottom: 4 }}>
          {query.label}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {regChipStyle && query.regulation && (
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: regChipStyle.bg, color: regChipStyle.color, fontWeight: 600 }}>
              {query.regulation}
            </span>
          )}
          {sb && query.stakeholder && (
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: sb.bg, color: sb.color }}>
              {sb.icon} {query.stakeholder}
            </span>
          )}
          {data && (
            <span style={{ fontSize: 9, color: T.txt3 }}>{data.total}건 매칭</span>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100, color: T.txt3, fontSize: 12 }}>
          <span style={{ marginRight: 8 }}>⏳</span>분석 중...
        </div>
      )}

      {!loading && (!data || data.articles.length === 0) && (
        <div style={{ textAlign: "center", padding: "30px 0", color: T.txt3, fontSize: 11 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📭</div>
          <p>현재 매칭된 기사가 없습니다.</p>
          <p style={{ marginTop: 4, fontSize: 10 }}>뉴스룸에서 더 넓은 범위로 확인해보세요.</p>
        </div>
      )}

      {!loading && data && data.articles.map((article, idx) => {
        const artSb = article.stakeholder_tag ? (ST_BADGE[article.stakeholder_tag] ?? null) : null;
        return (
          <div key={article.id} style={{ marginBottom: 20 }}>
            {idx === 0 && article.ai_summary && (
              <div style={{ background: "rgba(212,255,109,0.06)", border: `1px solid ${T.limeBorder}`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: T.lime, marginBottom: 6 }}>✨ AI 시장 동향 요약</div>
                <div style={{ fontSize: 12, color: "rgba(220,245,255,0.8)", lineHeight: 1.8 }}>
                  {article.ai_summary.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i}>{line.startsWith("•") ? line : `• ${line}`}</p>
                  ))}
                </div>
              </div>
            )}
            <div style={{ borderLeft: `1px solid ${idx === 0 ? T.lime : T.border2}`, paddingLeft: 10, paddingBottom: 8, position: "relative" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: idx === 0 ? T.lime : T.border2, position: "absolute", left: -3, top: 4 }} />
              <div style={{ fontSize: 10, color: T.txt3, marginBottom: 2 }}>{fmtDate(article.created_at)}</div>
              <div style={{ fontSize: 12, color: T.txt, lineHeight: 1.5, marginBottom: 3 }}>{article.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: T.txt3 }}>{article.source_name}</span>
                {artSb && (
                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: artSb.bg, color: artSb.color }}>
                    {artSb.icon} {article.stakeholder_tag}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export function IntelligencePanel() {
  const [selectedReg, setSelectedReg] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [matrixData, setMatrixData] = useState<MatrixResponse | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(true);
  const [panelQuery, setPanelQuery] = useState<PanelQuery | null>(null);
  const [panelData, setPanelData] = useState<DetailResponse | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ reg: string; st: string } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/intelligence/kpi`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setKpiData)
      .catch(() => setKpiData(null))
      .finally(() => setKpiLoading(false));
  }, []);

  useEffect(() => {
    setMatrixLoading(true);
    fetch(`${API_BASE}/api/v1/intelligence/matrix`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setMatrixData)
      .catch(() => setMatrixData(null))
      .finally(() => setMatrixLoading(false));
  }, []);

  const openPanel = useCallback((q: PanelQuery) => {
    setPanelQuery(q);
    setPanelData(null);
    setPanelLoading(true);
    const params = new URLSearchParams({ limit: "10" });
    if (q.regulation) params.set("regulation", q.regulation);
    if (q.stakeholder) params.set("stakeholder", q.stakeholder);
    fetch(`${API_BASE}/api/v1/intelligence/detail?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setPanelData)
      .catch(() => setPanelData(null))
      .finally(() => setPanelLoading(false));
  }, []);

  const handleCellClick = useCallback(
    (reg: string, st: string, _cell?: MatrixCell) => {
      setSelectedCell({ reg, st });
      openPanel({ regulation: reg, stakeholder: st, label: `${reg} × ${st}` });
    },
    [openPanel]
  );

  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const todayDate = new Date();
  const fromDate = new Date(todayDate);
  fromDate.setDate(todayDate.getDate() - 30);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <>
      <style>{`
        @keyframes live-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: T.bg0, fontFamily: "var(--font-sans, system-ui, sans-serif)", color: T.txt, overflow: "hidden" }}>
        {/* ── 사이드바 ──────────────────────────────────────────────────── */}
        <div style={{ width: 196, minWidth: 196, background: T.bg1, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", padding: "20px 0" }}>
          <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "inline-block", fontSize: 9, fontWeight: 500, color: T.lime, background: T.limeDim, border: `1px solid ${T.limeBorder}`, borderRadius: 4, padding: "2px 6px", marginBottom: 6, letterSpacing: "0.06em" }}>
              PREMIUM B2B SOLUTION
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: T.txt, letterSpacing: "0.02em" }}>
              IMPACT<span style={{ color: T.lime }}>ON</span>
            </div>
            <div style={{ fontSize: 10, color: T.txt3, marginTop: 3, lineHeight: 1.4 }}>
              ESG Intelligence<br />글로벌 규제 · 이해관계자 시그널
            </div>
          </div>

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
                  <a key={i} href={(item as { href?: string }).href} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 8, cursor: "pointer", fontSize: 12, color: T.lime, marginBottom: 1, background: T.limeDim, textDecoration: "none" }}>
                    {navContent}
                  </a>
                );
              }
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 8, cursor: "pointer", fontSize: 12, color: item.active ? T.lime : T.txt2, marginBottom: 1, background: item.active ? T.bg3 : "transparent" }}>
                  {navContent}
                </div>
              );
            })}
          </div>

          <div style={{ padding: "10px 8px 0", borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.limeDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500, color: T.lime, border: `1px solid ${T.limeBorder}`, flexShrink: 0 }}>
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
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
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
                [데이터 기준: 최근 30일 누적 ({fmt(fromDate)} ~ {fmt(todayDate)})]
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "live-pulse 2s ease-in-out infinite" }} />
              <div style={{ fontSize: 11, color: T.txt3, background: T.bg2, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                {today}
              </div>
            </div>
          </div>

          {/* KPI 카드 3종 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <TopSignalCard kpi={kpiData} loading={kpiLoading} />
            <SurgingRegCard kpi={kpiData} loading={kpiLoading} />
            <LeadingStakeholderCard kpi={kpiData} loading={kpiLoading} />
          </div>

          {/* 규제 필터 탭 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedReg(null)}
              style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: "pointer", border: "none", background: selectedReg === null ? T.lime : T.bg2, color: selectedReg === null ? T.bg0 : T.txt2 }}
            >전체</button>
            {(matrixData?.regulation_tags ?? []).map((reg) => {
              const chip = regChip(reg);
              return (
                <button
                  key={reg}
                  onClick={() => setSelectedReg(selectedReg === reg ? null : reg)}
                  style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: "pointer", border: "none", background: selectedReg === reg ? chip.color : T.bg2, color: selectedReg === reg ? T.bg0 : T.txt2 }}
                >{reg}</button>
              );
            })}
          </div>

          {/* 매트릭스 + 우측 고정 상세 패널 */}
          <div style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 12, flex: 1, minHeight: 0 }}>
            {/* 매트릭스 */}
            <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: T.txt }}>이해관계자 × 규제 시그널 매트릭스</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { bg: "#ff7e7e", label: "즉각 대응" },
                    { bg: T.green, label: "활발" },
                    { bg: T.lime, label: "선택됨" },
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
                : <SignalMatrix data={matrixData} selectedCell={selectedCell} onCellClick={handleCellClick} />
              }
            </div>

            {/* 고정 상세 패널 */}
            <div style={{ background: T.bg1, border: `1px solid ${panelQuery ? T.limeBorder : T.border}`, borderRadius: 12, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", transition: "border-color 0.2s" }}>
              {panelQuery && (
                <div style={{ padding: "10px 16px 0", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: T.txt3, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
                    분석 상세
                  </div>
                </div>
              )}
              <FixedDetailPanel query={panelQuery} data={panelData} loading={panelLoading} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";

export const dynamic = "force-dynamic";

const API_BASE =
  process.env.NEXT_PUBLIC_ESG_TRACKER_API_BASE_URL ||
  "https://esg-tracker.onrender.com";

const T = {
  bg0: "#0a0f16", bg1: "#111822", bg2: "#18202c", bg3: "#1f2a38",
  lime: "#D4FF6D", limeDim: "rgba(212,255,109,0.12)",
  limeBorder: "rgba(212,255,109,0.25)",
  border: "#1e2d3d", border2: "#2a3d52",
  txt: "#dce8f5", txt2: "#7a90a8", txt3: "#435a72",
  red: "#ff5f5f", redBg: "rgba(255,95,95,0.12)",
  amber: "#f0b429", amberBg: "rgba(240,180,41,0.12)",
  green: "#3dd68c", greenBg: "rgba(61,214,140,0.1)",
  blue: "#4d9de0", blueBg: "rgba(77,157,224,0.1)",
  blueTxt: "#6db3e8",
};

const REG_COLORS: Record<string, { bg: string; color: string }> = {
  CSRD:                 { bg: "rgba(244,63,94,0.15)",   color: "#fb7185" },
  CSDDD:                { bg: "rgba(249,115,22,0.15)",  color: "#fb923c" },
  CBAM:                 { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa" },
  PPWR:                 { bg: "rgba(6,182,212,0.15)",   color: "#22d3ee" },
  "Battery Reg":        { bg: "rgba(14,165,233,0.15)",  color: "#38bdf8" },
  EUDR:                 { bg: "rgba(234,179,8,0.15)",   color: "#facc15" },
  ESPR:                 { bg: "rgba(20,184,166,0.15)",  color: "#2dd4bf" },
  GCD:                  { bg: "rgba(132,204,22,0.15)",  color: "#a3e635" },
  "AI Act":             { bg: "rgba(99,102,241,0.15)",  color: "#818cf8" },
  DPP:                  { bg: "rgba(217,70,239,0.15)",  color: "#e879f9" },
  ELV:        { bg: "rgba(236,72,153,0.15)",  color: "#f472b6" },
  SFDR:       { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  CA_Climate: { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  IMO_Reg:    { bg: "rgba(20,184,166,0.15)",  color: "#2dd4bf" },
};

const ST_BADGE: Record<string, { bg: string; color: string }> = {
  "경쟁사":    { bg: "rgba(77,157,224,0.18)",  color: "#6db3e8" },
  "평가기관":  { bg: "rgba(139,92,246,0.18)",  color: "#a78bfa" },
  "정부당국":  { bg: "rgba(61,214,140,0.15)",  color: "#3dd68c" },
  "기관투자자":{ bg: "rgba(240,180,41,0.18)",  color: "#f0b429" },
  "시민단체":  { bg: "rgba(255,95,95,0.15)",   color: "#ff7e7e" },
};

interface NRArticle {
  id: number;
  date: string;
  title: string;
  source: string;
  original_url: string | null;
  country_iso: string;
  country_name: string;
  regulation: string;
  stakeholder: string;
  ai_summary: string;
  article_type: string;
  tagging_confidence: number;
}

type SortKey = "date" | "regulation" | "country_iso" | "stakeholder" | "source";

function FilterChip({
  label, active, color, bg, onClick,
}: { label: string; active: boolean; color: string; bg: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 10px", borderRadius: 20,
        border: `1px solid ${active ? color : "transparent"}`,
        background: active ? bg : "rgba(255,255,255,0.04)",
        color: active ? color : T.txt2,
        fontSize: 11, fontWeight: active ? 700 : 400,
        cursor: "pointer", whiteSpace: "nowrap",
        transition: "all 0.12s",
      }}
    >
      {label}
    </button>
  );
}

export default function NewsroomPage() {
  const [articles, setArticles] = useState<NRArticle[]>([]);
  const [regTags, setRegTags] = useState<string[]>([]);
  const [stTags, setStTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL params로 초기 필터 세팅 (대시보드 → 뉴스룸 연동)
  const initRef = useRef(false);
  const [filterReg, setFilterReg] = useState<string | null>(null);
  const [filterSt, setFilterSt] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [highConfOnly, setHighConfOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 오늘 날짜 업데이트 표시
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  })();

  const ARTICLE_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    NEWS:   { label: "뉴스",       color: T.blueTxt,  bg: T.blueBg },
    REPORT: { label: "로펌 리포트", color: "#a78bfa",  bg: "rgba(139,92,246,0.15)" },
    MARKET: { label: "원자재 동향", color: T.amber,    bg: T.amberBg },
    EXPERT: { label: "전문가 분석", color: T.green,    bg: T.greenBg },
  };

  useEffect(() => {
    // URL 파라미터로 초기 필터 세팅 (대시보드 매트릭스 셀 클릭 연동)
    if (!initRef.current && typeof window !== "undefined") {
      initRef.current = true;
      const sp = new URLSearchParams(window.location.search);
      const reg = sp.get("regulation");
      const st = sp.get("stakeholder");
      if (reg) setFilterReg(reg);
      if (st) setFilterSt(st);
    }
    fetch(`${API_BASE}/api/v1/intelligence/newsroom?days=30&limit=500`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setArticles(d.articles ?? []);
        setRegTags(d.regulation_tags ?? []);
        setStTags(d.stakeholder_tags ?? []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = useCallback(
    (col: SortKey) => {
      setSortDir((prev) => (col === sortCol ? (prev === "asc" ? "desc" : "asc") : "desc"));
      setSortCol(col);
    },
    [sortCol],
  );

  const filtered = useMemo(() => {
    let rows = articles;
    if (filterReg) rows = rows.filter((r) => r.regulation === filterReg);
    if (filterSt) rows = rows.filter((r) => r.stakeholder === filterSt);
    if (filterType) rows = rows.filter((r) => r.article_type === filterType);
    if (highConfOnly) rows = rows.filter((r) => (r.tagging_confidence ?? 0) >= 0.8);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) => r.title.toLowerCase().includes(q) || r.source.toLowerCase().includes(q),
      );
    }
    return [...rows].sort((a, b) => {
      const va = String(a[sortCol] ?? "");
      const vb = String(b[sortCol] ?? "");
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [articles, filterReg, filterSt, filterType, highConfOnly, search, sortCol, sortDir]);

  function SortTh({ col, label, width }: { col: SortKey; label: string; width?: number }) {
    const active = sortCol === col;
    return (
      <th
        onClick={() => handleSort(col)}
        style={{
          padding: "9px 10px",
          textAlign: "left",
          fontSize: 11,
          fontWeight: 600,
          color: active ? T.lime : T.txt2,
          borderBottom: `1px solid ${T.border}`,
          cursor: "pointer",
          whiteSpace: "nowrap",
          userSelect: "none",
          background: T.bg2,
          position: "sticky",
          top: 0,
          zIndex: 2,
          width: width ?? undefined,
          transition: "color 0.12s",
        }}
      >
        {label}{" "}
        {active ? (
          <span style={{ color: T.lime }}>{sortDir === "asc" ? "↑" : "↓"}</span>
        ) : (
          <span style={{ color: T.txt3 }}>↕</span>
        )}
      </th>
    );
  }

  const anyFilter = filterReg || filterSt || filterType || highConfOnly || search;

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, color: T.txt, fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
      {/* ── 헤더 ── */}
      <div
        style={{
          borderBottom: `1px solid ${T.border}`, background: T.bg1,
          padding: "10px 24px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
        }}
      >
        <a
          href="/"
          style={{
            color: T.txt2, textDecoration: "none", fontSize: 12,
            padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
          }}
        >
          ← 대시보드
        </a>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, color: T.lime, fontSize: 15 }}>IMPACT</span>
          <span style={{ fontWeight: 700, color: T.txt, fontSize: 15 }}>ON</span>
          <span
            style={{
              fontSize: 10, fontWeight: 600, color: T.lime,
              background: T.limeDim, border: `1px solid ${T.limeBorder}`,
              borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em",
            }}
          >
            NEWSROOM
          </span>
          <span style={{ color: T.txt3, fontSize: 12, marginLeft: 4 }}>
            인텔리전스 뉴스룸 — 최근 30일 다국어 외신 전량
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={{ fontSize: 11, color: T.txt3 }}>
            {loading ? "로딩 중..." : `전체 ${articles.length}건`}
          </span>
          <span style={{ fontSize: 10, color: T.txt3, fontFamily: "monospace" }}>
            [업데이트: {todayStr}]
          </span>
        </div>
      </div>

      {/* ── 필터 바 ── */}
      <div
        style={{
          padding: "10px 24px", background: T.bg1,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          flexShrink: 0,
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제목·출처 검색..."
          style={{
            background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6,
            color: T.txt, fontSize: 12, padding: "4px 10px", outline: "none", width: 150,
          }}
        />
        <span style={{ color: T.txt3, fontSize: 10, marginLeft: 4 }}>규제</span>
        {regTags.map((r) => {
          const c = REG_COLORS[r] ?? { bg: T.bg3, color: T.txt2 };
          return (
            <FilterChip key={r} label={r} active={filterReg === r}
              color={c.color} bg={c.bg}
              onClick={() => setFilterReg(filterReg === r ? null : r)} />
          );
        })}
        <span style={{ color: T.txt3, fontSize: 10, marginLeft: 4 }}>소스유형</span>
        {Object.entries(ARTICLE_TYPE_LABELS).map(([key, v]) => (
          <FilterChip key={key} label={v.label} active={filterType === key}
            color={v.color} bg={v.bg}
            onClick={() => setFilterType(filterType === key ? null : key)} />
        ))}
        <span style={{ color: T.txt3, fontSize: 10, marginLeft: 4 }}>이해관계자</span>
        {stTags.map((s) => {
          const c = ST_BADGE[s] ?? { bg: T.bg3, color: T.txt2 };
          return (
            <FilterChip key={s} label={s} active={filterSt === s}
              color={c.color} bg={c.bg}
              onClick={() => setFilterSt(filterSt === s ? null : s)} />
          );
        })}
        <FilterChip
          label={`고신뢰 ≥0.8${highConfOnly ? " ✓" : ""}`}
          active={highConfOnly}
          color={T.lime}
          bg={T.limeDim}
          onClick={() => setHighConfOnly((v) => !v)}
        />
        {anyFilter && (
          <button
            onClick={() => { setFilterReg(null); setFilterSt(null); setFilterType(null); setHighConfOnly(false); setSearch(""); }}
            style={{
              padding: "3px 10px", borderRadius: 20,
              border: `1px solid ${T.border}`, background: "transparent",
              color: T.txt2, fontSize: 11, cursor: "pointer",
            }}
          >
            초기화
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: T.txt3 }}>
          {filtered.length}건 표시
        </span>
      </div>

      {/* ── 테이블 ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 24px 24px" }}>
        {loading ? (
          <div style={{ padding: 64, textAlign: "center", color: T.txt3, fontSize: 13 }}>
            데이터 로딩 중...
          </div>
        ) : error ? (
          <div style={{ padding: 64, textAlign: "center", color: T.red, fontSize: 13 }}>
            {error}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <colgroup>
              <col style={{ width: 90 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 100 }} />
              <col />
              <col style={{ width: 130 }} />
            </colgroup>
            <thead>
              <tr>
                <SortTh col="date" label="일자" />
                <SortTh col="regulation" label="규제" />
                <SortTh col="country_iso" label="지역" />
                <SortTh col="stakeholder" label="유형" />
                <th style={{
                  padding: "9px 10px", textAlign: "left", fontSize: 11, fontWeight: 600,
                  color: T.txt2, borderBottom: `1px solid ${T.border}`,
                  background: T.bg2, position: "sticky", top: 0, zIndex: 2,
                }}>
                  제목
                </th>
                <SortTh col="source" label="출처" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const rc = REG_COLORS[row.regulation] ?? { bg: "rgba(255,255,255,0.04)", color: T.txt2 };
                const sc = ST_BADGE[row.stakeholder] ?? { bg: "rgba(255,255,255,0.04)", color: T.txt2 };
                const isExpanded = expandedId === row.id;
                return (
                  <>
                    <tr
                      key={row.id}
                      onClick={() => setExpandedId(isExpanded ? null : row.id)}
                      style={{
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.013)",
                        borderBottom: isExpanded ? "none" : `1px solid rgba(30,45,61,0.6)`,
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(212,255,109,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.013)";
                      }}
                    >
                      <td style={{ padding: "7px 10px", fontSize: 11, color: T.txt3, whiteSpace: "nowrap" }}>
                        {row.date}
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{
                          padding: "2px 7px", borderRadius: 4,
                          fontSize: 10, fontWeight: 700,
                          background: rc.bg, color: rc.color,
                          whiteSpace: "nowrap",
                        }}>
                          {row.regulation}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", fontSize: 11, color: T.txt2, textAlign: "center" }}>
                        {row.country_iso !== "ZZ" ? row.country_iso : "—"}
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{
                          padding: "2px 7px", borderRadius: 4,
                          fontSize: 10, fontWeight: 600,
                          background: sc.bg, color: sc.color,
                          whiteSpace: "nowrap",
                        }}>
                          {row.stakeholder}
                        </span>
                      </td>
                      <td style={{
                        padding: "7px 10px", fontSize: 12, color: T.txt,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        maxWidth: 0,
                      }}>
                        <span
                          role="link"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (row.original_url) {
                              window.open(row.original_url, "_blank", "noopener,noreferrer");
                            } else {
                              alert("원본 URL 미확인 — 다음 크롤 사이클 후 갱신됩니다");
                            }
                          }}
                          style={{
                            cursor: "pointer",
                            color: T.lime,
                            textDecoration: "underline",
                            textDecorationStyle: "dotted",
                          }}
                          title={row.original_url ?? "원본 URL 미확인"}
                        >
                          {row.title}
                        </span>
                      </td>
                      <td style={{
                        padding: "7px 10px", fontSize: 11, color: T.txt2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {row.source}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${row.id}-expand`} style={{ borderBottom: `1px solid rgba(30,45,61,0.6)` }}>
                        <td colSpan={6} style={{ padding: "8px 10px 12px 20px", background: T.bg3 }}>
                          <div style={{ fontSize: 11, color: T.txt2, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {row.ai_summary || row.title}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            {row.original_url ? (
                              <a
                                href={row.original_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 11, color: T.lime, textDecoration: "underline" }}
                              >
                                원본 기사 열기 →
                              </a>
                            ) : (
                              <span style={{ fontSize: 11, color: T.txt3 }}>원본 URL 미확인 (다음 크롤 갱신)</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 56, textAlign: "center", color: T.txt3, fontSize: 12 }}>
                    해당 조건의 기사가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

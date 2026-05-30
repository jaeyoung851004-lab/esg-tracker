import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getRegulations } from "@/lib/api";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "success":   { bg: "bg-green-50",  text: "text-green-700"  },
  "partial":   { bg: "bg-blue-50",   text: "text-blue-700"   },
  "warning":   { bg: "bg-amber-50",  text: "text-amber-700"  },
  "delayed":   { bg: "bg-red-50",    text: "text-red-700"    },
  "uncertain": { bg: "bg-orange-50", text: "text-orange-700" },
};

export default async function RegulationDetailPage({ params }: { params: { id: string } }) {
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
            <a href="/regulations" className="mt-4 inline-block text-emeraldBrand">← 규제 DB로 돌아가기</a>
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLE[reg.statusTone] ?? { bg: "bg-slate-50", text: "text-slate-700" };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[900px] space-y-5 p-5">

          {/* 브레드크럼 */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <a href="/regulations" className="hover:text-emeraldBrand">규제 DB</a>
            <span>›</span>
            <span className="text-slate-600 font-medium">{reg.code}</span>
          </div>

          {/* 헤더 카드 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <span className="rounded px-3 py-1 text-sm font-black text-white bg-navy">{reg.code}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                {reg.status}
              </span>
              {typeof reg.dDay === "number" && reg.dDay >= 0 && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold font-mono ${
                  reg.dDay <= 120 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
                }`}>
                  D-{reg.dDay}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-navy">{reg.name_ko || reg.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{reg.name_en}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
              {reg.category && <span>📁 {reg.category}</span>}
              {reg.country && <span>🌍 {reg.country}</span>}
              {reg.industry && <span>🏭 {reg.industry}</span>}
              {reg.risk && reg.risk !== "—" && <span>⚠️ 최대 리스크: <span className="font-bold text-red-500">{reg.risk}</span></span>}
            </div>
          </div>

          {/* 개요 */}
          {reg.summary && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-navy mb-3">📋 현재 법적 상태</h2>
              <p className="text-sm text-slate-700 leading-relaxed">{reg.summary}</p>
            </div>
          )}

          {/* 핵심 포인트 */}
          {reg.key_points && reg.key_points.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-navy mb-4">🎯 핵심 포인트</h2>
              <div className="space-y-2">
                {reg.key_points.map((point: string, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emeraldBrand/10 text-[10px] font-black text-emeraldBrand">
                      {i + 1}
                    </span>
                    <span className="text-slate-700 leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 적용 일정 */}
          {(reg.deadline || reg.card_date_label) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-navy mb-4">📅 적용 일정</h2>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">{reg.card_date_label || "기업 의무 시작"}</p>
                  <p className="mt-1 text-sm font-bold text-navy">{reg.card_date_value || reg.deadline || "미정"}</p>
                </div>
                {typeof reg.dDay === "number" && reg.dDay >= 0 && (
                  <div className={`rounded-lg px-4 py-3 ${reg.dDay <= 120 ? "bg-red-50" : "bg-slate-50"}`}>
                    <p className="text-xs text-slate-500">남은 기간</p>
                    <p className={`mt-1 text-sm font-bold font-mono ${reg.dDay <= 120 ? "text-red-600" : "text-navy"}`}>
                      D-{reg.dDay}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 공식 출처 */}
          {reg.official_url && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-navy mb-3">🔗 공식 출처</h2>
              <a
                href={reg.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-emeraldBrand/30 bg-emeraldBrand/5 px-4 py-2 text-sm font-medium text-emeraldBrand hover:bg-emeraldBrand/10"
              >
                공식 문서 바로가기 →
              </a>
            </div>
          )}

          {/* 뒤로가기 */}
          <div className="pb-6">
            <a href="/regulations" className="text-sm text-slate-400 hover:text-emeraldBrand">
              ← 규제 DB로 돌아가기
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

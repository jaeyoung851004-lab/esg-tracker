import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getRegulations } from "@/lib/api";

const STATUS_STYLE: Record<string, string> = {
  "success":   "bg-green-50 text-green-700",
  "partial":   "bg-blue-50 text-blue-700",
  "warning":   "bg-amber-50 text-amber-700",
  "delayed":   "bg-red-50 text-red-700",
  "uncertain": "bg-orange-50 text-orange-700",
};

const CODE_COLOR: Record<string, string> = {
  "ESPR":        "bg-emerald-600",
  "PPWR":        "bg-teal-600",
  "CSDDD":       "bg-orange-500",
  "CSRD":        "bg-red-600",
  "CBAM":        "bg-purple-600",
  "EUDR":        "bg-lime-700",
  "GCD":         "bg-pink-600",
  "AI Act":      "bg-indigo-600",
  "Battery Reg": "bg-cyan-700",
  "DPP":         "bg-sky-600",
  "CA SB253/261":"bg-blue-700",
  "ELV":         "bg-slate-600",
  "K-ESG":       "bg-rose-600",
  "SEC":         "bg-gray-700",
  "ISSB":        "bg-violet-600",
};

export default async function RegulationsPage() {
  const regulations = await getRegulations();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[1280px] space-y-6 p-5">

          <div>
            <h1 className="text-xl font-black text-navy">규제 DB</h1>
            <p className="mt-1 text-sm text-slate-500">글로벌 ESG 핵심 규제 {regulations.length}개 — 카드를 클릭하면 상세 정보를 확인할 수 있습니다</p>
          </div>

          {/* 검색/필터 */}
          <div className="flex gap-3">
            <div className="flex flex-1 max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="규제명, 약칭 검색..."
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none">
              <option value="">전체 지역</option>
              <option value="eu">EU</option>
              <option value="us">미국</option>
              <option value="kr">한국</option>
              <option value="global">글로벌</option>
            </select>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none">
              <option value="">전체 상태</option>
              <option value="partial">단계적 시행</option>
              <option value="delayed">축소·지연</option>
              <option value="warning">입법 진행</option>
              <option value="uncertain">유예</option>
            </select>
          </div>

          {/* 규제 카드 그리드 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {regulations.map((reg) => (
              <a
                key={reg.id}
                href={`/regulations/${reg.id}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emeraldBrand hover:shadow-md"
              >
                {/* 상단 */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`rounded px-2 py-1 text-xs font-black text-white ${CODE_COLOR[reg.code] ?? "bg-slate-600"}`}>
                    {reg.code}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[reg.statusTone] ?? "bg-slate-100 text-slate-600"}`}>
                    {reg.status}
                  </span>
                </div>

                {/* 규제명 */}
                <h3 className="text-sm font-bold text-navy leading-snug mb-1 group-hover:text-emeraldBrand">
                  {reg.name_ko || reg.title}
                </h3>
                <p className="text-xs text-slate-400 mb-3">{reg.name_en}</p>

                {/* 카테고리 */}
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs text-slate-400">{reg.category}</span>
                  {typeof reg.dDay === "number" && reg.dDay >= 0 && reg.dDay <= 365 && (
                    <span className={`text-xs font-bold font-mono ${reg.dDay <= 120 ? "text-red-500" : "text-slate-500"}`}>
                      D-{reg.dDay}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

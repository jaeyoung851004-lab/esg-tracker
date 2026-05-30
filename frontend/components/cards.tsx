import type { NewsItem, Regulation } from "@/types/dashboard";

const codeTone: Record<string, string> = {
  CSRD: "bg-red-600 text-white",
  CSDDD: "bg-orange-500 text-white",
  "CDP 기후": "bg-blue-600 text-white",
  "K-ESG": "bg-indigo-600 text-white",
  SEC: "bg-slate-700 text-white",
};

const statusToneMap: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-orange-50 text-orange-700",
  danger: "bg-red-50 text-red-700",
};

export function AlertCTA({ regulations }: { regulations: Regulation[] }) {
  const mostUrgent = regulations.sort((a, b) => a.dDay - b.dDay)[0];
  if (!mostUrgent) return null;
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-navy px-6 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <span className="text-red-300 text-lg">⚠</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{mostUrgent.title}이 D-{mostUrgent.dDay} 남았습니다</p>
        <p className="mt-0.5 text-xs text-white/50">체크리스트 진행 중 · 준비도 {mostUrgent.readiness}%</p>
      </div>
      <button className="shrink-0 rounded-lg bg-emeraldBrand px-4 py-2 text-sm font-bold text-white hover:opacity-90">
        체크리스트 이어하기 →
      </button>
    </div>
  );
}

export function PriorityCard({ regulations }: { regulations: Regulation[] }) {
  const urgent = regulations.slice(0, 3);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-navy">오늘의 우선 대응 과제</h2>
          <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-black text-white">{urgent.length}건</span>
        </div>
        <a className="text-xs font-medium text-slate-500 hover:text-emeraldBrand" href="#">전체 과제 보기 →</a>
      </div>
      <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
        {urgent.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className={`shrink-0 rounded px-2 py-1 text-xs font-black ${codeTone[item.code] ?? "bg-slate-700 text-white"}`}>
              {item.code}
            </span>
            <span className="text-red-500 text-sm shrink-0">⚠</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy truncate">{item.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                <span className="font-bold text-red-500">D-{item.dDay}</span>
                <span className="mx-2">·</span>
                {item.deadline.replaceAll("-", ".")}
              </p>
            </div>
            <button className="shrink-0 rounded-lg border border-emeraldBrand px-3 py-1.5 text-xs font-bold text-emeraldBrand hover:bg-emeraldBrand hover:text-white">
              상세 보기
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function NewsCard({ news }: { news: NewsItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-navy">최신 글로벌 규제 뉴스</h2>
        <a className="text-xs font-medium text-slate-500 hover:text-emeraldBrand" href="#">전체 뉴스 보기 →</a>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {news.map((item) => (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 py-3 hover:opacity-75">
            <span className="w-20 shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-[10px] font-black text-slate-600">
              {item.source}
            </span>
            <span className="flex-1 text-sm font-medium text-navy leading-snug">{item.title}</span>
            <span className="shrink-0 text-xs text-slate-400">{item.age}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function RegulationTable({ regulations }: { regulations: Regulation[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-navy">핵심 규제 준비 현황</h2>
        <a className="text-xs font-medium text-slate-500 hover:text-emeraldBrand" href="#">전체 보기 →</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left">규제</th>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-left">D-day</th>
              <th className="px-4 py-3 text-left">준비도</th>
              <th className="px-4 py-3 text-left">최대 벌금</th>
              <th className="px-4 py-3 text-left">우선순위</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {regulations.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-navy">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.code} · {item.country}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusToneMap[item.statusTone] ?? "bg-slate-100 text-slate-600"}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`font-bold text-sm ${item.dDay <= 120 ? "text-red-500" : "text-slate-500"}`}>
                    D-{item.dDay}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-emeraldBrand" style={{ width: `${item.readiness}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{item.readiness}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-sm font-bold ${item.risk.includes("%") ? "text-red-500" : "text-slate-500"}`}>
                    {item.risk}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-navy">
                    <span className={`h-2 w-2 rounded-full ${item.priority === "높음" ? "bg-red-500" : "bg-orange-400"}`} />
                    {item.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

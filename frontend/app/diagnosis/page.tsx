import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function DiagnosisPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[900px] space-y-5 p-5">
          <div>
            <h1 className="text-xl font-black text-navy">기업 진단</h1>
            <p className="mt-1 text-sm text-slate-500">기업 정보 입력 → 해당 규제 자동 매핑</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-navy mb-5">기업 정보 입력</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">업종</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none">
                  <option>선택하세요</option>
                  <option>제조업</option><option>금융/보험</option><option>유통/리테일</option>
                  <option>에너지/유틸리티</option><option>IT/소프트웨어</option><option>자동차/조선</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">임직원 수</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none">
                  <option>선택하세요</option>
                  <option>250명 미만</option><option>250~999명</option>
                  <option>1,000~4,999명</option><option>5,000명 이상</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-bold text-slate-500">사업 지역 (복수 선택)</label>
              <div className="flex flex-wrap gap-2">
                {["한국", "EU", "미국", "영국", "일본", "싱가포르"].map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-emeraldBrand">
                    <input type="checkbox" />{r}
                  </label>
                ))}
              </div>
            </div>
            <button className="mt-6 w-full rounded-lg bg-navy py-3 text-sm font-bold text-white hover:opacity-90">
              해당 규제 분석하기 →
            </button>
          </div>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-sm text-slate-400">기업 정보를 입력하면 해당 규제 매트릭스가 표시됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}

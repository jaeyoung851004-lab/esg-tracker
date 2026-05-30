import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[700px] space-y-5 p-5">
          <div>
            <h1 className="text-xl font-black text-navy">설정</h1>
            <p className="mt-1 text-sm text-slate-500">기업 정보 및 알림 설정</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-navy mb-4">기업 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">기업명</label>
                <input defaultValue="Impact ON Co." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emeraldBrand" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">담당자</label>
                <input defaultValue="ESG팀" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emeraldBrand" />
              </div>
            </div>
            <button className="mt-4 rounded-lg bg-navy px-6 py-2 text-sm font-bold text-white hover:opacity-90">저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

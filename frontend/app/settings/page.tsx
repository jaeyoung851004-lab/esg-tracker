import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { REG_MASTER, type RegId } from "@/data/regulation-db.mock";

const FOLLOWED_REG_IDS: RegId[] = ["espr", "cbam", "ai_act", "imo_nzf"];
const followedIdSet = new Set<RegId>(FOLLOWED_REG_IDS);

const companyConditions = [
  { label: "업종", value: "전자·반도체, 제조" },
  { label: "주요 수출지역", value: "EU, 미국" },
  { label: "기업 유형", value: "제조사, 공급망 보유" },
  { label: "관리 우선순위", value: "제품 데이터, 탄소배출량, AI 시스템" },
];

const notificationRules = [
  "다음 이벤트 D-90 진입",
  "일정 리스크 상향",
  "현재 단계 변경",
  "우선순위 높은 체크포인트 생성",
];

const dataSources = [
  { name: "REG_MASTER / REG_TRACKING", status: "연결됨", note: "프론트 mock DB" },
  { name: "CHECKPOINTS", status: "연결됨", note: "액션 아이템" },
  { name: "Google News RSS", status: "별도 화면", note: "/news 원본 수집 유지" },
  { name: "ESG_News_Signals", status: "예정", note: "시장 반응 구조화 데이터" },
];

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto max-w-[1040px] space-y-6 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              Workspace Settings
            </p>
            <h1 className="mt-1 text-2xl font-black text-ink-900">설정</h1>
            <p className="mt-1 text-sm text-slate-500">
              기업 조건, 관심 규제, 알림 기준, 데이터 소스 상태를 관리합니다.
            </p>
          </div>

          <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
              <h2 className="text-sm font-black text-ink-900">기업 조건 설정</h2>
              <p className="mt-1 text-xs text-slate-500">
                진단 결과와 Watchlist 추천에 사용하는 기본 조건입니다.
              </p>
              <div className="mt-4 space-y-3">
                {companyConditions.map((item) => (
                  <label key={item.label} className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">{item.label}</span>
                    <input
                      defaultValue={item.value}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
              <h2 className="text-sm font-black text-ink-900">관심 규제 관리</h2>
              <p className="mt-1 text-xs text-slate-500">
                홈 화면에 표시할 규제를 선택합니다.
              </p>
              <div className="mt-4 space-y-2">
                {REG_MASTER.map((reg) => (
                  <label
                    key={reg.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="rounded bg-brand-600 px-2 py-0.5 text-[11px] font-black text-white">
                        {reg.acronym}
                      </span>
                      <span className="truncate text-sm font-bold text-ink-900">{reg.name_ko}</span>
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked={followedIdSet.has(reg.id)}
                      className="h-4 w-4 accent-[#0F6E56]"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
              <h2 className="text-sm font-black text-ink-900">알림 설정</h2>
              <p className="mt-1 text-xs text-slate-500">
                ESG팀이 놓치면 안 되는 변화 조건입니다.
              </p>
              <div className="mt-4 space-y-2">
                {notificationRules.map((rule) => (
                  <label
                    key={rule}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <span className="text-sm font-bold text-ink-900">{rule}</span>
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#0F6E56]" />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
              <h2 className="text-sm font-black text-ink-900">데이터 소스 관리</h2>
              <p className="mt-1 text-xs text-slate-500">
                현재 화면이 참조하는 데이터 계층과 향후 연결 예정 소스입니다.
              </p>
              <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {dataSources.map((source) => (
                  <div key={source.name} className="grid grid-cols-[1fr_72px] gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-ink-900">{source.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{source.note}</p>
                    </div>
                    <span
                      className={`self-start rounded-full px-2 py-0.5 text-center text-[10px] font-bold ${
                        source.status === "연결됨"
                          ? "bg-brand-50 text-brand-700"
                          : source.status === "예정"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

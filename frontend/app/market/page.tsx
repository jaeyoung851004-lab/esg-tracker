import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { REG_MASTER, type RegId } from "@/data/regulation-db.mock";

// TODO: ESG_News_Signals 연동 시 이 mock 배열을 대체합니다.
const marketSignals: {
  id: string;
  regId: RegId;
  title: string;
  source: string;
  region: string;
  actorType: string;
  reactionType: string;
  date: string;
  summary: string;
}[] = [
  {
    id: "sig-cbam-01",
    regId: "cbam",
    title: "EU 수입업자, 첫 CBAM 연간 신고 전 검증 데이터 확보 요구 확대",
    source: "로펌/자문",
    region: "EU/유럽",
    actorType: "수입업자",
    reactionType: "대응 준비",
    date: "2026-06-10",
    summary: "2027년 첫 신고 기한을 앞두고 수입업자와 역외 공급사의 배출량 데이터 검증 요구가 늘고 있습니다.",
  },
  {
    id: "sig-espr-01",
    regId: "espr",
    title: "제조업계, ESPR 위임법 초안 공개 전 제품 데이터 항목 선점",
    source: "산업 매체",
    region: "EU/유럽",
    actorType: "제조사",
    reactionType: "요건 분석",
    date: "2026-06-09",
    summary: "철강·섬유 등 우선 제품군을 중심으로 디지털 제품 여권과 에코디자인 데이터 항목 검토가 진행 중입니다.",
  },
  {
    id: "sig-ai-01",
    regId: "ai_act",
    title: "고위험 AI 적용 전 기업 내부 AI 인벤토리 구축 수요 증가",
    source: "컨설팅/자문",
    region: "글로벌",
    actorType: "기술 공급사",
    reactionType: "컴플라이언스",
    date: "2026-06-08",
    summary: "채용, 신용평가, 제조 품질관리 등 고위험 가능성이 있는 사용 사례부터 문서화 요구가 커지고 있습니다.",
  },
  {
    id: "sig-imo-01",
    regId: "imo_nzf",
    title: "선사·조선사, IMO 넷제로 프레임워크 채택 전 연료 전환 비용 시나리오 점검",
    source: "해운 전문지",
    region: "글로벌",
    actorType: "해운/조선",
    reactionType: "비용 우려",
    date: "2026-06-06",
    summary: "GFI 기준과 탄소가격 메커니즘이 확정될 경우 선박 설계와 연료 조달 전략에 직접 영향이 예상됩니다.",
  },
  {
    id: "sig-cbam-02",
    regId: "cbam",
    title: "철강 공급망, EU 고객사 요청에 맞춰 제품별 내재배출량 산정 체계 정비",
    source: "시장 리포트",
    region: "한국",
    actorType: "수출 제조사",
    reactionType: "데이터 준비",
    date: "2026-06-05",
    summary: "제품 단위 배출량 산정과 제3자 검증 자료를 계약 조건에 반영하려는 움직임이 확인됩니다.",
  },
];

function countBy(key: "reactionType" | "region") {
  const counts = new Map<string, number>();
  for (const signal of marketSignals) {
    const value = signal[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function codeBadge(regId: RegId) {
  const reg = REG_MASTER.find((item) => item.id === regId);
  return (
    <span className="rounded bg-brand-600 px-2 py-0.5 text-[11px] font-black text-white">
      {reg?.acronym ?? regId}
    </span>
  );
}

export default function MarketPage() {
  const reactionTop = countBy("reactionType");
  const regionTop = countBy("region");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto max-w-[1180px] space-y-6 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              Market Signals
            </p>
            <h1 className="mt-1 text-2xl font-black text-ink-900">시장 반응</h1>
            <p className="mt-1 text-sm text-slate-500">
              최근 30일 시장·기업·자문기관 반응을 규제별 신호로 요약합니다.
            </p>
          </div>

          <section className="grid gap-4 lg:grid-cols-4">
            {REG_MASTER.map((reg) => {
              const signals = marketSignals.filter((signal) => signal.regId === reg.id);
              const mainReaction = signals[0]?.reactionType ?? "모니터링";
              return (
                <div key={reg.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
                  <div className="flex items-center justify-between gap-2">
                    {codeBadge(reg.id)}
                    <span className="text-xs font-bold text-slate-400">30일</span>
                  </div>
                  <p className="mt-3 text-2xl font-black text-ink-900">
                    {signals.length}
                    <span className="ml-0.5 text-sm font-bold text-slate-500">건</span>
                  </p>
                  <p className="mt-1 text-xs font-bold text-brand-700">{mainReaction}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {signals[0]?.summary ?? "신규 반응 신호를 모니터링 중입니다."}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
              <h2 className="text-sm font-black text-ink-900">반응 유형 TOP</h2>
              <div className="mt-4 space-y-3">
                {reactionTop.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">{item.label}</span>
                      <span className="font-black text-ink-900">{item.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${(item.count / marketSignals.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
              <h2 className="text-sm font-black text-ink-900">보도 지역 TOP</h2>
              <div className="mt-4 space-y-3">
                {regionTop.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">{item.label}</span>
                      <span className="font-black text-ink-900">{item.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${(item.count / marketSignals.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-none">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-black text-ink-900">주요 기사 리스트</h2>
              <p className="mt-1 text-xs text-slate-500">
                제목, 플레이어, 반응 유형, 보도 지역을 한 줄에서 확인합니다.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {marketSignals.map((signal) => (
                <article
                  key={signal.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[80px_1fr_120px_120px_72px]"
                >
                  <div>{codeBadge(signal.regId)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-black leading-snug text-ink-900">{signal.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{signal.summary}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-600">{signal.actorType}</p>
                  <p className="text-xs font-bold text-brand-700">{signal.reactionType}</p>
                  <p className="text-xs text-slate-400">{formatDate(signal.date)}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

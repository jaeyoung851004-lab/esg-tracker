export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import {
  REG_MASTER,
  REG_TRACKING,
  CHECKPOINTS,
  calcDDay,
  type RegId,
} from "@/data/regulation-db.mock";

const FOLLOWED_REG_IDS: RegId[] = ["espr", "cbam", "ai_act", "imo_nzf"];
const followedIdSet = new Set<RegId>(FOLLOWED_REG_IDS);

type RegMasterItem = (typeof REG_MASTER)[number];
type RegTrackingItem = (typeof REG_TRACKING)[number];
type FollowedReg = {
  reg: RegMasterItem;
  tracking?: RegTrackingItem;
  dDay: number | null;
};

const riskToneClass = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700",
};

const marketSignals: {
  regId: RegId;
  actor: string;
  reaction: string;
  title: string;
  source: string;
  date: string;
}[] = [
  {
    regId: "cbam",
    actor: "수출 제조사",
    reaction: "대응 준비",
    title: "철강·알루미늄 공급망, 2027년 첫 CBAM 신고 전 검증 데이터 정비",
    source: "산업/자문",
    date: "2026-06-10",
  },
  {
    regId: "espr",
    actor: "제조업계",
    reaction: "요건 분석",
    title: "ESPR 우선 제품군 위임법 공개 전 제품 데이터 체계 점검 확대",
    source: "EU 시장",
    date: "2026-06-09",
  },
  {
    regId: "ai_act",
    actor: "기술 공급사",
    reaction: "컴플라이언스",
    title: "고위험 AI 분류 가능 업무부터 기술문서·인간 감독 체계 선점",
    source: "로펌/컨설팅",
    date: "2026-06-07",
  },
];

function codeBadge(reg?: RegMasterItem) {
  return (
    <span className="shrink-0 rounded bg-brand-600 px-2 py-0.5 text-[11px] font-black text-white">
      {reg?.acronym ?? "-"}
    </span>
  );
}

function DDayBadge({ dDay }: { dDay: number | null }) {
  if (dDay === null) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">
        예상
      </span>
    );
  }
  if (dDay < 0) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500">
        시행 중
      </span>
    );
  }
  if (dDay <= 90) {
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[11px] font-bold text-red-600">
        D-{dDay}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-700">
      D-{dDay}
    </span>
  );
}

export default function WatchlistHomePage() {
  const followedRegs = FOLLOWED_REG_IDS.reduce<FollowedReg[]>((items, id) => {
    const reg = REG_MASTER.find((item) => item.id === id);
    if (!reg) return items;
    const tracking = REG_TRACKING.find((item) => item.regulation_id === id);
    items.push({
      reg,
      tracking,
      dDay: calcDDay(tracking?.next_event_date_iso ?? null),
    });
    return items;
  }, []);

  const urgentCheckpoints = CHECKPOINTS.filter(
    (item) =>
      followedIdSet.has(item.regulation_id) &&
      item.phase === "지금" &&
      item.priority === "high"
  );
  const within90 = followedRegs.filter(
    (item) => item.dDay !== null && item.dDay >= 0 && item.dDay <= 90
  );
  const recentChangeCount = followedRegs.filter((item) => item.tracking).length;
  const nowCheckpoints = CHECKPOINTS.filter(
    (item) => followedIdSet.has(item.regulation_id) && item.phase === "지금"
  ).slice(0, 4);

  const upcomingEvents = [...followedRegs].sort((a, b) => {
    const left = a.dDay ?? 9999;
    const right = b.dDay ?? 9999;
    return left - right;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto max-w-[1180px] space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
                Impact ON ESG Regulation Intelligence
              </p>
              <h1 className="mt-1 text-2xl font-black text-ink-900">관심 규제</h1>
              <p className="mt-1 text-sm text-slate-500">
                Impact ON Co. 조건에 맞춰 팔로우 중인 규제와 이번 주 액션을 확인합니다.
              </p>
            </div>
            <a
              href="/settings"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-600 hover:text-brand-700"
            >
              관심 규제 관리
            </a>
          </div>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "긴급 대응 필요",
                value: urgentCheckpoints.length,
                unit: "건",
                sub: "지금 단계 · 우선순위 높음",
                tone: "text-red-600",
              },
              {
                label: "90일 내 일정",
                value: within90.length,
                unit: "건",
                sub: "확정일 기준",
                tone: "text-amber-600",
              },
              {
                label: "최근 변경",
                value: recentChangeCount,
                unit: "건",
                sub: "REG_TRACKING 업데이트 기준",
                tone: "text-brand-700",
              },
              {
                label: "팔로우 규제",
                value: followedRegs.length,
                unit: "개",
                sub: followedRegs.map((item) => item.reg.acronym).join(" · "),
                tone: "text-ink-900",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-none"
              >
                <p className="text-xs font-bold text-slate-500">{card.label}</p>
                <p className={`mt-2 text-3xl font-black ${card.tone}`}>
                  {card.value}
                  <span className="ml-0.5 text-sm font-bold">{card.unit}</span>
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-400">{card.sub}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-xl border border-slate-200 bg-white shadow-none">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black text-ink-900">이번 주 확인해야 할 것</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    팔로우 규제의 다음 이벤트와 담당 부서 기준
                  </p>
                </div>
                <a href="/changes" className="text-xs font-bold text-brand-700 hover:underline">
                  변경사항 보기
                </a>
              </div>
              <div className="divide-y divide-slate-100">
                {upcomingEvents.map(({ reg, tracking, dDay }) => (
                  <a
                    key={reg.id}
                    href={`/regulations/${reg.id}`}
                    className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[70px_72px_1fr_110px]"
                  >
                    <div>
                      <DDayBadge dDay={dDay} />
                    </div>
                    <div>{codeBadge(reg)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink-900">
                        {tracking?.next_event_label ?? "다음 이벤트 확인 필요"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {tracking?.business_action_now ?? reg.why_it_matters}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xs font-bold text-slate-600">
                        {tracking?.next_event_expected_date ?? "미정"}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {tracking?.current_stage_owner ?? reg.enforcing_body}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-none">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-black text-ink-900">지금 해야 할 일</h2>
                <p className="mt-0.5 text-xs text-slate-500">체크포인트 중 즉시 착수 항목</p>
              </div>
              <div className="divide-y divide-slate-100">
                {nowCheckpoints.map((checkpoint) => {
                  const reg = REG_MASTER.find((item) => item.id === checkpoint.regulation_id);
                  return (
                    <div key={checkpoint.checkpoint_id} className="px-5 py-4">
                      <div className="mb-2 flex items-center gap-2">
                        {codeBadge(reg)}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            checkpoint.priority === "high"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {checkpoint.priority === "high" ? "긴급" : "준비"}
                        </span>
                      </div>
                      <p className="text-sm font-bold leading-snug text-ink-900">
                        {checkpoint.action}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {checkpoint.target_function.join(", ")}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 px-5 py-3">
                <a href="/checkpoints" className="text-xs font-bold text-brand-700 hover:underline">
                  전체 체크포인트 보기
                </a>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-xl border border-slate-200 bg-white shadow-none">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black text-ink-900">최근 시장 반응</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    규제별 반응 유형을 뉴스 목록이 아닌 신호로 요약합니다.
                  </p>
                </div>
                <a href="/market" className="text-xs font-bold text-brand-700 hover:underline">
                  시장 반응 보기
                </a>
              </div>
              <div className="divide-y divide-slate-100">
                {marketSignals.map((signal) => {
                  const reg = REG_MASTER.find((item) => item.id === signal.regId);
                  return (
                    <div key={`${signal.regId}-${signal.title}`} className="px-5 py-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {codeBadge(reg)}
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                          {signal.reaction}
                        </span>
                        <span className="text-[11px] text-slate-400">{signal.date}</span>
                      </div>
                      <p className="text-sm font-bold text-ink-900">{signal.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {signal.actor} · {signal.source}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
              <h2 className="text-sm font-black text-ink-900">팔로우 규제 상태</h2>
              <p className="mt-1 text-xs text-slate-500">
                일정 리스크가 바뀌면 홈과 최근 변경사항에 함께 반영됩니다.
              </p>
              <div className="mt-4 space-y-3">
                {followedRegs.map(({ reg, tracking }) => (
                  <a
                    key={reg.id}
                    href={`/regulations/${reg.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-brand-600"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {codeBadge(reg)}
                        <p className="truncate text-sm font-black text-ink-900">{reg.name_ko}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          riskToneClass[tracking?.schedule_risk_level ?? "medium"]
                        }`}
                      >
                        리스크 {tracking?.schedule_risk_level === "high" ? "높음" : tracking?.schedule_risk_level === "low" ? "낮음" : "중간"}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                      {tracking?.current_stage_label ?? reg.status_label}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

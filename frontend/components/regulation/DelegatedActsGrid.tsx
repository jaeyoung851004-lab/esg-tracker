import type { RegulationDetail } from "@/types/dashboard";

export function DelegatedActsGrid({ regulation }: { regulation: RegulationDetail }) {
  const items = regulation.delegated_acts_tracker ?? [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-black text-navy">품목별 위임입법 현황</h2>
        <p className="mt-1 text-sm text-slate-500">
          별도 데이터 필드가 있을 때만 품목별 진행 현황을 표시합니다.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={`${item.product_group}-${item.stage_label}`}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-black text-navy">{item.product_group}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">{item.stage_label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.next_event}</p>
              <p className="mt-3 text-xs font-bold text-emerald-700">{item.expected_date}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
          품목별 위임입법 현황은 준비 중입니다
        </div>
      )}
    </section>
  );
}

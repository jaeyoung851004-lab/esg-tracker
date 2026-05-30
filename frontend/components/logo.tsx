export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emeraldBrand">
        <span className="text-xs font-black text-white">IO</span>
      </div>
      <div>
        <p className="text-sm font-black text-navy">Impact ON</p>
        <p className="text-[10px] text-slate-500">ESG 규제 트래커</p>
      </div>
    </div>
  );
}

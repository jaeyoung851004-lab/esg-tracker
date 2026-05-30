export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-6 py-3.5 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="hidden max-w-md flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <span className="mr-2 text-slate-400">🔍</span>
          <input
            className="w-full border-0 bg-transparent text-sm font-medium text-navy outline-none placeholder:text-slate-400"
            placeholder="규제명, 키워드, 국가, 산업을 검색하세요"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="relative rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
            <span className="text-base">🔔</span>
            <span className="absolute right-1 top-1 rounded-full bg-red-600 px-1 text-[9px] font-black text-white">12</span>
          </button>
          <button className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 md:flex">
            <span>도움말</span>
          </button>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emeraldBrand text-xs font-black text-white">
              E
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-navy">ESG팀</p>
              <p className="text-xs text-slate-500">Impact ON Co.</p>
            </div>
            <span className="text-slate-400 text-sm">∨</span>
          </div>
        </div>
      </div>
    </header>
  );
}

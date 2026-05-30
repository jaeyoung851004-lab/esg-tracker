"use client";
import { useState } from "react";

const navItems = [
  { label: "대시보드", active: true },
  { label: "규제 탐색" },
  { label: "규제 상세" },
  { label: "뉴스 & 인사이트" },
  { label: "기업 진단" },
  { label: "데이터 관리" },
  { label: "설정" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-[220px] shrink-0 border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emeraldBrand">
            <span className="text-xs font-black text-white">IO</span>
          </div>
          <div>
            <p className="text-sm font-black text-navy">Impact ON</p>
            <p className="text-[10px] text-slate-500">ESG 규제 트래커</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
              item.active
                ? "bg-emeraldBrand/10 font-bold text-emeraldBrand"
                : "font-medium text-slate-600 hover:bg-slate-50 hover:text-navy"
            }`}
          >
            {item.label}
            {item.label === "대시보드" && (
              <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">3</span>
            )}
          </button>
        ))}
      </nav>

      <div className="mx-3 mt-2 border-t border-slate-200 pt-4">
        <p className="mb-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">MY 기업</p>
        <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy">
          Impact ON Co.
          <span className="text-slate-400">∨</span>
        </button>
      </div>

      <div className="mx-3 mb-4 mt-auto border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p className="font-medium">마지막 업데이트</p>
        <p className="mt-1 font-bold text-slate-600">2026.05.28 09:30</p>
      </div>
    </aside>
  );
}

"use client";

import { Settings } from "lucide-react";

export function AppHeader() {
  return (
    <div className="flex items-center justify-between px-6 pt-2 pb-3">
      <div className="font-display text-base font-bold tracking-[0.05em]">
        <span className="text-cyan">Voice</span>
        <span className="text-text-dim font-normal">Craft</span>
      </div>
      <button className="w-8 h-8 rounded-lg bg-bg2 border border-border flex items-center justify-center cursor-pointer hover:border-cyan/30 transition-colors">
        <Settings size={16} className="text-text-dim" />
      </button>
    </div>
  );
}

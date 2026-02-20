"use client";

import { Mic, Sparkles, BarChart3, FolderOpen } from "lucide-react";
import type { TabId } from "@/lib/constants";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Mic }[] = [
  { id: "record", label: "録音", icon: Mic },
  { id: "process", label: "処理", icon: Sparkles },
  { id: "eval", label: "評価", icon: BarChart3 },
  { id: "history", label: "履歴", icon: FolderOpen },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 w-full max-w-[390px] bg-bg/90 backdrop-blur-2xl border-t border-border z-50">
      <div className="flex py-2 pb-7">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer py-1.5 transition-opacity"
              onClick={() => onTabChange(tab.id)}
            >
              <Icon
                size={20}
                className={`transition-all ${isActive ? "text-cyan glow-cyan" : "text-text-dim"}`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${isActive ? "text-cyan" : "text-text-dim"}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { Mic, BookOpen, Music, TrendingUp, AudioLines } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { HISTORY_ITEMS, SCORE_CHART_DATA } from "@/lib/constants";

interface HistoryScreenProps {
  dynamicHistory?: {
    id: string;
    title: string;
    date: string;
    duration: string;
    score: number;
  }[];
  onSelectItem: () => void;
}

const staticIcons = [Mic, BookOpen, Music];

export function HistoryScreen({
  dynamicHistory = [],
  onSelectItem,
}: HistoryScreenProps) {
  const allItems = [
    ...dynamicHistory.map((h) => ({
      ...h,
      isDynamic: true as const,
    })),
    ...HISTORY_ITEMS.map((h) => ({
      ...h,
      isDynamic: false as const,
    })),
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle className="mt-2">録音履歴</SectionTitle>

      {allItems.length === 0 && (
        <div className="text-center py-12 text-text-dim text-sm">
          録音がまだありません
        </div>
      )}

      {allItems.map((item, i) => {
        const Icon = item.isDynamic
          ? AudioLines
          : staticIcons[i - dynamicHistory.length] || Mic;
        const isHighScore = item.score >= 80;
        return (
          <div
            key={item.id}
            className="bg-bg2 border border-border rounded-[14px] p-4 mb-3 flex gap-3.5 items-center cursor-pointer transition-all hover:border-cyan/30 active:scale-[0.99]"
            onClick={onSelectItem}
          >
            <div className="w-12 h-12 rounded-[10px] bg-bg3 border border-border flex items-center justify-center shrink-0">
              <Icon size={22} className="text-text-mid" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm mb-1 truncate">
                {item.title}
              </div>
              <div className="font-mono text-[10px] text-text-dim tracking-[0.05em]">
                {item.date} · {item.duration} · AI処理済
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-full font-mono text-[12px] font-bold border ${
                isHighScore
                  ? "bg-green-dim text-green border-green/20"
                  : "bg-cyan-dim text-cyan border-cyan/20"
              }`}
            >
              {item.score}
            </div>
          </div>
        );
      })}

      <div className="glow-line my-6" />
      <SectionTitle>スコア推移</SectionTitle>

      <div className="bg-bg2 border border-border rounded-xl p-4">
        <svg width="100%" height="80" viewBox="0 0 300 80">
          <line x1="10" y1="20" x2="290" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <line x1="10" y1="40" x2="290" y2="40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <line x1="10" y1="60" x2="290" y2="60" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,229,255,0.15)" />
              <stop offset="100%" stopColor="rgba(0,229,255,0)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon
            points="10,60 60,52 110,45 160,50 210,38 260,26 290,18 290,75 10,75"
            fill="url(#areaGrad)"
          />
          <polyline
            points="10,60 60,52 110,45 160,50 210,38 260,26 290,18"
            fill="none"
            stroke="var(--color-cyan)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            [10, 60],
            [60, 52],
            [110, 45],
            [160, 50],
            [210, 38],
            [260, 26],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={3} fill="var(--color-cyan)" opacity={0.8} />
          ))}
          <circle cx="290" cy="18" r="5" fill="var(--color-green)" filter="url(#glow)" />
        </svg>
        <div className="flex justify-between font-mono text-[9px] text-text-dim mt-1">
          {SCORE_CHART_DATA.map((d) => (
            <span key={d.date}>{d.date}</span>
          ))}
        </div>
        <div className="text-center text-[12px] text-text-dim mt-2 flex items-center justify-center gap-1.5">
          <TrendingUp size={14} className="text-green" />
          先週比 <span className="text-green font-mono font-bold">+13pt</span>{" "}
          上達中
        </div>
      </div>
    </div>
  );
}

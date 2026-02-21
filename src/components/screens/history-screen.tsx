"use client";

import { useMemo } from "react";
import { AudioLines, Mic, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";

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

export function HistoryScreen({
  dynamicHistory = [],
  onSelectItem,
}: HistoryScreenProps) {
  // Build chart data from actual history (most recent 7, in chronological order)
  const chartData = useMemo(() => {
    const recent = [...dynamicHistory].reverse().slice(-7);
    return recent.map((item) => ({
      date: item.date.split(".").slice(1).join("/"), // "2026.02.20" → "02/20"
      score: item.score,
    }));
  }, [dynamicHistory]);

  // Compute trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].score;
    const last = chartData[chartData.length - 1].score;
    return last - first;
  }, [chartData]);

  // Build SVG chart points
  const chartSvg = useMemo(() => {
    if (chartData.length < 2) return null;
    const w = 300;
    const h = 80;
    const pad = { top: 10, bottom: 20, left: 10, right: 10 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const scores = chartData.map((d) => d.score);
    const minScore = Math.max(0, Math.min(...scores) - 10);
    const maxScore = Math.min(100, Math.max(...scores) + 10);
    const range = maxScore - minScore || 1;

    const points = chartData.map((d, i) => {
      const x = pad.left + (i / (chartData.length - 1)) * plotW;
      const y = pad.top + plotH - ((d.score - minScore) / range) * plotH;
      return { x, y };
    });

    const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
    const areaPoints = `${points[0].x},${pad.top + plotH} ${polyline} ${points[points.length - 1].x},${pad.top + plotH}`;

    return { points, polyline, areaPoints, w, h, pad, plotH };
  }, [chartData]);

  return (
    <div className="animate-fade-in">
      <SectionTitle className="mt-2">録音履歴</SectionTitle>

      {dynamicHistory.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-text-dim">
          <Mic size={32} className="mb-4 opacity-30" />
          <div className="text-sm mb-1">録音がまだありません</div>
          <div className="text-[12px] opacity-60">
            録音タブから音声を録音してみましょう
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {dynamicHistory.map((item) => {
          const isHighScore = item.score >= 80;
          return (
            <div
              key={item.id}
              className="bg-bg2 border border-border rounded-2xl p-5 flex gap-4 items-center cursor-pointer transition-all hover:border-cyan/30 active:scale-[0.99]"
              onClick={onSelectItem}
            >
              <div className="w-13 h-13 rounded-xl bg-bg3 border border-border flex items-center justify-center shrink-0">
                <AudioLines size={22} className="text-text-mid" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-2 truncate">
                  {item.title}
                </div>
                <div className="font-mono text-[10px] text-text-dim tracking-[0.05em]">
                  {item.date} · {item.duration} · AI処理済
                </div>
              </div>
              <div
                className={`px-3.5 py-2 rounded-full font-mono text-[13px] font-bold border ${
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
      </div>

      {/* Score trend chart - shown when there are 2+ items */}
      {chartSvg && chartData.length >= 2 && (
        <>
          <div className="glow-line my-8" />
          <SectionTitle>スコア推移</SectionTitle>

          <div className="bg-bg2 border border-border rounded-2xl p-5">
            <svg
              width="100%"
              height="80"
              viewBox={`0 0 ${chartSvg.w} ${chartSvg.h}`}
            >
              {/* Grid lines */}
              {[0, 1, 2].map((i) => {
                const y =
                  chartSvg.pad.top +
                  (i / 2) * chartSvg.plotH;
                return (
                  <line
                    key={i}
                    x1={chartSvg.pad.left}
                    y1={y}
                    x2={chartSvg.w - chartSvg.pad.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Area fill */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0,229,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(0,229,255,0)" />
                </linearGradient>
              </defs>
              <polygon
                points={chartSvg.areaPoints}
                fill="url(#chartGrad)"
              />
              {/* Line */}
              <polyline
                points={chartSvg.polyline}
                fill="none"
                stroke="var(--color-cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {chartSvg.points.map((p, i) => {
                const isLast = i === chartSvg.points.length - 1;
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={isLast ? 4 : 3}
                    fill={isLast ? "var(--color-green)" : "var(--color-cyan)"}
                    opacity={isLast ? 1 : 0.8}
                  />
                );
              })}
            </svg>
            {/* Date labels */}
            <div className="flex justify-between font-mono text-[9px] text-text-dim mt-1 px-1">
              {chartData.map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
            </div>
            {/* Trend indicator */}
            <div className="text-center text-[12px] text-text-dim mt-4 flex items-center justify-center gap-2">
              {trend > 0 ? (
                <>
                  <TrendingUp size={14} className="text-green" />
                  <span className="text-green font-mono font-bold">+{trend}pt</span>{" "}
                  上達中
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingDown size={14} className="text-red" />
                  <span className="text-red font-mono font-bold">{trend}pt</span>
                </>
              ) : (
                <>
                  <Minus size={14} className="text-text-dim" />
                  スコア安定
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

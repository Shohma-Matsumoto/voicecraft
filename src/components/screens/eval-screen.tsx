"use client";

import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Lightbulb,
  Download,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { Chip } from "@/components/ui/chip";
import { BigButton } from "@/components/ui/big-button";
import type { AnalysisResult } from "@/lib/audio-analyzer";

interface EvalScreenProps {
  analysisResult: AnalysisResult | null;
  onExport: () => void;
}

export function EvalScreen({ analysisResult, onExport }: EvalScreenProps) {
  if (!analysisResult) {
    return (
      <div className="animate-fade-in">
        <SectionTitle className="mt-2">アクセント評価</SectionTitle>
        <div className="text-center py-16 text-text-dim text-sm">
          録音を処理すると、ここに評価結果が表示されます
        </div>
      </div>
    );
  }

  const { overallScore: score, label, evalItems, metrics, improvementCount } = analysisResult;
  const metricsList = [
    { name: "アクセント", value: metrics.accent, color: "cyan" as const },
    { name: "発話速度", value: metrics.speechRate, color: "green" as const },
    { name: "イントネーション", value: metrics.intonation, color: "amber" as const },
    { name: "明瞭度", value: metrics.clarity, color: "cyan" as const },
  ];

  // SVG score ring: circumference = 2*PI*56 ≈ 352
  const circumference = 352;
  const dashOffset = circumference - (circumference * score) / 100;

  return (
    <div className="animate-fade-in">
      <SectionTitle className="mt-2">アクセント評価</SectionTitle>

      {/* Score ring */}
      <div className="flex flex-col items-center mt-8 mb-10">
        <div className="w-[140px] h-[140px] relative">
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            className="-rotate-90"
          >
            <circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            <circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="animate-progress-fill"
            />
            <defs>
              <linearGradient
                id="scoreGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#00FF87" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[42px] font-bold text-cyan leading-none">
              {score}
            </span>
            <span className="text-[12px] text-text-dim mt-1">/ 100</span>
          </div>
        </div>
        <div className="mt-4 text-center flex items-center gap-2.5">
          <Chip>{label}</Chip>
          {improvementCount > 0 && (
            <span className="font-mono text-[11px] text-text-dim">
              {improvementCount}箇所に改善ポイント
            </span>
          )}
        </div>
      </div>

      {/* Evaluation items */}
      {evalItems.length > 0 && (
        <>
          <SectionTitle>指摘箇所</SectionTitle>
          <div className="flex flex-col gap-3 mb-2">
            {evalItems.map((item, i) => {
              const StatusIcon =
                item.status === "correct"
                  ? CheckCircle2
                  : item.status === "warning"
                    ? AlertTriangle
                    : XCircle;
              const statusColor =
                item.status === "correct"
                  ? "text-green"
                  : item.status === "warning"
                    ? "text-amber"
                    : "text-red";
              const noteColor =
                item.status === "correct" ? "text-green" : "text-red";

              return (
                <div
                  key={item.word + i}
                  className="bg-bg2 border border-border rounded-2xl p-4 flex gap-3.5 items-start animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <StatusIcon
                    size={18}
                    className={`${statusColor} mt-0.5 shrink-0`}
                    strokeWidth={2}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] mb-1.5">
                      「{item.word}」
                      <span
                        className={`text-[11px] font-mono ${noteColor} font-normal ml-2`}
                      >
                        {item.pitchNote}
                      </span>
                    </div>
                    <div className="text-[12px] text-text-dim leading-relaxed">
                      {item.description}
                    </div>
                    {item.tip && (
                      <div className="mt-2.5 p-2.5 bg-amber-dim rounded-lg text-[11px] text-amber leading-relaxed flex gap-2 items-start">
                        <Lightbulb size={12} className="mt-0.5 shrink-0" />
                        <span>{item.tip}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detailed scores */}
      <div className="glow-line my-7" />
      <SectionTitle>詳細スコア</SectionTitle>

      <div className="flex flex-col gap-3.5 mt-5">
        {metricsList.map((metric) => (
          <div key={metric.name} className="flex items-center gap-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.05em] text-text-dim w-[72px] shrink-0 text-right">
              {metric.name}
            </div>
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full animate-progress-fill ${
                  metric.color === "green"
                    ? "bg-green"
                    : metric.color === "amber"
                      ? "bg-amber"
                      : "bg-cyan"
                }`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
            <div
              className={`font-mono text-[13px] font-bold w-8 text-right ${
                metric.color === "green"
                  ? "text-green"
                  : metric.color === "amber"
                    ? "text-amber"
                    : "text-cyan"
              }`}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <BigButton icon={Download} onClick={onExport}>
          エクスポート
        </BigButton>
      </div>
    </div>
  );
}

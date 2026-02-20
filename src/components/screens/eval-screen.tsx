"use client";

import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Lightbulb,
  Download,
  Play,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { Chip } from "@/components/ui/chip";
import { BigButton } from "@/components/ui/big-button";
import type { AnalysisResult } from "@/lib/audio-analyzer";

interface EvalScreenProps {
  analysisResult: AnalysisResult | null;
  onExport: () => void;
}

const FALLBACK_METRICS = [
  { name: "アクセント", value: 82, color: "cyan" as const },
  { name: "発話速度", value: 90, color: "green" as const },
  { name: "イントネーション", value: 65, color: "amber" as const },
  { name: "明瞭度", value: 88, color: "cyan" as const },
];

export function EvalScreen({ analysisResult, onExport }: EvalScreenProps) {
  const score = analysisResult?.overallScore ?? 82;
  const label = analysisResult?.label ?? "発音 良好";
  const evalItems = analysisResult?.evalItems ?? [];
  const metrics = analysisResult
    ? [
        { name: "アクセント", value: analysisResult.metrics.accent, color: "cyan" as const },
        { name: "発話速度", value: analysisResult.metrics.speechRate, color: "green" as const },
        { name: "イントネーション", value: analysisResult.metrics.intonation, color: "amber" as const },
        { name: "明瞭度", value: analysisResult.metrics.clarity, color: "cyan" as const },
      ]
    : FALLBACK_METRICS;
  const improvementCount =
    analysisResult?.improvementCount ?? evalItems.filter((e) => e.status !== "correct").length;

  // SVG score ring: circumference = 2*PI*56 ≈ 352
  const circumference = 352;
  const dashOffset = circumference - (circumference * score) / 100;

  return (
    <div className="animate-fade-in">
      <SectionTitle className="mt-2">アクセント評価</SectionTitle>

      {/* Score ring */}
      <div className="flex flex-col items-center mt-6 mb-8">
        <div className="w-[130px] h-[130px] relative">
          <svg
            width="130"
            height="130"
            viewBox="0 0 130 130"
            className="-rotate-90"
          >
            <circle
              cx="65"
              cy="65"
              r="56"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            <circle
              cx="65"
              cy="65"
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
            <span className="font-display text-4xl font-bold text-cyan leading-none">
              {score}
            </span>
            <span className="text-[12px] text-text-dim mt-0.5">/ 100</span>
          </div>
        </div>
        <div className="mt-3 text-center flex items-center gap-2">
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
                className="bg-bg2 border border-border rounded-xl p-3.5 mb-2.5 flex gap-3 items-start animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <StatusIcon
                  size={18}
                  className={`${statusColor} mt-0.5 shrink-0`}
                  strokeWidth={2}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] mb-1">
                    「{item.word}」
                    <span
                      className={`text-[11px] font-mono ${noteColor} font-normal ml-1.5`}
                    >
                      {item.pitchNote}
                    </span>
                  </div>
                  <div className="text-[12px] text-text-dim leading-relaxed">
                    {item.description}
                  </div>
                  {item.tip && (
                    <div className="mt-2 p-2 bg-amber-dim rounded-md text-[11px] text-amber leading-relaxed flex gap-1.5 items-start">
                      <Lightbulb size={12} className="mt-0.5 shrink-0" />
                      <span>{item.tip}</span>
                    </div>
                  )}
                  {item.status !== "correct" && (
                    <button className="mt-2 flex items-center gap-1 text-[11px] font-mono text-cyan/70 hover:text-cyan transition-colors">
                      <Play size={10} /> お手本を再生
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Fallback for no analysis (viewing from history) */}
      {evalItems.length === 0 && !analysisResult && (
        <>
          <SectionTitle>指摘箇所</SectionTitle>
          <div className="bg-bg2 border border-border rounded-xl p-3.5 mb-2.5 flex gap-3 items-start">
            <AlertTriangle size={18} className="text-amber mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-[15px] mb-1">
                「雨」
                <span className="text-[11px] font-mono text-red font-normal ml-1.5">
                  平板型になっています
                </span>
              </div>
              <div className="text-[12px] text-text-dim leading-relaxed">
                「あめ」は起伏型 (LH) が標準アクセントです。
              </div>
            </div>
          </div>
          <div className="bg-bg2 border border-border rounded-xl p-3.5 mb-2.5 flex gap-3 items-start">
            <CheckCircle2 size={18} className="text-green mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-[15px] mb-1">
                「東京」
                <span className="text-[11px] font-mono text-green font-normal ml-1.5">
                  正確
                </span>
              </div>
              <div className="text-[12px] text-text-dim leading-relaxed">
                LHHLの正しいアクセントパターンで発音できています。
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detailed scores */}
      <div className="glow-line my-6" />
      <SectionTitle>詳細スコア</SectionTitle>

      <div className="flex flex-col gap-3 mt-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="flex items-center gap-2.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.05em] text-text-dim w-[72px] shrink-0 text-right">
              {metric.name}
            </div>
            <div className="flex-1 h-1 bg-white/[0.08] rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm animate-progress-fill ${
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
              className={`font-mono text-[12px] w-8 text-right ${
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

      <div className="mt-6">
        <BigButton icon={Download} onClick={onExport}>
          エクスポート
        </BigButton>
      </div>
    </div>
  );
}

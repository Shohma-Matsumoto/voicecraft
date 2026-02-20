"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  VolumeX,
  Waves,
  BarChart3,
  SlidersHorizontal,
  Target,
  CheckCircle2,
  Loader2,
  Clock,
  Play,
  Pause,
  ArrowRight,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { BigButton } from "@/components/ui/big-button";
import {
  processAudio,
  playBuffer,
  type ProcessingResult,
  type StepId,
} from "@/lib/audio-processor";
import { analyzeAudio, type AnalysisResult } from "@/lib/audio-analyzer";
import { audioBufferToWav } from "@/lib/audio-exporter";

interface ProcessScreenProps {
  originalBuffer: AudioBuffer | null;
  originalBlob: Blob | null;
  isActive: boolean;
  onGoToEval: () => void;
  onProcessComplete: (result: ProcessingResult, analysis: AnalysisResult) => void;
}

type StepStatus = "wait" | "running" | "done";

const STEPS = [
  { id: "noise-gate" as StepId, name: "リップノイズ除去", desc: "口の開閉音・吐息音を除去" },
  { id: "highpass" as StepId, name: "ホワイトノイズ除去", desc: "背景ノイズをフィルタで低減" },
  { id: "eq-dynamics" as StepId, name: "ダイナミクス整形", desc: "音量ムラをコンプレッサーで均す" },
  { id: "presence-deess" as StepId, name: "EQ & De-esser", desc: "音質を最適化" },
  { id: "limiter" as StepId, name: "アクセント評価", desc: "日本語のアクセントを分析" },
];

const stepIcons = [VolumeX, Waves, BarChart3, SlidersHorizontal, Target];
const stepIconColors = [
  "bg-cyan-dim",
  "bg-cyan-dim",
  "bg-amber-dim",
  "bg-amber-dim",
  "bg-green-dim",
];

export function ProcessScreen({
  originalBuffer,
  originalBlob,
  isActive,
  onGoToEval,
  onProcessComplete,
}: ProcessScreenProps) {
  const [statuses, setStatuses] = useState<StepStatus[]>(STEPS.map(() => "wait"));
  const [currentStep, setCurrentStep] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [playingBefore, setPlayingBefore] = useState(false);
  const [playingAfter, setPlayingAfter] = useState(false);
  const stopRef = useRef<{ stop: () => void } | null>(null);

  const stepIndexMap: Record<StepId, number> = {
    "noise-gate": 0,
    highpass: 1,
    "eq-dynamics": 2,
    "presence-deess": 3,
    limiter: 4,
  };

  const runProcessing = useCallback(async () => {
    if (hasStarted || !originalBuffer || !originalBlob) return;
    setHasStarted(true);
    setStatuses(STEPS.map(() => "wait"));
    setCurrentStep(0);
    setIsComplete(false);

    // Set first step running
    setStatuses((prev) => {
      const next = [...prev];
      next[0] = "running";
      return next;
    });

    try {
      const processingResult = await processAudio(originalBuffer, (step) => {
        const idx = stepIndexMap[step];
        setCurrentStep(idx);
        setStatuses((prev) => {
          const next = [...prev];
          // Mark all previous as done
          for (let i = 0; i < idx; i++) next[i] = "done";
          next[idx] = "running";
          return next;
        });
      });

      // Mark all steps done
      setStatuses(STEPS.map(() => "done"));
      setCurrentStep(STEPS.length);
      setResult(processingResult);

      // Run accent analysis
      const processedWavBlob = audioBufferToWav(processingResult.processedBuffer);
      const analysis = await analyzeAudio(processedWavBlob, processingResult.processedBuffer);

      setIsComplete(true);
      onProcessComplete(processingResult, analysis);
    } catch (err) {
      console.error("Processing failed:", err);
      setStatuses(STEPS.map(() => "done"));
      setIsComplete(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, originalBuffer, originalBlob, onProcessComplete]);

  useEffect(() => {
    if (isActive && !hasStarted && originalBuffer) {
      const timer = setTimeout(runProcessing, 300);
      return () => clearTimeout(timer);
    }
  }, [isActive, hasStarted, originalBuffer, runProcessing]);

  const handlePlayBefore = useCallback(() => {
    if (!originalBuffer) return;
    if (playingBefore) {
      stopRef.current?.stop();
      setPlayingBefore(false);
      return;
    }
    stopRef.current?.stop();
    setPlayingAfter(false);
    setPlayingBefore(true);
    stopRef.current = playBuffer(originalBuffer, () => setPlayingBefore(false));
  }, [originalBuffer, playingBefore]);

  const handlePlayAfter = useCallback(() => {
    if (!result) return;
    if (playingAfter) {
      stopRef.current?.stop();
      setPlayingAfter(false);
      return;
    }
    stopRef.current?.stop();
    setPlayingBefore(false);
    setPlayingAfter(true);
    stopRef.current = playBuffer(result.processedBuffer, () =>
      setPlayingAfter(false),
    );
  }, [result, playingAfter]);

  useEffect(() => {
    return () => {
      stopRef.current?.stop();
    };
  }, []);

  const currentInfo =
    currentStep >= 0 && currentStep < STEPS.length ? STEPS[currentStep] : null;

  const processingLabels: Record<StepId, { label: string; desc: string }> = {
    "noise-gate": { label: "ノイズ除去中...", desc: "リップノイズを検出して除去しています" },
    highpass: { label: "AIフィルタリング...", desc: "バックグラウンドノイズを除去中" },
    "eq-dynamics": { label: "ダイナミクス処理...", desc: "音量を整えています" },
    "presence-deess": { label: "EQ調整中...", desc: "聞き心地を最適化しています" },
    limiter: { label: "アクセント解析...", desc: "日本語アクセントを評価しています" },
  };

  return (
    <div className="animate-fade-in">
      <SectionTitle className="mt-2">AI音声処理</SectionTitle>

      <div className="text-center py-6">
        <div className="mb-3">
          {isComplete ? (
            <CheckCircle2
              size={48}
              className="text-green mx-auto"
              strokeWidth={1.5}
            />
          ) : (
            <Loader2
              size={48}
              className="text-cyan mx-auto animate-spin"
              strokeWidth={1.5}
            />
          )}
        </div>
        <div className="font-display text-lg text-cyan">
          {isComplete
            ? "処理完了!"
            : currentInfo
              ? processingLabels[currentInfo.id].label
              : "準備中..."}
        </div>
        <div className="text-[13px] text-text-dim mt-1.5">
          {isComplete
            ? "すべての処理が完了しました"
            : currentInfo
              ? processingLabels[currentInfo.id].desc
              : ""}
        </div>
      </div>

      <div className="bg-bg2 border border-border rounded-2xl p-5 mb-3">
        {STEPS.map((step, i) => {
          const Icon = stepIcons[i];
          const status = statuses[i];
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 py-2.5 ${i < STEPS.length - 1 ? "border-b border-white/[0.04]" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stepIconColors[i]}`}
              >
                <Icon
                  size={16}
                  className={
                    i < 2
                      ? "text-cyan"
                      : i < 4
                        ? "text-amber"
                        : "text-green"
                  }
                />
              </div>
              <div className="flex-1">
                <div className="font-medium text-[13px]">{step.name}</div>
                <div className="text-[11px] text-text-dim mt-0.5">
                  {step.desc}
                </div>
              </div>
              <div
                className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                  status === "done"
                    ? "bg-green-dim text-green"
                    : status === "running"
                      ? "bg-cyan-dim text-cyan animate-blink"
                      : "bg-white/5 text-text-dim"
                }`}
              >
                {status === "done" ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={10} /> 完了
                  </span>
                ) : status === "running" ? (
                  <span className="flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> 処理中
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> 待機中
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isComplete && result && (
        <div className="animate-fade-in">
          <div className="glow-line my-6" />
          <SectionTitle>Before / After 比較</SectionTitle>

          <div className="rounded-2xl border border-border bg-bg2 p-4 mb-4">
            <div className="flex gap-3 mb-4">
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 border py-2.5 rounded-lg font-mono text-[12px] tracking-[0.08em] uppercase cursor-pointer transition-colors ${
                  playingBefore
                    ? "bg-amber/30 border-amber/50 text-amber"
                    : "bg-amber-dim border-amber/30 text-amber hover:bg-amber/20"
                }`}
                onClick={handlePlayBefore}
              >
                {playingBefore ? <Pause size={14} /> : <Play size={14} />}{" "}
                Before
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 border py-2.5 rounded-lg font-mono text-[12px] tracking-[0.08em] uppercase cursor-pointer transition-colors ${
                  playingAfter
                    ? "bg-cyan/30 border-cyan/50 text-cyan"
                    : "bg-cyan-dim border-cyan/30 text-cyan hover:bg-cyan/20"
                }`}
                onClick={handlePlayAfter}
              >
                {playingAfter ? <Pause size={14} /> : <Play size={14} />} After
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1 flex flex-col items-center gap-1">
                <svg
                  width="100%"
                  height="48"
                  viewBox="0 0 140 48"
                  className="opacity-80"
                >
                  <polyline
                    points="0,24 10,8 15,38 20,12 28,36 33,6 40,30 47,14 53,40 60,10 67,32 72,4 80,28 87,18 93,42 100,8 107,34 114,16 120,38 130,12 140,26"
                    fill="none"
                    stroke="rgba(255,77,109,0.6)"
                    strokeWidth="2"
                  />
                </svg>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-dim">
                  Before
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <svg
                  width="100%"
                  height="48"
                  viewBox="0 0 140 48"
                  className="opacity-80"
                >
                  <polyline
                    points="0,24 14,18 28,14 42,18 56,14 70,12 84,16 98,13 112,18 126,15 140,22"
                    fill="none"
                    stroke="rgba(0,229,255,0.5)"
                    strokeWidth="2.5"
                  />
                </svg>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-dim">
                  After
                </div>
              </div>
            </div>

            <div className="text-[12px] text-text-dim text-center">
              ノイズ{" "}
              <span className="text-red font-mono">
                -{result.noiseReductionDb}dB
              </span>{" "}
              低減
              <span className="mx-2">&middot;</span>
              明瞭度{" "}
              <span className="text-green font-mono">
                +{result.clarityImprovement}%
              </span>{" "}
              向上
            </div>
          </div>

          <BigButton icon={ArrowRight} onClick={onGoToEval}>
            アクセント評価を見る
          </BigButton>
        </div>
      )}
    </div>
  );
}

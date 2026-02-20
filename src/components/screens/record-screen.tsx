"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Waves,
  Volume2,
  Activity,
  Sparkles,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { BigButton } from "@/components/ui/big-button";
import { Waveform } from "@/components/waveform";
import { useTimer } from "@/hooks/use-timer";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

interface RecordScreenProps {
  onStartProcess: (buffer: AudioBuffer, blob: Blob) => void;
}

type NoiseStatus = "clean" | "warn" | "detect";

export function RecordScreen({ onStartProcess }: RecordScreenProps) {
  const {
    isRecording,
    audioBlob,
    audioBuffer,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();
  const { formatted, start: startTimer, stop: stopTimer, reset: resetTimer } =
    useTimer();
  const [hasRecording, setHasRecording] = useState(false);
  const [lipNoise, setLipNoise] = useState<NoiseStatus>("clean");
  const [bgNoise, setBgNoise] = useState<NoiseStatus>("clean");
  const [levelStatus, setLevelStatus] = useState<NoiseStatus>("clean");
  const noiseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      stopTimer();
      setHasRecording(true);
      if (noiseIntervalRef.current) {
        clearInterval(noiseIntervalRef.current);
        noiseIntervalRef.current = null;
      }
    } else {
      setHasRecording(false);
      resetRecording();
      resetTimer();
      await startRecording();
      startTimer();

      noiseIntervalRef.current = setInterval(() => {
        const r = Math.random();
        if (r < 0.12) {
          setLipNoise("detect");
          setTimeout(() => setLipNoise("clean"), 800);
        }
        if (r > 0.85) {
          setBgNoise("warn");
          setTimeout(() => setBgNoise("clean"), 1500);
        }
        if (r > 0.7 && r < 0.75) {
          setLevelStatus("warn");
          setTimeout(() => setLevelStatus("clean"), 1000);
        }
      }, 2000);
    }
  }, [
    isRecording,
    startRecording,
    stopRecording,
    startTimer,
    stopTimer,
    resetRecording,
    resetTimer,
  ]);

  const handleStartProcess = useCallback(() => {
    if (audioBuffer && audioBlob) {
      onStartProcess(audioBuffer, audioBlob);
    }
  }, [audioBuffer, audioBlob, onStartProcess]);

  const handleReset = useCallback(() => {
    setHasRecording(false);
    resetRecording();
    resetTimer();
    setLipNoise("clean");
    setBgNoise("clean");
    setLevelStatus("clean");
  }, [resetRecording, resetTimer]);

  useEffect(() => {
    return () => {
      if (noiseIntervalRef.current) {
        clearInterval(noiseIntervalRef.current);
      }
    };
  }, []);

  const noiseLabel = (status: NoiseStatus) => {
    switch (status) {
      case "clean":
        return "クリーン";
      case "warn":
        return "注意";
      case "detect":
        return "検出中!";
    }
  };

  const noiseDotClass = (status: NoiseStatus) => {
    switch (status) {
      case "clean":
        return "bg-green";
      case "warn":
        return "bg-amber animate-blink";
      case "detect":
        return "bg-red animate-blink-fast";
    }
  };

  const canProcess = hasRecording && audioBuffer !== null;

  return (
    <div className="animate-fade-in">
      <SectionTitle>今日のお題</SectionTitle>
      <div className="relative bg-bg2 border border-border rounded-xl p-4 mb-5 leading-8 text-[15px] font-light text-text-mid">
        <span className="absolute -top-2.5 left-3 bg-bg px-2 font-mono text-[10px] text-cyan tracking-[0.1em] uppercase">
          Script
        </span>
        <span className="text-amber">東京</span>
        の春は、
        <span className="text-amber">雨</span>
        と晴れが繰り返す季節です。
        <span className="text-amber">橋</span>
        の上から桜を眺めると、花びらが川面に舞い落ちていきます。
      </div>

      <Waveform isRecording={isRecording} analyserNode={analyserNode} />

      <div className="font-display text-4xl font-bold text-center tracking-[0.05em] mt-4 mb-2">
        <span className="text-cyan">{formatted}</span>
      </div>

      <div className="flex flex-col items-center mt-6 mb-5 gap-4">
        <div
          className={`w-[120px] h-[120px] rounded-full border-2 flex items-center justify-center relative cursor-pointer transition-all ${
            isRecording
              ? "border-red animate-pulse-ring"
              : "border-cyan/20 hover:border-cyan/40"
          }`}
          onClick={handleToggleRecord}
        >
          <div
            className={`w-[88px] h-[88px] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
              isRecording
                ? "bg-gradient-to-br from-red to-[#AA0033] shadow-[0_0_32px_rgba(255,77,109,0.4)]"
                : "bg-gradient-to-br from-cyan to-[#0088AA] shadow-[0_0_32px_rgba(0,229,255,0.3)]"
            }`}
          >
            {isRecording ? (
              <Square size={28} className="text-white" fill="white" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
          </div>
        </div>
        <span
          className={`font-mono text-[13px] tracking-[0.1em] uppercase ${
            isRecording
              ? "text-red animate-blink"
              : hasRecording
                ? "text-green"
                : "text-text-dim"
          }`}
        >
          {isRecording
            ? "REC"
            : hasRecording
              ? "録音完了"
              : "タップして録音開始"}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { icon: Waves, label: "リップノイズ", status: lipNoise },
          { icon: Volume2, label: "背景ノイズ", status: bgNoise },
          { icon: Activity, label: "音量レベル", status: levelStatus },
        ].map((badge) => (
          <div
            key={badge.label}
            className="flex-1 py-2 px-2.5 rounded-lg bg-bg2 border border-border font-mono text-[11px] text-center flex flex-col gap-1.5 items-center"
          >
            <div
              className={`w-2 h-2 rounded-full ${noiseDotClass(badge.status)}`}
            />
            <badge.icon size={14} className="text-text-mid" />
            <div className="text-text-dim text-[10px] tracking-[0.05em]">
              {noiseLabel(badge.status)}
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-border my-5" />

      {hasRecording && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <BigButton
            icon={Sparkles}
            onClick={handleStartProcess}
            className={canProcess ? "" : "opacity-50 pointer-events-none"}
          >
            {canProcess ? "AI処理を開始" : "音声を準備中..."}
          </BigButton>
          <BigButton
            icon={RotateCcw}
            variant="secondary"
            onClick={handleReset}
          >
            やり直す
          </BigButton>
        </div>
      )}
    </div>
  );
}

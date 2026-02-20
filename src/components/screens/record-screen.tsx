"use client";

import { useState, useCallback, useRef } from "react";
import { Mic, Square, RotateCcw, Sparkles, Upload, FileAudio, Waves, Volume2, Activity } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { BigButton } from "@/components/ui/big-button";
import { Waveform } from "@/components/waveform";
import { useTimer } from "@/hooks/use-timer";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useAudioMonitor, type NoiseStatus } from "@/hooks/use-audio-monitor";
import { blobToAudioBuffer } from "@/lib/audio-processor";

interface RecordScreenProps {
  onStartProcess: (buffer: AudioBuffer, blob: Blob) => void;
}

type InputMode = "idle" | "recording" | "recorded" | "imported";

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

  const monitor = useAudioMonitor(analyserNode, isRecording);

  const [mode, setMode] = useState<InputMode>("idle");
  const [importedBuffer, setImportedBuffer] = useState<AudioBuffer | null>(null);
  const [importedBlob, setImportedBlob] = useState<Blob | null>(null);
  const [importedName, setImportedName] = useState("");
  const [importError, setImportError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      stopTimer();
      setMode("recorded");
    } else {
      // Reset everything
      setMode("idle");
      setImportedBuffer(null);
      setImportedBlob(null);
      setImportedName("");
      setImportError("");
      resetRecording();
      resetTimer();
      await startRecording();
      startTimer();
      setMode("recording");
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

  const processFile = useCallback(async (file: File) => {
    setImportError("");

    const validTypes = [
      "audio/wav", "audio/wave", "audio/x-wav",
      "audio/mp3", "audio/mpeg",
      "audio/mp4", "audio/m4a", "audio/x-m4a",
      "audio/webm", "audio/ogg",
      "audio/aac", "audio/flac",
    ];

    // Check by extension as well since MIME types can be unreliable
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const validExts = ["wav", "mp3", "m4a", "mp4", "webm", "ogg", "aac", "flac"];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setImportError("対応していないファイル形式です");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setImportError("ファイルサイズは50MB以下にしてください");
      return;
    }

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type || `audio/${ext}` });
      const buffer = await blobToAudioBuffer(blob);
      setImportedBuffer(buffer);
      setImportedBlob(blob);
      setImportedName(file.name);
      setMode("imported");

      // Reset recorder state
      resetRecording();
      resetTimer();
    } catch {
      setImportError("音声ファイルの読み込みに失敗しました");
    }
  }, [resetRecording, resetTimer]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleStartProcess = useCallback(() => {
    if (mode === "imported" && importedBuffer && importedBlob) {
      onStartProcess(importedBuffer, importedBlob);
    } else if (mode === "recorded" && audioBuffer && audioBlob) {
      onStartProcess(audioBuffer, audioBlob);
    }
  }, [mode, importedBuffer, importedBlob, audioBuffer, audioBlob, onStartProcess]);

  const handleReset = useCallback(() => {
    setMode("idle");
    setImportedBuffer(null);
    setImportedBlob(null);
    setImportedName("");
    setImportError("");
    resetRecording();
    resetTimer();
  }, [resetRecording, resetTimer]);

  const canProcess =
    (mode === "recorded" && audioBuffer !== null) ||
    (mode === "imported" && importedBuffer !== null);

  const currentBuffer = mode === "imported" ? importedBuffer : audioBuffer;
  const durationLabel = currentBuffer
    ? `${String(Math.floor(currentBuffer.duration / 60)).padStart(2, "0")}:${String(Math.round(currentBuffer.duration % 60)).padStart(2, "0")}`
    : null;

  return (
    <div className="animate-fade-in">
      <SectionTitle>読み上げテキスト</SectionTitle>
      <div className="relative bg-bg2 border border-border rounded-2xl p-5 mb-6 leading-[1.9] text-[15px] font-light text-text-mid">
        <span className="absolute -top-2.5 left-3 bg-bg px-2 font-mono text-[10px] text-cyan tracking-[0.1em] uppercase">
          Script
        </span>
        <span className="text-amber font-normal">東京</span>
        の春は、
        <span className="text-amber font-normal">雨</span>
        と晴れが繰り返す季節です。
        <span className="text-amber font-normal">橋</span>
        の上から桜を眺めると、花びらが川面に舞い落ちていきます。
      </div>

      {/* Waveform or import area */}
      {mode === "imported" ? (
        <div className="w-full h-[100px] rounded-2xl bg-bg2 border border-border flex flex-col items-center justify-center gap-2">
          <FileAudio size={24} className="text-cyan" />
          <div className="font-mono text-[12px] text-text-mid truncate max-w-[80%] text-center">
            {importedName}
          </div>
          {durationLabel && (
            <div className="font-mono text-[11px] text-text-dim">
              {durationLabel}
            </div>
          )}
        </div>
      ) : (
        <Waveform isRecording={isRecording} analyserNode={analyserNode} />
      )}

      {/* Timer (recording mode) */}
      {mode !== "imported" && (
        <div className="font-display text-4xl font-bold text-center tracking-[0.05em] mt-5 mb-3">
          <span className="text-cyan">{formatted}</span>
        </div>
      )}

      {/* Record button */}
      {mode !== "imported" && (
        <div className="flex flex-col items-center mt-6 mb-4 gap-5">
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
                : mode === "recorded"
                  ? "text-green"
                  : "text-text-dim"
            }`}
          >
            {isRecording
              ? "REC"
              : mode === "recorded"
                ? "録音完了"
                : "タップして録音開始"}
          </span>
        </div>
      )}

      {/* Real-time noise indicators - visible during recording */}
      {isRecording && (
        <div className="flex gap-2 mb-4 animate-fade-in">
          {([
            { icon: Activity, label: "リップノイズ", status: monitor.spikeStatus },
            { icon: Waves, label: "背景ノイズ", status: monitor.bgNoiseStatus },
            { icon: Volume2, label: "音量レベル", status: monitor.levelStatus },
          ] as { icon: typeof Activity; label: string; status: NoiseStatus }[]).map((badge) => (
            <div
              key={badge.label}
              className="flex-1 py-2.5 px-2 rounded-xl bg-bg2 border border-border font-mono text-[11px] text-center flex flex-col gap-1.5 items-center"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  badge.status === "clean"
                    ? "bg-green"
                    : badge.status === "warn"
                      ? "bg-amber animate-blink"
                      : "bg-red animate-blink-fast"
                }`}
              />
              <badge.icon size={14} className="text-text-mid" />
              <div className="text-text-dim text-[10px] tracking-[0.05em]">
                {badge.status === "clean"
                  ? "クリーン"
                  : badge.status === "warn"
                    ? "注意"
                    : "検出中!"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Level meter during recording */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[9px] text-text-dim w-8 text-right">
            {Math.round(monitor.levelDb)}dB
          </span>
          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                monitor.levelDb > -3
                  ? "bg-red"
                  : monitor.levelDb > -12
                    ? "bg-amber"
                    : monitor.levelDb > -40
                      ? "bg-green"
                      : "bg-text-dim"
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (monitor.levelDb + 60) * (100 / 60)))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* File import drop zone */}
      {mode === "idle" && !isRecording && (
        <>
          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-border" />
            <span className="font-mono text-[10px] text-text-dim uppercase tracking-[0.15em]">
              or
            </span>
            <span className="flex-1 h-px bg-border" />
          </div>

          <div
            className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-cyan/50 bg-cyan/5"
                : "border-border hover:border-cyan/30"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload size={24} className="mx-auto mb-3 text-text-dim" />
            <div className="text-[13px] text-text-mid mb-1">
              音声ファイルをドロップ、またはタップして選択
            </div>
            <div className="font-mono text-[10px] text-text-dim">
              WAV / MP3 / M4A / WebM / OGG / FLAC (50MBまで)
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.mp4,.webm,.ogg,.aac,.flac"
            className="hidden"
            onChange={handleFileSelect}
          />

          {importError && (
            <div className="mt-3 text-center text-[12px] text-red font-mono">
              {importError}
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      {(mode === "recorded" || mode === "imported") && (
        <div className="flex flex-col gap-3 mt-6 animate-fade-in">
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

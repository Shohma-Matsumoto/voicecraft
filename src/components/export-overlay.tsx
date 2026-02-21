"use client";

import { useState, useMemo, useCallback } from "react";
import { Download, X, FileAudio, Share2, Check } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { BigButton } from "@/components/ui/big-button";
import {
  exportAudio,
  estimateFileSize,
  type ExportFormat,
  type ExportQuality,
} from "@/lib/audio-exporter";

interface ExportOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  processedBuffer: AudioBuffer | null;
}

const formats: { label: string; value: ExportFormat }[] = [
  { label: "WAV", value: "wav" },
  { label: "WebM", value: "webm" },
];

const qualities: {
  label: string;
  detail: string;
  value: ExportQuality;
}[] = [
  { label: "SNS用", detail: "64kbps", value: "low" },
  { label: "標準", detail: "128kbps", value: "standard" },
  { label: "高品質", detail: "192kbps / 非圧縮", value: "high" },
];

export function ExportOverlay({
  isOpen,
  onClose,
  processedBuffer,
}: ExportOverlayProps) {
  const [selectedFormat, setSelectedFormat] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const fileSizeKb = useMemo(() => {
    if (!processedBuffer) return 0;
    return estimateFileSize(
      processedBuffer,
      formats[selectedFormat].value,
      qualities[selectedQuality].value,
    );
  }, [processedBuffer, selectedFormat, selectedQuality]);

  const fileSizeLabel = useMemo(() => {
    if (fileSizeKb === 0) return "--";
    if (fileSizeKb > 1024) return `${(fileSizeKb / 1024).toFixed(1)} MB`;
    return `${fileSizeKb} KB`;
  }, [fileSizeKb]);

  const handleExport = useCallback(async () => {
    if (!processedBuffer || isExporting) return;
    setIsExporting(true);
    setExported(false);
    try {
      const fmt = formats[selectedFormat].value;
      const quality = qualities[selectedQuality].value;
      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[:-]/g, "");
      await exportAudio(processedBuffer, fmt, quality, `voicecraft-${timestamp}`);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [processedBuffer, selectedFormat, selectedQuality, isExporting]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-bg/95 z-[200] flex flex-col animate-slide-up">
      <div className="flex items-center justify-between px-6 pt-10 pb-7">
        <h2 className="font-display text-lg font-bold text-text">
          エクスポート
        </h2>
        <button
          className="w-8 h-8 rounded-lg bg-bg2 border border-border flex items-center justify-center cursor-pointer hover:border-red/30 transition-colors"
          onClick={onClose}
        >
          <X size={16} className="text-text-dim" />
        </button>
      </div>

      <div className="px-6 flex-1">
        <SectionTitle>フォーマット</SectionTitle>
        <div className="flex gap-2.5 mb-7">
          {formats.map((fmt, i) => (
            <button
              key={fmt.value}
              className={`flex-1 py-3.5 rounded-xl border font-mono text-[12px] tracking-[0.08em] uppercase cursor-pointer transition-all flex flex-col items-center gap-2 ${
                selectedFormat === i
                  ? "bg-cyan-dim border-cyan/30 text-cyan"
                  : "bg-bg2 border-border text-text-dim hover:border-white/10"
              }`}
              onClick={() => setSelectedFormat(i)}
            >
              <FileAudio size={18} />
              {fmt.label}
            </button>
          ))}
        </div>

        <SectionTitle>品質</SectionTitle>
        <div className="flex flex-col gap-2.5 mb-8">
          {qualities.map((q, i) => (
            <button
              key={q.value}
              className={`w-full py-3.5 px-5 rounded-xl border font-mono text-[13px] cursor-pointer transition-all flex items-center justify-between ${
                selectedQuality === i
                  ? i === 0
                    ? "bg-amber-dim border-amber/30 text-amber"
                    : "bg-cyan-dim border-cyan/30 text-cyan"
                  : "bg-bg2 border-border text-text-dim hover:border-white/10"
              }`}
              onClick={() => setSelectedQuality(i)}
            >
              <span>{q.label}</span>
              <span className="text-[11px] opacity-60">{q.detail}</span>
            </button>
          ))}
        </div>

        {/* File info */}
        <div className="text-center text-[12px] text-text-dim mb-7 font-mono">
          推定ファイルサイズ: <span className="text-cyan">{fileSizeLabel}</span>
          {processedBuffer && (
            <>
              <span className="mx-2">&middot;</span>
              {processedBuffer.duration.toFixed(1)}秒
            </>
          )}
        </div>

        <BigButton
          icon={exported ? Check : Download}
          onClick={handleExport}
          className={!processedBuffer ? "opacity-50 pointer-events-none" : ""}
        >
          {isExporting
            ? "エクスポート中..."
            : exported
              ? "ダウンロード完了!"
              : "ダウンロード"}
        </BigButton>
        <div className="mt-3.5">
          <BigButton icon={Share2} variant="secondary" onClick={onClose}>
            閉じる
          </BigButton>
        </div>
      </div>
    </div>
  );
}

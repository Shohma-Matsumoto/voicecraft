"use client";

import { useState, useCallback, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ExportOverlay } from "@/components/export-overlay";
import { RecordScreen } from "@/components/screens/record-screen";
import { ProcessScreen } from "@/components/screens/process-screen";
import { EvalScreen } from "@/components/screens/eval-screen";
import { HistoryScreen } from "@/components/screens/history-screen";
import type { TabId } from "@/lib/constants";
import type { ProcessingResult } from "@/lib/audio-processor";
import type { AnalysisResult } from "@/lib/audio-analyzer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("record");
  const [showExport, setShowExport] = useState(false);

  // Audio data flow: record → process → eval → export
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [processStarted, setProcessStarted] = useState(false);

  // Track history of sessions
  const historyRef = useRef<
    {
      id: string;
      title: string;
      date: string;
      duration: string;
      score: number;
    }[]
  >([]);

  const handleStartProcess = useCallback(
    (buffer: AudioBuffer, blob: Blob) => {
      setOriginalBuffer(buffer);
      setOriginalBlob(blob);
      setProcessingResult(null);
      setAnalysisResult(null);
      setProcessStarted(true);
      setActiveTab("process");
    },
    [],
  );

  const handleProcessComplete = useCallback(
    (result: ProcessingResult, analysis: AnalysisResult) => {
      setProcessingResult(result);
      setAnalysisResult(analysis);

      // Add to history
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
      const dur = result.processedBuffer.duration;
      const durStr = `${String(Math.floor(dur / 60)).padStart(2, "0")}:${String(Math.round(dur % 60)).padStart(2, "0")}`;

      historyRef.current = [
        {
          id: String(Date.now()),
          title: `録音 ${historyRef.current.length + 1}`,
          date: dateStr,
          duration: durStr,
          score: analysis.overallScore,
        },
        ...historyRef.current,
      ].slice(0, 20);
    },
    [],
  );

  const handleGoToEval = useCallback(() => {
    setActiveTab("eval");
  }, []);

  const handleExport = useCallback(() => {
    setShowExport(true);
  }, []);

  const handleSelectHistoryItem = useCallback(() => {
    setActiveTab("eval");
  }, []);

  return (
    <>
      {/* Desktop banner */}
      <div className="hidden sm:block w-full max-w-[800px] text-center pt-10 pb-6 px-6">
        <h1 className="font-display text-[28px] text-cyan tracking-[0.05em] mb-2">
          VoiceCraft
        </h1>
        <p className="text-text-mid text-[13px]">
          素人でも、プロ品質の音声がサクッと作れる
        </p>
      </div>

      {/* Phone frame */}
      <div className="w-full max-w-[390px] min-h-screen sm:min-h-[844px] bg-bg relative overflow-hidden sm:border-x sm:border-border noise-overlay">
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-3.5 pb-1.5 font-mono text-[11px] text-text-mid tracking-[0.05em]">
          <span>9:41</span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-2.5 bg-text-mid/60 rounded-sm" />
              <span className="w-1 h-3 bg-text-mid/60 rounded-sm" />
              <span className="w-1 h-3.5 bg-text-mid/60 rounded-sm" />
              <span className="w-1 h-2 bg-text-mid/30 rounded-sm" />
            </span>
            <span className="ml-1">WiFi</span>
            <span className="ml-1 inline-flex items-center gap-px">
              <span className="w-5 h-2 border border-text-mid/40 rounded-sm relative">
                <span
                  className="absolute inset-0.5 bg-green/60 rounded-sm"
                  style={{ width: "70%" }}
                />
              </span>
            </span>
          </span>
        </div>

        <AppHeader />

        {/* Screens */}
        <div className="px-6 pb-24">
          {activeTab === "record" && (
            <RecordScreen onStartProcess={handleStartProcess} />
          )}
          {activeTab === "process" && (
            <ProcessScreen
              originalBuffer={originalBuffer}
              originalBlob={originalBlob}
              isActive={activeTab === "process" && processStarted}
              onGoToEval={handleGoToEval}
              onProcessComplete={handleProcessComplete}
            />
          )}
          {activeTab === "eval" && (
            <EvalScreen
              analysisResult={analysisResult}
              onExport={handleExport}
            />
          )}
          {activeTab === "history" && (
            <HistoryScreen
              dynamicHistory={historyRef.current}
              onSelectItem={handleSelectHistoryItem}
            />
          )}
        </div>

        {/* Export overlay */}
        <ExportOverlay
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          processedBuffer={processingResult?.processedBuffer ?? null}
        />

        {/* Bottom nav */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </>
  );
}

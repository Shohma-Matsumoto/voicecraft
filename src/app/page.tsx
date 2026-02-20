"use client";

import { useState, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ExportOverlay } from "@/components/export-overlay";
import { RecordScreen } from "@/components/screens/record-screen";
import { ProcessScreen } from "@/components/screens/process-screen";
import { EvalScreen } from "@/components/screens/eval-screen";
import { HistoryScreen } from "@/components/screens/history-screen";
import { useHistory } from "@/hooks/use-history";
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

  // Persisted history
  const history = useHistory();

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

      // Add to persisted history
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
      const dur = result.processedBuffer.duration;
      const durStr = `${String(Math.floor(dur / 60)).padStart(2, "0")}:${String(Math.round(dur % 60)).padStart(2, "0")}`;

      history.addItem({
        title: `録音 ${history.items.length + 1}`,
        date: dateStr,
        duration: durStr,
        score: analysis.overallScore,
      });
    },
    [history],
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

      {/* App frame */}
      <div className="w-full max-w-[390px] min-h-screen sm:min-h-[844px] bg-bg relative overflow-hidden sm:border-x sm:border-border noise-overlay">
        <AppHeader />

        {/* Screens */}
        <div className="px-5 pb-28">
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
              dynamicHistory={history.items}
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

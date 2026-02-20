"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type NoiseStatus = "clean" | "warn" | "detect";

export interface AudioMonitorState {
  /** RMS level in dBFS (-100 to 0) */
  levelDb: number;
  /** Level status: too quiet / good / too loud */
  levelStatus: NoiseStatus;
  /** Background noise status based on spectral flatness */
  bgNoiseStatus: NoiseStatus;
  /** Transient spike detection (lip noise / pops) */
  spikeStatus: NoiseStatus;
}

const INITIAL_STATE: AudioMonitorState = {
  levelDb: -100,
  levelStatus: "clean",
  bgNoiseStatus: "clean",
  spikeStatus: "clean",
};

/**
 * Monitors an AnalyserNode in real-time during recording.
 * Provides actual measurements rather than random simulation.
 */
export function useAudioMonitor(
  analyserNode: AnalyserNode | null,
  isRecording: boolean,
) {
  const [state, setState] = useState<AudioMonitorState>(INITIAL_STATE);
  const frameRef = useRef<number>(0);
  const prevRmsRef = useRef<number>(0);
  const spikeTimerRef = useRef<number>(0);

  const analyze = useCallback(() => {
    if (!analyserNode || !isRecording) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const timeDomain = new Uint8Array(bufferLength);
    const frequency = new Uint8Array(bufferLength);
    analyserNode.getByteTimeDomainData(timeDomain);
    analyserNode.getByteFrequencyData(frequency);

    // --- RMS Level (dBFS) ---
    let sumSq = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = (timeDomain[i] - 128) / 128;
      sumSq += sample * sample;
    }
    const rms = Math.sqrt(sumSq / bufferLength);
    const levelDb = 20 * Math.log10(Math.max(rms, 1e-10));

    let levelStatus: NoiseStatus = "clean";
    if (levelDb > -3) {
      levelStatus = "detect"; // clipping danger
    } else if (levelDb < -40) {
      levelStatus = "warn"; // too quiet
    }

    // --- Background Noise (spectral flatness approximation) ---
    // High spectral flatness = noise-like (flat spectrum)
    // Low spectral flatness = tonal/speech-like
    let logSum = 0;
    let linSum = 0;
    let count = 0;
    for (let i = 1; i < bufferLength; i++) {
      const val = frequency[i];
      if (val > 0) {
        logSum += Math.log(val);
        linSum += val;
        count++;
      }
    }
    const geoMean = count > 0 ? Math.exp(logSum / count) : 0;
    const ariMean = count > 0 ? linSum / count : 1;
    const flatness = ariMean > 0 ? geoMean / ariMean : 0;

    let bgNoiseStatus: NoiseStatus = "clean";
    if (flatness > 0.7) {
      bgNoiseStatus = "detect"; // very noise-like spectrum
    } else if (flatness > 0.45) {
      bgNoiseStatus = "warn";
    }

    // --- Transient / Spike Detection (lip noise, pops) ---
    // Detect sudden RMS jumps compared to previous frame
    const rmsJump = Math.abs(rms - prevRmsRef.current);
    let spikeStatus: NoiseStatus = "clean";

    if (rmsJump > 0.15) {
      spikeStatus = "detect";
      spikeTimerRef.current = 8; // hold for ~8 frames
    } else if (rmsJump > 0.08) {
      spikeStatus = "warn";
      spikeTimerRef.current = 5;
    } else if (spikeTimerRef.current > 0) {
      // Hold the previous spike status for a few frames
      spikeTimerRef.current--;
      spikeStatus = spikeTimerRef.current > 3 ? "detect" : "warn";
    }

    prevRmsRef.current = rms;

    setState({ levelDb, levelStatus, bgNoiseStatus, spikeStatus });

    frameRef.current = requestAnimationFrame(analyze);
  }, [analyserNode, isRecording]);

  useEffect(() => {
    if (isRecording && analyserNode) {
      prevRmsRef.current = 0;
      spikeTimerRef.current = 0;
      frameRef.current = requestAnimationFrame(analyze);
    } else {
      setState(INITIAL_STATE);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isRecording, analyserNode, analyze]);

  return state;
}

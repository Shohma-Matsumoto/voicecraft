"use client";

import { useRef, useEffect, useCallback } from "react";

interface WaveformProps {
  isRecording: boolean;
  analyserNode: AnalyserNode | null;
}

export function Waveform({ isRecording, analyserNode }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<number[]>([]);
  const frameRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const mid = h / 2;

    ctx.clearRect(0, 0, w, h);

    if (!isRecording) {
      // Idle: subtle breathing sine wave
      frameRef.current += 0.02;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y =
          mid +
          Math.sin(x * 0.02 + frameRef.current) * 2 +
          Math.sin(x * 0.01 + frameRef.current * 0.5) * 1;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(0,229,255,0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // Recording: real audio data or simulated
    const points = pointsRef.current;
    if (points.length > 80) points.shift();

    if (analyserNode) {
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteTimeDomainData(dataArray);
      const avg =
        dataArray.reduce((sum, val) => sum + Math.abs(val - 128), 0) /
        dataArray.length;
      points.push(
        (avg / 128) * h * 0.8 * (Math.random() > 0.5 ? 1 : -1) +
          Math.sin(frameRef.current * 0.1) * 10
      );
    } else {
      points.push(
        (Math.random() - 0.5) * 80 + Math.sin(frameRef.current * 0.1) * 20
      );
    }
    frameRef.current++;

    // Wave gradient
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(0,229,255,0)");
    grad.addColorStop(0.3, "rgba(0,229,255,0.6)");
    grad.addColorStop(0.5, "rgba(0,229,255,0.9)");
    grad.addColorStop(0.7, "rgba(0,229,255,0.6)");
    grad.addColorStop(1, "rgba(0,229,255,0)");

    ctx.beginPath();
    ctx.moveTo(0, mid);
    points.forEach((p, i) => {
      const x = (i / 80) * w;
      ctx.lineTo(x, mid + p);
    });
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill under wave
    ctx.lineTo(((points.length - 1) / 80) * w, mid);
    ctx.lineTo(0, mid);
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, "rgba(0,229,255,0.06)");
    fillGrad.addColorStop(1, "rgba(0,229,255,0)");
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Mirror wave (below)
    ctx.beginPath();
    ctx.moveTo(0, mid);
    points.forEach((p, i) => {
      const x = (i / 80) * w;
      ctx.lineTo(x, mid - p * 0.4);
    });
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;

    animFrameRef.current = requestAnimationFrame(draw);
  }, [isRecording, analyserNode]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[100px] rounded-2xl bg-bg2 border border-border"
      style={{ display: "block" }}
    />
  );
}

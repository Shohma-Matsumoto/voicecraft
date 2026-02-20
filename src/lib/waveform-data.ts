/**
 * Generate downsampled waveform peak data from an AudioBuffer.
 * Returns an array of peak values (-1 to 1) suitable for SVG rendering.
 */
export function getWaveformPeaks(
  buffer: AudioBuffer,
  targetPoints: number = 80,
): number[] {
  const data = buffer.getChannelData(0);
  const blockSize = Math.floor(data.length / targetPoints);
  const peaks: number[] = [];

  for (let i = 0; i < targetPoints; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, data.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(data[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  // Normalize to 0-1 range
  const maxPeak = Math.max(...peaks, 0.01);
  return peaks.map((p) => p / maxPeak);
}

/**
 * Convert peaks to SVG polyline points string.
 * Renders as a centered waveform (bars going up and down from middle).
 */
export function peaksToSvgPath(
  peaks: number[],
  width: number,
  height: number,
): string {
  const mid = height / 2;
  const step = width / peaks.length;

  let d = "";
  for (let i = 0; i < peaks.length; i++) {
    const x = i * step + step / 2;
    const amp = peaks[i] * mid * 0.85;
    // Draw a vertical line for each sample
    d += `M${x},${mid - amp} L${x},${mid + amp} `;
  }
  return d;
}

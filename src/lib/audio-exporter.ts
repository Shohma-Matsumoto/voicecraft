/**
 * Client-side audio export.
 * Converts AudioBuffer → WAV Blob and triggers browser download.
 * No server needed.
 */

/** Encode an AudioBuffer into a WAV Blob (PCM 16-bit). */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  // Interleave channels
  const length = buffer.length * numChannels;
  const interleaved = new Float32Array(length);

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < buffer.length; i++) {
      interleaved[i * numChannels + ch] = channelData[i];
    }
  }

  // Convert to 16-bit PCM
  const dataLength = length * (bitsPerSample / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Re-encode AudioBuffer to WebM via MediaRecorder (for M4A-ish output). */
export async function audioBufferToWebm(
  buffer: AudioBuffer,
): Promise<Blob> {
  const ctx = new AudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const dest = ctx.createMediaStreamDestination();
  source.connect(dest);

  const recorder = new MediaRecorder(dest.stream, {
    mimeType: getSupportedMimeType(),
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      ctx.close();
      resolve(new Blob(chunks, { type: recorder.mimeType }));
    };
    recorder.start();
    source.start();
    // Stop after buffer duration + small margin
    setTimeout(
      () => {
        recorder.stop();
      },
      (buffer.duration + 0.1) * 1000,
    );
  });
}

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "audio/webm";
}

export type ExportFormat = "wav" | "mp3" | "m4a";
export type ExportQuality = "low" | "standard" | "high";

/** Estimate file size in KB. */
export function estimateFileSize(
  buffer: AudioBuffer,
  format: ExportFormat,
  quality: ExportQuality,
): number {
  const durationSec = buffer.duration;
  const sampleRate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;

  if (format === "wav") {
    // PCM 16-bit
    return Math.round((sampleRate * channels * 2 * durationSec) / 1024);
  }

  // Compressed formats — estimate by bitrate
  const bitrates: Record<ExportQuality, number> = {
    low: 128,
    standard: 256,
    high: 320,
  };
  const kbps = bitrates[quality];
  return Math.round((kbps * durationSec) / 8);
}

/** Get file extension. */
export function getExtension(format: ExportFormat): string {
  switch (format) {
    case "wav":
      return "wav";
    case "mp3":
      return "webm"; // We encode as WebM since no MP3 encoder in browser
    case "m4a":
      return "webm";
  }
}

/** Trigger a file download in the browser. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Main export function. */
export async function exportAudio(
  buffer: AudioBuffer,
  format: ExportFormat,
  _quality: ExportQuality,
  filename: string = "voicecraft-export",
): Promise<void> {
  let blob: Blob;
  let ext: string;

  if (format === "wav") {
    blob = audioBufferToWav(buffer);
    ext = "wav";
  } else {
    // MP3 and M4A are exported as WebM (browser-native encoding)
    blob = await audioBufferToWebm(buffer);
    ext = "webm";
  }

  downloadBlob(blob, `${filename}.${ext}`);
}

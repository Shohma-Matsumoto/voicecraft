/**
 * Client-side speech analysis using YIN pitch tracking + audio features.
 * Measures real acoustic properties: F0 contour, energy, pitch patterns.
 * No server or API keys required — runs entirely in the browser.
 *
 * Pitch detection uses the YIN autocorrelation algorithm.
 * Accent evaluation compares measured pitch patterns against
 * standard Japanese accent dictionaries.
 */

export interface EvalItem {
  word: string;
  status: "correct" | "warning" | "error";
  pitchNote: string;
  description: string;
  tip?: string;
}

export interface AnalysisResult {
  /** Overall score 0-100 */
  overallScore: number;
  /** Reference text used for evaluation */
  transcript: string;
  /** Per-word accent evaluation */
  evalItems: EvalItem[];
  /** Detailed metric scores */
  metrics: {
    accent: number;
    speechRate: number;
    intonation: number;
    clarity: number;
  };
  /** Characters per minute */
  wpm: number;
  /** Number of improvement points */
  improvementCount: number;
  /** Summary label */
  label: string;
}

/** Expected text for the current challenge script. */
const EXPECTED_TEXT =
  "東京の春は雨と晴れが繰り返す季節です橋の上から桜を眺めると花びらが川面に舞い落ちていきます";

/** Total morae in EXPECTED_TEXT. */
const TOTAL_MORAE = 58;

/**
 * Accent dictionary with real mora positions in the expected text.
 * Mora positions counted from reading:
 * と(0) う(1) きょ(2) う(3) の(4) は(5) る(6) は(7) あ(8) め(9)
 * と(10) は(11) れ(12) が(13) く(14) り(15) か(16) え(17) す(18)
 * き(19) せ(20) つ(21) で(22) す(23) は(24) し(25) の(26)
 * う(27) え(28) か(29) ら(30) さ(31) く(32) ら(33) を(34)
 * な(35) が(36) め(37) る(38) と(39) は(40) な(41) び(42) ら(43)
 * が(44) か(45) わ(46) も(47) に(48) ま(49) い(50) お(51)
 * ち(52) て(53) い(54) き(55) ま(56) す(57)
 */
const ACCENT_DICT: Record<
  string,
  {
    pattern: string;
    moraCount: number;
    moraStart: number;
    wrongDesc: string;
    tip: string;
  }
> = {
  東京: {
    pattern: "LHHL",
    moraCount: 4,
    moraStart: 0,
    wrongDesc: "アクセントが不自然です",
    tip: "「とう」を低く、「きょ」を高く、「う」で下げます",
  },
  春: {
    pattern: "LH",
    moraCount: 2,
    moraStart: 5,
    wrongDesc: "アクセントが弱いです",
    tip: "「は」を低く、「る」を高く発音しましょう",
  },
  雨: {
    pattern: "LH",
    moraCount: 2,
    moraStart: 8,
    wrongDesc: "平板型になっています",
    tip: "「飴（あめ）」と区別するためにも、1音目を低く2音目を高く発音します",
  },
  橋: {
    pattern: "LH",
    moraCount: 2,
    moraStart: 24,
    wrongDesc: "アクセント不明確",
    tip: "橋＝最初の音を低く。箸＝最初の音を高く。で覚えましょう",
  },
  桜: {
    pattern: "LHH",
    moraCount: 3,
    moraStart: 31,
    wrongDesc: "抑揚が足りません",
    tip: "「さ」を低く、「くら」を高く保ちましょう",
  },
};

// ────────────────────────────────────────────────
// Pitch Detection — YIN autocorrelation algorithm
// ────────────────────────────────────────────────

/**
 * YIN pitch detection for a single audio frame.
 * Returns fundamental frequency in Hz, or 0 if the frame is unvoiced.
 *
 * Reference: de Cheveigné & Kawahara (2002) "YIN, a fundamental
 * frequency estimator for speech and music"
 */
function yinPitch(
  frame: Float32Array,
  sampleRate: number,
  threshold: number = 0.15,
): number {
  const halfLen = Math.floor(frame.length / 2);
  // Human voice F0 range: 80–500 Hz
  const minPeriod = Math.floor(sampleRate / 500);
  const maxPeriod = Math.min(halfLen - 1, Math.ceil(sampleRate / 80));

  if (maxPeriod <= minPeriod) return 0;

  // Step 1: Difference function
  const diff = new Float32Array(maxPeriod + 1);
  for (let tau = 1; tau <= maxPeriod; tau++) {
    let sum = 0;
    for (let i = 0; i < halfLen; i++) {
      const d = frame[i] - frame[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Step 2: Cumulative mean normalized difference function (CMNDF)
  const cmndf = new Float32Array(maxPeriod + 1);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxPeriod; tau++) {
    runningSum += diff[tau];
    cmndf[tau] = runningSum > 0 ? (diff[tau] * tau) / runningSum : 1;
  }

  // Step 3: Absolute threshold — find first dip below threshold in voice range
  let tauEstimate = -1;
  for (let tau = minPeriod; tau <= maxPeriod; tau++) {
    if (cmndf[tau] < threshold) {
      // Walk to local minimum
      while (tau + 1 <= maxPeriod && cmndf[tau + 1] < cmndf[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate <= 0) return 0; // unvoiced

  // Step 4: Parabolic interpolation for sub-sample accuracy
  if (tauEstimate > 1 && tauEstimate < maxPeriod) {
    const s0 = cmndf[tauEstimate - 1];
    const s1 = cmndf[tauEstimate];
    const s2 = cmndf[tauEstimate + 1];
    const denom = 2 * (s0 - 2 * s1 + s2);
    if (Math.abs(denom) > 1e-10) {
      const betterTau = tauEstimate + (s0 - s2) / denom;
      if (betterTau > 0) return sampleRate / betterTau;
    }
  }

  return sampleRate / tauEstimate;
}

/**
 * Extract pitch contour from an AudioBuffer.
 * Yields between batches to keep the UI responsive.
 *
 * @returns Array of F0 values (Hz) per frame. 0 = unvoiced.
 */
async function extractPitchContour(
  buffer: AudioBuffer,
  frameSize: number = 2048,
  hopSize: number = 512,
): Promise<{ pitches: number[]; hopDuration: number }> {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const pitches: number[] = [];
  const batchSize = 50;
  let count = 0;

  for (let start = 0; start + frameSize < data.length; start += hopSize) {
    const frame = data.subarray(start, start + frameSize);
    pitches.push(yinPitch(frame, sampleRate));

    count++;
    if (count % batchSize === 0) {
      // Yield to keep UI/spinner alive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return { pitches, hopDuration: hopSize / sampleRate };
}

// ────────────────────────────────────────────────
// Mora-level pitch analysis
// ────────────────────────────────────────────────

/**
 * Estimate median pitch per mora by dividing the audio into
 * equal-duration slots corresponding to the expected morae count.
 */
function getMedianPitchPerMora(
  pitches: number[],
  hopDuration: number,
  audioDuration: number,
  totalMorae: number,
): number[] {
  const moraDuration = audioDuration / totalMorae;
  const moraPitches: number[] = [];

  for (let m = 0; m < totalMorae; m++) {
    const startTime = m * moraDuration;
    const endTime = (m + 1) * moraDuration;
    const startFrame = Math.floor(startTime / hopDuration);
    const endFrame = Math.min(
      Math.ceil(endTime / hopDuration),
      pitches.length,
    );

    // Collect voiced pitches in this mora slot
    const voiced: number[] = [];
    for (let f = startFrame; f < endFrame; f++) {
      if (pitches[f] > 0) {
        voiced.push(pitches[f]);
      }
    }

    if (voiced.length > 0) {
      voiced.sort((a, b) => a - b);
      moraPitches.push(voiced[Math.floor(voiced.length / 2)]); // median
    } else {
      moraPitches.push(0); // unvoiced
    }
  }

  return moraPitches;
}

/**
 * Convert an array of pitch values to an H/L pattern string.
 * Uses the word-internal median as the boundary between High and Low.
 * Unvoiced morae (0) are interpolated from neighbours when possible.
 */
function pitchesToPattern(pitches: number[]): string {
  if (pitches.length === 0) return "";
  if (pitches.length === 1) return pitches[0] > 0 ? "H" : "L";

  // Interpolate unvoiced morae from neighbours
  const interp = [...pitches];
  for (let i = 0; i < interp.length; i++) {
    if (interp[i] === 0) {
      let prev = 0;
      let next = 0;
      for (let j = i - 1; j >= 0; j--) {
        if (interp[j] > 0) {
          prev = interp[j];
          break;
        }
      }
      for (let j = i + 1; j < interp.length; j++) {
        if (interp[j] > 0) {
          next = interp[j];
          break;
        }
      }
      interp[i] =
        prev > 0 && next > 0 ? (prev + next) / 2 : prev || next;
    }
  }

  const voiced = interp.filter((p) => p > 0);
  if (voiced.length === 0) return pitches.map(() => "L").join("");

  voiced.sort((a, b) => a - b);
  const median = voiced[Math.floor(voiced.length / 2)];

  return interp.map((p) => (p > 0 && p >= median ? "H" : "L")).join("");
}

/** Compare two same-length accent patterns. Returns 0–1 match ratio. */
function comparePatterns(actual: string, expected: string): number {
  if (actual.length !== expected.length) return 0;
  let match = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] === expected[i]) match++;
  }
  return match / actual.length;
}

// ────────────────────────────────────────────────
// Main analysis entry point
// ────────────────────────────────────────────────

/**
 * Analyze the processed audio and produce an evaluation result.
 * All measurements are derived from real acoustic features.
 */
export async function analyzeAudio(
  processedBuffer: AudioBuffer,
): Promise<AnalysisResult> {
  const duration = processedBuffer.duration;

  // 1. Extract pitch contour (YIN)
  const { pitches, hopDuration } = await extractPitchContour(processedBuffer);

  // 2. Estimate median pitch per mora
  const moraPitches = getMedianPitchPerMora(
    pitches,
    hopDuration,
    duration,
    TOTAL_MORAE,
  );

  // 3. Per-word accent evaluation
  const evalItems: EvalItem[] = [];
  const accentWords = Object.keys(ACCENT_DICT);
  const wordMatchRatios: number[] = [];

  for (const word of accentWords) {
    const dict = ACCENT_DICT[word];
    const wordPitches = moraPitches.slice(
      dict.moraStart,
      dict.moraStart + dict.moraCount,
    );

    const voicedCount = wordPitches.filter((p) => p > 0).length;
    if (voicedCount < dict.moraCount * 0.5) {
      // Not enough voiced data for reliable evaluation
      evalItems.push({
        word,
        status: "warning",
        pitchNote: "検出不足",
        description: `「${word}」の発声が不明瞭です。はっきりと発音してみましょう。`,
        tip: dict.tip,
      });
      wordMatchRatios.push(0.5); // neutral score for insufficient data
      continue;
    }

    const actualPattern = pitchesToPattern(wordPitches);
    const matchRatio = comparePatterns(actualPattern, dict.pattern);
    wordMatchRatios.push(matchRatio);

    if (matchRatio >= 0.75) {
      evalItems.push({
        word,
        status: "correct",
        pitchNote: `${dict.pattern} 正確`,
        description: `「${word}」は正しいアクセントパターン (${dict.pattern}) で発音できています。`,
      });
    } else if (matchRatio >= 0.5) {
      evalItems.push({
        word,
        status: "warning",
        pitchNote: `実測: ${actualPattern}`,
        description: `「${word}」のアクセントパターンは${dict.pattern}が標準ですが、${actualPattern}と検出されました。`,
        tip: dict.tip,
      });
    } else {
      evalItems.push({
        word,
        status: "error",
        pitchNote: `実測: ${actualPattern}`,
        description: `「${word}」のアクセントが標準パターン (${dict.pattern}) と異なります (${actualPattern})。`,
        tip: dict.tip,
      });
    }
  }

  // Sort: errors first, then warnings, then correct
  evalItems.sort((a, b) => {
    const order = { error: 0, warning: 1, correct: 2 };
    return order[a.status] - order[b.status];
  });

  // 4. Compute metrics from real measurements

  // --- Accent score: average pattern match across all evaluated words ---
  const accentScore =
    wordMatchRatios.length > 0
      ? Math.round(
          (wordMatchRatios.reduce((a, b) => a + b, 0) /
            wordMatchRatios.length) *
            100,
        )
      : 50;

  // --- Speech rate: characters per minute ---
  const charsPerMin =
    duration > 0 ? (EXPECTED_TEXT.length / duration) * 60 : 250;
  const wpm = Math.round(charsPerMin);
  // Optimal for Japanese: 250–350 chars/min
  const speechRateScore = Math.min(
    100,
    Math.max(30, Math.round(100 - Math.abs(charsPerMin - 300) * 0.3)),
  );

  // --- Intonation: pitch variation of voiced frames ---
  const voicedPitches = pitches.filter((p) => p > 0);
  let intonationScore = 50;
  if (voicedPitches.length > 10) {
    const mean =
      voicedPitches.reduce((a, b) => a + b, 0) / voicedPitches.length;
    const variance =
      voicedPitches.reduce((a, p) => a + (p - mean) ** 2, 0) /
      voicedPitches.length;
    const stdDev = Math.sqrt(variance);
    // Convert to semitones: 12 * log2(1 + stdDev/mean)
    const semitoneSpread =
      12 * Math.log2(1 + stdDev / Math.max(mean, 1));
    // Good intonation: 2–5 semitone spread
    if (semitoneSpread >= 2 && semitoneSpread <= 5) {
      intonationScore = Math.round(
        80 + (5 - Math.abs(semitoneSpread - 3.5)) * 10,
      );
    } else if (semitoneSpread < 2) {
      // Too flat
      intonationScore = Math.round(40 + semitoneSpread * 20);
    } else {
      // Too erratic
      intonationScore = Math.round(90 - (semitoneSpread - 5) * 5);
    }
    intonationScore = Math.min(100, Math.max(30, intonationScore));
  }

  // --- Clarity: voiced frame ratio (high ratio = clear speech) ---
  const voicedRatio = voicedPitches.length / Math.max(pitches.length, 1);
  const clarityScore = Math.min(
    100,
    Math.max(30, Math.round(voicedRatio * 120 + 10)),
  );

  // --- Overall score ---
  const overallScore = Math.round(
    accentScore * 0.35 +
      speechRateScore * 0.2 +
      intonationScore * 0.2 +
      clarityScore * 0.25,
  );

  const improvementCount = evalItems.filter(
    (e) => e.status !== "correct",
  ).length;

  const label =
    overallScore >= 90
      ? "発音 優秀"
      : overallScore >= 75
        ? "発音 良好"
        : overallScore >= 60
          ? "発音 普通"
          : "発音 要改善";

  return {
    overallScore,
    transcript: EXPECTED_TEXT,
    evalItems,
    metrics: {
      accent: accentScore,
      speechRate: speechRateScore,
      intonation: intonationScore,
      clarity: clarityScore,
    },
    wpm,
    improvementCount,
    label,
  };
}

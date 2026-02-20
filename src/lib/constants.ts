export type TabId = "record" | "process" | "eval" | "history";

export const PROCESS_STEPS = [
  {
    id: "lip-noise",
    name: "リップノイズ除去",
    desc: "口の開閉音・吐息音を除去",
    processingLabel: "ノイズ除去中...",
    processingDesc: "リップノイズを検出して除去しています",
    delay: 1200,
  },
  {
    id: "white-noise",
    name: "ホワイトノイズ除去",
    desc: "背景ノイズをAIで低減",
    processingLabel: "AIフィルタリング...",
    processingDesc: "DeepFilterNetでバックグラウンドノイズを除去",
    delay: 1500,
  },
  {
    id: "dynamics",
    name: "ダイナミクス整形",
    desc: "音量ムラをコンプレッサーで均す",
    processingLabel: "ダイナミクス処理...",
    processingDesc: "音量を整えています",
    delay: 1200,
  },
  {
    id: "eq",
    name: "EQ & De-esser",
    desc: "音質を最適化",
    processingLabel: "EQ調整中...",
    processingDesc: "聞き心地を最適化しています",
    delay: 1000,
  },
  {
    id: "accent",
    name: "アクセント評価",
    desc: "日本語のアクセントを分析",
    processingLabel: "アクセント解析...",
    processingDesc: "日本語アクセントを評価しています",
    delay: 1500,
  },
] as const;

export const HISTORY_ITEMS = [
  {
    id: "1",
    title: "東京の春ナレーション",
    date: "2026.02.20",
    duration: "00:18",
    score: 82,
    processed: true,
  },
  {
    id: "2",
    title: "自己紹介練習 #3",
    date: "2026.02.19",
    duration: "00:42",
    score: 74,
    processed: true,
  },
  {
    id: "3",
    title: "CM原稿 vol.2",
    date: "2026.02.17",
    duration: "01:05",
    score: 69,
    processed: true,
  },
] as const;

export const EVAL_METRICS = [
  { name: "アクセント", value: 82, color: "cyan" as const },
  { name: "発話速度", value: 90, color: "green" as const },
  { name: "イントネーション", value: 65, color: "amber" as const },
  { name: "明瞭度", value: 88, color: "cyan" as const },
] as const;

export const SCORE_CHART_DATA = [
  { date: "2/14", score: 55 },
  { date: "2/15", score: 60 },
  { date: "2/16", score: 65 },
  { date: "2/17", score: 62 },
  { date: "2/18", score: 70 },
  { date: "2/19", score: 74 },
  { date: "2/20", score: 82 },
] as const;

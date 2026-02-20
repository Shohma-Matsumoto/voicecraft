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

/** 统一画风资源库：生成的世界线只能从这里挑背景与封面，保证画风一致。 */
import bgCorridor from "@/assets/story/bg-corridor.jpg";
import bgDusk from "@/assets/story/bg-dusk-city.jpg";
import coverMind from "@/assets/story/cover-mind.jpg";
import coverMoney from "@/assets/story/cover-money.jpg";
import coverMosquito from "@/assets/story/cover-mosquito.jpg";
import coverRewind from "@/assets/story/cover-rewind.jpg";

export const BACKGROUNDS = {
  corridor: {
    src: bgCorridor,
    alt: "夜晚居民楼楼道，声控灯昏黄，墙面斑驳",
  },
  dusk: {
    src: bgDusk,
    alt: "永远停在黄昏的城市街道，太阳压在地平线上",
  },
} as const;

export type BackgroundKey = keyof typeof BACKGROUNDS;

export const COVERS = {
  night: "linear-gradient(150deg, oklch(0.28 0.08 240), oklch(0.55 0.13 300))",
  dusk: "linear-gradient(150deg, oklch(0.32 0.1 268), oklch(0.58 0.14 200))",
  ember: "linear-gradient(150deg, oklch(0.3 0.06 40), oklch(0.6 0.16 30))",
  forest: "linear-gradient(150deg, oklch(0.3 0.09 160), oklch(0.58 0.14 140))",
  violet: "linear-gradient(150deg, oklch(0.34 0.12 320), oklch(0.6 0.15 280))",
} as const;

export type CoverKey = keyof typeof COVERS;

/** 剧情文本文件里 coverImage 可以引用的封面图 */
export const COVER_IMAGES = {
  corridor: bgCorridor,
  dusk: bgDusk,
  mind: coverMind,
  mosquito: coverMosquito,
  money: coverMoney,
  rewind: coverRewind,
} as const;

export type CoverImageKey = keyof typeof COVER_IMAGES;

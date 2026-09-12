import { corridorStory } from "./stories/corridor";
import { spinStory } from "./stories/spin";
import type { Story, UpcomingWorld } from "./types";

export * from "./types";
export { CHARACTERS, getCharacter } from "./cast";

/** 已开放的世界线：新增一条回答的穿越剧情，只需在这里注册一个 Story。 */
export const STORIES: Story[] = [corridorStory, spinStory];

export const STORY_MAP: Record<string, Story> = Object.fromEntries(
  STORIES.map((story) => [story.id, story]),
);

export function getStory(id: string): Story {
  return STORY_MAP[id] ?? STORIES[0]!;
}

/** 待开放世界，只有卡片信息 */
export const UPCOMING_WORLDS: UpcomingWorld[] = [
  {
    id: "mind",
    card: {
      question: "如果人类突然拥有读心术，会怎样？",
      hook: "第一句听见的心声，来自你最亲近的人。",
      category: "人性实验",
      tags: ["人性", "多结局"],
      players: "7.1 万人预约",
      cover: "linear-gradient(150deg, oklch(0.34 0.12 320), oklch(0.6 0.15 280))",
      icon: "brain",
    },
  },
  {
    id: "mosquito",
    card: {
      question: "如果蚊子从世界上消失，会怎样？",
      hook: "夏夜安静得可怕，然后池塘先出事了。",
      category: "生态自然",
      tags: ["生态", "连锁反应"],
      players: "5.6 万人预约",
      cover: "linear-gradient(150deg, oklch(0.3 0.09 160), oklch(0.58 0.14 140))",
      icon: "bug",
    },
  },
  {
    id: "money",
    card: {
      question: "如果钱可以买时间，会怎样？",
      hook: "你的余额，只剩 37 小时零 12 分。",
      category: "时间循环",
      tags: ["反乌托邦", "抉择"],
      players: "4.2 万人预约",
      cover: "linear-gradient(150deg, oklch(0.3 0.06 40), oklch(0.6 0.16 30))",
      icon: "hourglass",
    },
  },
  {
    id: "rewind",
    card: {
      question: "如果每天都能重来一次，会怎样？",
      hook: "第 47 次循环，你决定不再做好人。",
      category: "时间循环",
      tags: ["循环", "隐藏结局"],
      players: "3.9 万人预约",
      cover: "linear-gradient(150deg, oklch(0.28 0.08 240), oklch(0.55 0.13 300))",
      icon: "repeat",
    },
  },
];

export const WORLD_CATEGORIES: string[] = Array.from(
  new Set([...STORIES.map((s) => s.card.category), ...UPCOMING_WORLDS.map((w) => w.card.category)]),
);

export interface HubEntry {
  id: string;
  card: Story["card"];
  status: "playable" | "soon";
}

export const HUB_ENTRIES: HubEntry[] = [
  ...STORIES.map((story) => ({ id: story.id, card: story.card, status: "playable" as const })),
  ...UPCOMING_WORLDS.map((world) => ({ id: world.id, card: world.card, status: "soon" as const })),
];

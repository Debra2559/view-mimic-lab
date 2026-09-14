import { getGeneratedStories } from "./custom";
import { FILE_STORIES, FILE_UPCOMING } from "./loader";
import type { Story, UpcomingWorld } from "./types";

export * from "./types";
export { CHARACTERS, getCharacter } from "./cast";

/** 已开放的世界线：全部来自 src/content/stories/*.json，新增一个文件即可新增一条世界线。 */
export const STORIES: Story[] = FILE_STORIES;

export const STORY_MAP: Record<string, Story> = Object.fromEntries(
  STORIES.map((story) => [story.id, story]),
);

export function getStory(id: string): Story {
  return STORY_MAP[id] ?? getGeneratedStories().find((s) => s.id === id) ?? STORIES[0]!;
}

/** 待开放世界，只有卡片信息，来自 src/content/upcoming.json */
export const UPCOMING_WORLDS: UpcomingWorld[] = FILE_UPCOMING;

export const WORLD_CATEGORIES: string[] = Array.from(
  new Set([...STORIES.map((s) => s.card.category), ...UPCOMING_WORLDS.map((w) => w.card.category)]),
);

export interface HubEntry {
  id: string;
  card: Story["card"];
  status: "playable" | "soon";
  /** 由用户投喂的回答生成 */
  generated?: boolean;
}

export const HUB_ENTRIES: HubEntry[] = [
  ...STORIES.map((story) => ({ id: story.id, card: story.card, status: "playable" as const })),
  ...UPCOMING_WORLDS.map((world) => ({ id: world.id, card: world.card, status: "soon" as const })),
];

/** 内置世界线 + 用户投喂回答生成的世界线（客户端运行时读取） */
export function getHubEntries(): HubEntry[] {
  const generated = getGeneratedStories().map((story) => ({
    id: story.id,
    card: story.card,
    status: "playable" as const,
    generated: true,
  }));
  return [...generated, ...HUB_ENTRIES];
}

/** 只统计终局（没有后续岔路的结局） */
export function getEndingCount(id: string): number {
  return Object.values(getStory(id).endings).filter((ending) => !ending.next).length;
}

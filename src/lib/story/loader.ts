/**
 * 把 src/content 下的剧情文本文件加载成运行时的 Story 数据。
 * 编辑剧情只需要改 JSON，不用改代码。
 */
import { BACKGROUNDS, COVERS, COVER_IMAGES } from "./assets";
import { getCharacter } from "./cast";
import upcomingRaw from "@/content/upcoming.json";
import type { Character, Story, StoryNode, UpcomingWorld, WorldCard } from "./types";

type RawCard = {
  question: string;
  hook: string;
  category: string;
  tags: string[];
  players: string;
  cover: string;
  coverImage?: string;
  icon: WorldCard["icon"];
};

type RawStory = {
  id: string;
  chapterLabel: string;
  card: RawCard;
  portal: { title: string; action: string };
  background: string;
  backgroundAlt?: string;
  cast: string[];
  introLines: string[];
  nodes: StoryNode[];
  choicePrompt: string;
  choices: Story["choices"];
  endings: Record<"A" | "B", { title: string; summary: string; nodes: StoryNode[] }>;
};

function resolveCover(key: string): string {
  return (COVERS as Record<string, string>)[key] ?? key;
}

function resolveCoverImage(key?: string): string | undefined {
  if (!key) return undefined;
  return (COVER_IMAGES as Record<string, string>)[key] ?? key;
}

function toCard(raw: RawCard): WorldCard {
  return {
    question: raw.question,
    hook: raw.hook,
    category: raw.category,
    tags: raw.tags,
    players: raw.players,
    cover: resolveCover(raw.cover),
    coverImage: resolveCoverImage(raw.coverImage),
    icon: raw.icon,
  };
}

function toStory(raw: RawStory): Story {
  const bg = (BACKGROUNDS as Record<string, { src: string; alt: string }>)[raw.background];
  const cast = raw.cast
    .map((id) => getCharacter(id))
    .filter((c): c is Character => Boolean(c));

  return {
    id: raw.id,
    chapterLabel: raw.chapterLabel,
    card: toCard(raw.card),
    portal: raw.portal,
    background: bg?.src ?? raw.background,
    backgroundAlt: raw.backgroundAlt ?? bg?.alt ?? raw.card.question,
    cast,
    introLines: raw.introLines,
    nodes: raw.nodes,
    choicePrompt: raw.choicePrompt,
    choices: raw.choices,
    endings: {
      A: { key: "A", ...raw.endings.A },
      B: { key: "B", ...raw.endings.B },
    },
  };
}

const modules = import.meta.glob<{ default: RawStory }>("@/content/stories/*.json", {
  eager: true,
});

/** 按文件名排序，文件名前缀决定世界线顺序 */
export const FILE_STORIES: Story[] = Object.keys(modules)
  .sort()
  .map((path) => toStory(modules[path]!.default));

export const FILE_UPCOMING: UpcomingWorld[] = (
  upcomingRaw as { worlds: { id: string; card: RawCard }[] }
).worlds.map((w) => ({ id: w.id, card: toCard(w.card) }));

/** 用户投喂的真实知乎回答所生成的世界线：存在本地，并注册进穿越宇宙。 */
import { BACKGROUNDS, COVERS, type BackgroundKey, type CoverKey } from "./assets";
import { CHARACTERS } from "./cast";
import type { GeneratedStoryData } from "./generate.functions";
import type { Ending, Story, StoryNode } from "./types";

const KEY = "portal-universe-custom-stories";

export interface StoredStory {
  id: string;
  createdAt: number;
  data: GeneratedStoryData;
}

export function readStored(): StoredStory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredStory[]) : [];
  } catch {
    return [];
  }
}

function write(list: StoredStory[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 忽略隐私模式下的写入失败 */
  }
}

export function saveGenerated(data: GeneratedStoryData): StoredStory {
  const entry: StoredStory = { id: `gen-${Date.now().toString(36)}`, createdAt: Date.now(), data };
  write([entry, ...readStored()].slice(0, 30));
  return entry;
}

export function removeGenerated(id: string) {
  write(readStored().filter((item) => item.id !== id));
}

function toNodes(nodes: GeneratedStoryData["nodes"], characterId: string): StoryNode[] {
  return nodes.map((node) => ({
    speaker: node.speaker === "character" ? characterId : "narrator",
    expression: node.expression,
    text: node.text,
  }));
}

export function toStory(entry: StoredStory, index: number): Story {
  const d = entry.data;
  const character = CHARACTERS[d.characterId] ?? CHARACTERS.linxia;
  const background = BACKGROUNDS[d.backgroundKey as BackgroundKey] ?? BACKGROUNDS.corridor;
  const cover = COVERS[d.coverKey as CoverKey] ?? COVERS.night;

  const ending = (key: "A" | "B", raw: GeneratedStoryData["endingA"]): Ending => ({
    key,
    title: raw.title,
    summary: raw.summary,
    nodes: toNodes(raw.nodes, character.id),
  });

  return {
    id: entry.id,
    chapterLabel: `世界线 · 生成 ${String(index + 1).padStart(2, "0")}`,
    card: {
      question: d.question,
      hook: d.hook,
      category: d.category,
      tags: d.tags.slice(0, 3),
      players: "由你投喂的回答生成",
      cover,
      icon: d.icon,
    },
    portal: { title: d.portalTitle, action: d.portalAction },
    background: background.src,
    backgroundAlt: background.alt,
    cast: [character],
    introLines: d.introLines.slice(0, 3),
    nodes: toNodes(d.nodes, character.id),
    choicePrompt: d.choicePrompt,
    choices: d.choices.slice(0, 2).map((c, i) => ({
      key: (i === 0 ? "A" : "B") as "A" | "B",
      label: c.label,
      innerVoice: c.innerVoice,
      ending: (i === 0 ? "A" : "B") as "A" | "B",
    })),
    endings: { A: ending("A", d.endingA), B: ending("B", d.endingB) },
  };
}

/** 读取本地生成的全部世界线（客户端调用） */
export function getGeneratedStories(): Story[] {
  return readStored().map(toStory);
}

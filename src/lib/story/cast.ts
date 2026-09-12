/** 统一画风的角色立绘库：所有世界共用，新增世界只需引用或追加角色。 */
import chenmoCalm from "@/assets/story/chenmo-calm.png";
import chenmoRelieved from "@/assets/story/chenmo-relieved.png";
import chenmoTense from "@/assets/story/chenmo-tense.png";
import linxiaCalm from "@/assets/story/linxia-calm.png";
import linxiaRelieved from "@/assets/story/linxia-relieved.png";
import linxiaTense from "@/assets/story/linxia-tense.png";

import type { Character } from "./types";

export const CHARACTERS = {
  linxia: {
    id: "linxia",
    name: "林夏",
    role: "住在你楼上的邻居",
    sprites: { calm: linxiaCalm, tense: linxiaTense, relieved: linxiaRelieved },
  },
  chenmo: {
    id: "chenmo",
    name: "陈默",
    role: "永昼里的气象观测员",
    sprites: { calm: chenmoCalm, tense: chenmoTense, relieved: chenmoRelieved },
  },
} satisfies Record<string, Character>;

export type CharacterId = keyof typeof CHARACTERS;

export function getCharacter(id: string): Character | undefined {
  return (CHARACTERS as Record<string, Character>)[id];
}

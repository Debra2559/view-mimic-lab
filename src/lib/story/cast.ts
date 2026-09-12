/** 统一画风的角色立绘库：所有世界共用，新增世界只需引用或追加角色。 */
import chenmoCalm from "@/assets/story/chenmo-calm.png";
import chenmoRelieved from "@/assets/story/chenmo-relieved.png";
import chenmoTense from "@/assets/story/chenmo-tense.png";
import linxiaCalm from "@/assets/story/linxia-calm.png";
import linxiaRelieved from "@/assets/story/linxia-relieved.png";
import heyuCalm from "@/assets/story/heyu-calm.png";
import heyuRelieved from "@/assets/story/heyu-relieved.png";
import heyuTense from "@/assets/story/heyu-tense.png";
import linxiaTense from "@/assets/story/linxia-tense.png";
import luzhaoCalm from "@/assets/story/luzhao-calm.png";
import luzhaoRelieved from "@/assets/story/luzhao-relieved.png";
import luzhaoTense from "@/assets/story/luzhao-tense.png";
import sunianCalm from "@/assets/story/sunian-calm.png";
import sunianRelieved from "@/assets/story/sunian-relieved.png";
import sunianTense from "@/assets/story/sunian-tense.png";
import zhouyanCalm from "@/assets/story/zhouyan-calm.png";
import zhouyanRelieved from "@/assets/story/zhouyan-relieved.png";
import zhouyanTense from "@/assets/story/zhouyan-tense.png";

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
  sunian: {
    id: "sunian",
    name: "苏念",
    role: "你最亲近的人",
    sprites: { calm: sunianCalm, tense: sunianTense, relieved: sunianRelieved },
  },
  heyu: {
    id: "heyu",
    name: "何予",
    role: "湿地观测站研究员",
    sprites: { calm: heyuCalm, tense: heyuTense, relieved: heyuRelieved },
  },
  zhouyan: {
    id: "zhouyan",
    name: "周砚",
    role: "时间银行柜员",
    sprites: { calm: zhouyanCalm, tense: zhouyanTense, relieved: zhouyanRelieved },
  },
  luzhao: {
    id: "luzhao",
    name: "陆昭",
    role: "困在同一天里的同伴",
    sprites: { calm: luzhaoCalm, tense: luzhaoTense, relieved: luzhaoRelieved },
  },
} satisfies Record<string, Character>;

export type CharacterId = keyof typeof CHARACTERS;

export function getCharacter(id: string): Character | undefined {
  return (CHARACTERS as Record<string, Character>)[id];
}

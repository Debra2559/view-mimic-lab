export interface WorldCard {
  id: string;
  question: string;
  hook: string;
  tags: string[];
  players: string;
  /** CSS gradient used as the animated cover */
  cover: string;
  glyph: string;
  status: "playable" | "soon";
}

export const WORLDS: WorldCard[] = [
  {
    id: "corridor",
    question: "如果没人愿意多管一次闲事，会怎样？",
    hook: "凌晨 1:47，楼道里的电动车开始冒烟。",
    tags: ["现实向", "两种结局"],
    players: "12.8 万人进入",
    cover: "linear-gradient(150deg, oklch(0.36 0.09 258), oklch(0.62 0.16 55))",
    glyph: "🛵",
    status: "playable",
  },
  {
    id: "spin",
    question: "如果地球停止自转，会怎样？",
    hook: "第 1 天，你所在的城市永远停在了黄昏。",
    tags: ["硬核脑洞", "生存"],
    players: "9.4 万人预约",
    cover: "linear-gradient(150deg, oklch(0.32 0.1 268), oklch(0.58 0.14 200))",
    glyph: "🌍",
    status: "soon",
  },
  {
    id: "mind",
    question: "如果人类突然拥有读心术，会怎样？",
    hook: "第一句听见的心声，来自你最亲近的人。",
    tags: ["人性", "多结局"],
    players: "7.1 万人预约",
    cover: "linear-gradient(150deg, oklch(0.34 0.12 320), oklch(0.6 0.15 280))",
    glyph: "🧠",
    status: "soon",
  },
  {
    id: "mosquito",
    question: "如果蚊子从世界上消失，会怎样？",
    hook: "夏夜安静得可怕，然后池塘先出事了。",
    tags: ["生态", "连锁反应"],
    players: "5.6 万人预约",
    cover: "linear-gradient(150deg, oklch(0.3 0.09 160), oklch(0.58 0.14 140))",
    glyph: "🦟",
    status: "soon",
  },
  {
    id: "money",
    question: "如果钱可以买时间，会怎样？",
    hook: "你的余额，只剩 37 小时零 12 分。",
    tags: ["反乌托邦", "抉择"],
    players: "4.2 万人预约",
    cover: "linear-gradient(150deg, oklch(0.3 0.06 40), oklch(0.6 0.16 30))",
    glyph: "⏳",
    status: "soon",
  },
  {
    id: "rewind",
    question: "如果每天都能重来一次，会怎样？",
    hook: "第 47 次循环，你决定不再做好人。",
    tags: ["循环", "隐藏结局"],
    players: "3.9 万人预约",
    cover: "linear-gradient(150deg, oklch(0.28 0.08 240), oklch(0.55 0.13 300))",
    glyph: "🔁",
    status: "soon",
  },
];

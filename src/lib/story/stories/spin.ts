import bgDusk from "@/assets/story/bg-dusk-city.jpg";

import { CHARACTERS } from "../cast";
import type { Story } from "../types";

export const spinStory: Story = {
  id: "spin",
  chapterLabel: "世界线 · 02",
  card: {
    question: "如果地球停止自转，会怎样？",
    hook: "第 1 天，你所在的城市永远停在了黄昏。",
    category: "硬核脑洞",
    tags: ["硬核脑洞", "生存"],
    players: "9.4 万人进入",
    cover: "linear-gradient(150deg, oklch(0.32 0.1 268), oklch(0.58 0.14 200))",
    icon: "globe",
  },
  portal: {
    title: "检测到可进入的世界线",
    action: "触碰裂缝，走进那个永远的黄昏",
  },
  background: bgDusk,
  backgroundAlt: "永远停在黄昏的城市街道，太阳压在地平线上，车流静止",
  cast: [CHARACTERS.chenmo],
  introLines: ["回答里的那句“会怎样”忽然亮了起来。", "再抬头时，太阳已经三十六个小时没有动过。"],
  nodes: [
    {
      speaker: "narrator",
      text: "第 1 天 17:04。太阳卡在地平线上，影子拉得比整条街还长，风停了。",
    },
    {
      speaker: "narrator",
      text: "手机推送最后一条消息后就断了网：【全球自转速率异常，请就近避险】。",
    },
    {
      speaker: "chenmo",
      expression: "tense",
      text: "别往西边走。西半球现在是永夜，气温三小时掉了二十度。",
    },
    {
      speaker: "narrator",
      text: "他是城郊气象站的观测员陈默，手里那台老式风速计，是这座城市仅剩还在工作的仪器。",
    },
    {
      speaker: "chenmo",
      expression: "tense",
      text: "赤道的海水正在往两极堆。我们这儿撑不了太久——站里有一份完整的观测记录，得有人带出去。",
    },
    {
      speaker: "narrator",
      text: "远处传来低沉的轰鸣，像海，又像整块大陆在挪动。你身后是撤离车队最后一班车。",
    },
  ],
  choicePrompt: "车门就要关了。你的选择是——",
  choices: [
    {
      key: "A",
      label: "陪他回观测站，把记录带出去。",
      innerVoice: "如果没人知道发生了什么，活下来的人也活不明白。",
      ending: "A",
    },
    {
      key: "B",
      label: "上车。先活下来再说。",
      innerVoice: "数据能等，命不能等。",
      ending: "B",
    },
  ],
  endings: {
    A: {
      key: "A",
      title: "留在黄昏里的人",
      summary: "有人把“会怎样”记下来，后来的人才不用重新猜一遍。",
      nodes: [
        {
          speaker: "narrator",
          text: "你们逆着人流跑回观测站，把七十二小时的风速、气压、潮位全部抄进一个铁皮盒。",
        },
        {
          speaker: "chenmo",
          expression: "relieved",
          text: "三个月后，避难营用这份记录算出了第一条安全带的位置。你抄的那几页，救了很多人。",
        },
        {
          speaker: "narrator",
          text: "永远的黄昏里，你终于明白：知识才是这颗停转星球上，唯一还在转动的东西。",
        },
      ],
    },
    B: {
      key: "B",
      title: "第一班车",
      summary: "所有人都只顾着逃，就没有人知道该往哪逃。",
      nodes: [
        {
          speaker: "narrator",
          text: "车门在你身后合上。透过后窗，陈默的身影很快被长长的影子吞没。",
        },
        {
          speaker: "narrator",
          text: "车队在第 4 天迷路了——没有人知道风向变了，也没有人知道海水正从哪一侧涌来。",
        },
        {
          speaker: "chenmo",
          expression: "tense",
          text: "观测站的电台反复播着同一段空白。那份记录，最终没有人取走。",
        },
      ],
    },
  },
};

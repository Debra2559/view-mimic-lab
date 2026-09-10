import bgCorridor from "@/assets/story/bg-corridor.jpg";
import linxiaCalm from "@/assets/story/linxia-calm.png";
import linxiaRelieved from "@/assets/story/linxia-relieved.png";
import linxiaTense from "@/assets/story/linxia-tense.png";

export type Expression = "calm" | "tense" | "relieved";

export interface StoryNode {
  speaker: "narrator" | "linxia" | "you";
  expression?: Expression;
  text: string;
}

export const STORY_BACKGROUND = bgCorridor;

export const CHARACTER_SPRITES: Record<Expression, string> = {
  calm: linxiaCalm,
  tense: linxiaTense,
  relieved: linxiaRelieved,
};

export const CHARACTER_NAME = "林夏";

export const INTRO_LINES = [
  "回答中的字忽然开始脱落。",
  "下一秒，凌晨的冷风吹到了你的脸上。",
];

export const MAIN_NODES: StoryNode[] = [
  {
    speaker: "narrator",
    text: "凌晨 1:47。你送完今天最后一单，推开楼道那扇吱呀作响的防火门。",
  },
  {
    speaker: "narrator",
    text: "一股电池烧焦的酸味钻进鼻腔。楼道拐角，一辆正在充电的电动车，座垫下正往外渗着灰白色的烟。",
  },
  {
    speaker: "narrator",
    text: "烟雾旁边，堆着一人多高的纸壳和塑料瓶——是三楼阿婆攒了半个月的回收品。",
  },
  {
    speaker: "linxia",
    expression: "tense",
    text: "喂？楼下是不是有什么东西烧起来了？我在家里闻到味道了……",
  },
  {
    speaker: "narrator",
    text: "来电显示是楼上的邻居林夏。与此同时，手机另一头震动了一下：【下一单即将超时，距取餐点 2.3 公里】。",
  },
  {
    speaker: "linxia",
    expression: "tense",
    text: "你还在楼下吗？楼道里全是纸箱……求你了，想想办法。",
  },
];

export interface ChoiceOption {
  key: "A" | "B";
  label: string;
  innerVoice: string;
}

export const CHOICES: ChoiceOption[] = [
  {
    key: "A",
    label: "先报警。我不能当作没看见。",
    innerVoice: "超时会扣钱，但烟不会等我送完这一单。",
  },
  {
    key: "B",
    label: "时间来不及了，这不该由我负责。",
    innerVoice: "物业会管的，车主会管的……总有人比我更合适。",
  },
];

export interface Ending {
  key: "A" | "B";
  title: string;
  nodes: StoryNode[];
  summary: string;
}

export const ENDINGS: Record<"A" | "B", Ending> = {
  A: {
    key: "A",
    title: "火光之前",
    nodes: [
      {
        speaker: "narrator",
        text: "你按下报警键，把电动车拖离纸箱，又挨个拍响每一户的门。手掌被车座烫得发红。",
      },
      {
        speaker: "linxia",
        expression: "relieved",
        text: "明火已经灭了……消防员说，再晚十分钟，火就进电缆井了。",
      },
      {
        speaker: "narrator",
        text: "凌晨的站长在电话里骂了你二十分钟。可你看着重新亮起灯的楼道，忽然觉得这一单超时，值了。",
      },
    ],
    summary: "有人愿意多管一次“闲事”，整栋楼就少付一次代价。",
  },
  B: {
    key: "B",
    title: "无人负责的夜晚",
    nodes: [
      {
        speaker: "narrator",
        text: "你拧动油门。后视镜里，那点橘色的光越来越小，最后被夜色吞掉。",
      },
      {
        speaker: "narrator",
        text: "第二天的新闻推送：某小区楼道深夜起火，整栋楼紧急疏散，两名住户吸入浓烟送医。",
      },
      {
        speaker: "linxia",
        expression: "tense",
        text: "她的最后一条消息停在 2:03，一直没有已读——「烟好大，我下不去楼了。」",
      },
    ],
    summary: "当每个人都觉得“不归我管”，代价会由所有人一起付。",
  },
};

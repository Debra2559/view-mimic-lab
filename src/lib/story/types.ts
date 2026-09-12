/** 穿越宇宙的统一数据结构：任何一条回答都可以按这套结构生成自己的入口与剧情。 */

export type Expression = "calm" | "tense" | "relieved";

/** 统一画风的角色立绘库条目 */
export interface Character {
  id: string;
  name: string;
  /** 一句话人设，用于入口与分享卡片 */
  role: string;
  sprites: Record<Expression, string>;
}

export interface StoryNode {
  /** "narrator" 为旁白，其余为角色库中的角色 id */
  speaker: "narrator" | (string & {});
  expression?: Expression;
  text: string;
}

/** 场景里的可触碰物件：摸一摸、推开门、拿起某样东西…… */
export type InteractionIcon =
  | "hand"
  | "flame"
  | "door"
  | "phone"
  | "package"
  | "ear"
  | "eye"
  | "clock"
  | "bike"
  | "wind"
  | "light"
  | "note";

export interface Interaction {
  id: string;
  /** 按钮上的动作文案，如「摸摸车座」 */
  label: string;
  icon: InteractionIcon;
  /** 在画面中的位置，百分比 */
  x: number;
  y: number;
  /** 触碰后的描写 */
  response: string;
  /** 已经碰过之后再点的短句 */
  after?: string;
}

export interface ChoiceOption {
  key: "A" | "B";
  label: string;
  innerVoice: string;
  /** 通向的结局 key */
  ending: "A" | "B";
}


export interface Ending {
  key: "A" | "B";
  title: string;
  summary: string;
  nodes: StoryNode[];
}

/** 回答页里的穿越入口文案（每条回答生成自己的入口） */
export interface PortalCopy {
  /** 入口标题，如「检测到可进入的世界线」 */
  title: string;
  /** 行动文案，如「触碰裂缝，成为那个外卖员」 */
  action: string;
}

/** 世界卡片（大厅双列展示用） */
export interface WorldCard {
  question: string;
  hook: string;
  /** 「如果」主题分类 */
  category: string;
  tags: string[];
  players: string;
  /** CSS 渐变封面（无封面图时兜底） */
  cover: string;
  /** 全幅封面图，铺满整张卡片 */
  coverImage?: string;
  icon: "bike" | "globe" | "brain" | "bug" | "hourglass" | "repeat";
}

export interface Story {
  id: string;
  /** 世界线编号标签，如「世界线 · 01」 */
  chapterLabel: string;
  card: WorldCard;
  portal: PortalCopy;
  background: string;
  backgroundAlt: string;
  /** 本篇出场角色（引用统一立绘库） */
  cast: Character[];
  introLines: string[];
  nodes: StoryNode[];
  choicePrompt: string;
  choices: ChoiceOption[];
  endings: Record<"A" | "B", Ending>;
}

/** 尚未开放的世界，只需要卡片信息 */
export interface UpcomingWorld {
  id: string;
  card: WorldCard;
}

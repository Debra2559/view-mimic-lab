/**
 * 本地改编器（未接入 AI 时的降级通道）。
 *
 * 原则：不创作、不编造 —— 只把投喂的回答「重新编排」成互动结构，
 * 所有台词都取自原文，保证内容不失真。
 * 接入 AI 后，同一条回答会被改写成更完整的剧本（这条通道仍然可用作兜底）。
 */
import type { CandidatePost, GeneratedStoryData } from "./generate.functions";

/** 分句：保留有信息量、适合做台词的句子 */
function splitSentences(text: string): string[] {
  return text
    .split(/[。！？；\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && s.length <= 80);
}

/** 有画面感 / 有转折的句子优先做台词 */
const VIVID = /[0-9]|[「」“”"]|突然|忽然|那一刻|后来|第一次|最后一次|其实|但是|可是|却|如果/;

function rankSentences(lines: string[]): string[] {
  return [...lines].sort((a, b) => {
    const sa = (VIVID.test(a) ? 2 : 0) + Math.min(a.length / 40, 1);
    const sb = (VIVID.test(b) ? 2 : 0) + Math.min(b.length / 40, 1);
    return sb - sa;
  });
}

type CharacterId = GeneratedStoryData["characterId"];

const CHARACTER_HINTS: Array<{ id: CharacterId; words: string[] }> = [
  { id: "luzhao", words: ["循环", "重复", "同一天", "困住", "时间"] },
  { id: "heyu", words: ["野外", "湿地", "生态", "动物", "植物", "环境", "自然"] },
  { id: "zhouyan", words: ["制度", "规则", "公司", "政策", "银行", "合同", "面试", "工作"] },
  { id: "sunian", words: ["家人", "母亲", "父亲", "孩子", "妻子", "丈夫", "亲人", "父母"] },
  { id: "chenmo", words: ["观测", "数据", "记录", "研究", "科学", "天气"] },
  { id: "linxia", words: ["邻居", "楼上", "下班", "租房", "外卖", "地铁", "城市"] },
];

const BACKGROUND_HINTS: Array<{ key: GeneratedStoryData["backgroundKey"]; words: string[] }> = [
  { key: "rewind", words: ["循环", "重复", "同一天", "闹钟", "醒来"] },
  { key: "mosquito", words: ["夏", "虫", "水", "田", "野外", "湿地"] },
  { key: "money", words: ["制度", "银行", "合同", "工资", "钱", "政策", "公司"] },
  { key: "mind", words: ["心", "想", "意识", "情绪", "孤独", "深夜"] },
  { key: "dusk", words: ["城市", "街", "黄昏", "路", "车"] },
  { key: "corridor", words: ["家", "楼道", "房间", "邻居", "夜"] },
];

const CATEGORY_HINTS: Array<{ name: GeneratedStoryData["category"]; words: string[] }> = [
  { name: "时间循环", words: ["循环", "重复", "同一天", "时间", "回到"] },
  { name: "生态自然", words: ["生态", "自然", "环境", "动物", "气候", "湿地"] },
  { name: "人性实验", words: ["人性", "实验", "道德", "善", "恶", "选择"] },
  { name: "硬核脑洞", words: ["如果", "假设", "物理", "宇宙", "科技", "AI"] },
  { name: "现实向", words: ["工作", "生活", "家庭", "社会", "制度", "现实"] },
];

const ICON_BY_CATEGORY: Record<GeneratedStoryData["category"], GeneratedStoryData["icon"]> = {
  时间循环: "repeat",
  生态自然: "bug",
  人性实验: "brain",
  硬核脑洞: "globe",
  现实向: "hourglass",
};

const COVER_BY_CATEGORY: Record<GeneratedStoryData["category"], GeneratedStoryData["coverKey"]> = {
  时间循环: "night",
  生态自然: "forest",
  人性实验: "violet",
  硬核脑洞: "dusk",
  现实向: "ember",
};

function pickCategory(text: string): GeneratedStoryData["category"] {
  for (const item of CATEGORY_HINTS) {
    if (item.words.some((word) => text.includes(word))) return item.name;
  }
  return "现实向";
}

function pickCharacter(text: string): CharacterId {
  for (const item of CHARACTER_HINTS) {
    if (item.words.some((word) => text.includes(word))) return item.id;
  }
  return "linxia";
}

function pickBackground(text: string): GeneratedStoryData["backgroundKey"] {
  for (const item of BACKGROUND_HINTS) {
    if (item.words.some((word) => text.includes(word))) return item.key;
  }
  return "corridor";
}

/** 把一条回答就地编排成一条可玩的世界线 */
export function forgeLocally(question: string, answer: string): GeneratedStoryData {
  const all = splitSentences(answer);
  const ranked = rankSentences(all);
  const opening = all[0] ?? question;
  const quoted = all.filter((s) => /[「」“”"]/.test(s));

  // 主线台词：优先有画面感的句子，最多 5 条
  const beats = ranked.slice(0, 5);
  const nodes: GeneratedStoryData["nodes"] = beats.map((text) => ({
    speaker: /[「」“”"]/.test(text) ? "character" : "narrator",
    expression: VIVID.test(text) ? "tense" : "calm",
    text,
  }));
  if (nodes.length < 3) {
    nodes.push({ speaker: "narrator", expression: "calm", text: "你站在这里，把刚才读到的东西又想了一遍。" });
  }

  const source = answer + question;
  const category = pickCategory(source);
  const characterId = pickCharacter(source);
  const backgroundKey = pickBackground(source);

  /** 结论句：原文最后一句，作为结局的依据 */
  const conclusion = all[all.length - 1] ?? opening;
  /** 转折句：原文里带"如果/但是/却"的那句，作为抉择引子 */
  const turning = all.find((s) => /如果|但是|可是|却|其实|选择/.test(s));

  return {
    question: question.slice(0, 60),
    hook: (turning ?? conclusion).slice(0, 28),
    category,
    tags: [category.slice(0, 4), "本地改编", "单幕"],
    icon: ICON_BY_CATEGORY[category],
    coverKey: COVER_BY_CATEGORY[category],
    backgroundKey,
    characterId,
    portalTitle: "检测到可进入的世界线",
    portalAction: `触碰裂缝，进入「${question.slice(0, 14)}」`,
    introLines: [opening.slice(0, 60), conclusion.slice(0, 60)],
    nodes,
    choicePrompt: turning
      ? `你读到这一句：「${turning.slice(0, 48)}」。换作是你，会怎么走？`
      : "故事走到这里，前面有两条路。你会怎么走？",
    choices: [
      {
        key: "A",
        label: "顺着原文那条路走下去",
        innerVoice: "至少这条路，是有人真的走过、并且写下来的",
      },
      {
        key: "B",
        label: "走另一条",
        innerVoice: "如果换成我，也许会有不一样的结果",
      },
    ],
    endingA: {
      title: "原文的答案",
      summary: conclusion.slice(0, 110),
      nodes: [
        { speaker: "narrator", expression: "calm", text: "你沿着原文那条路走到底。" },
        { speaker: "narrator", expression: "relieved", text: conclusion.slice(0, 74) },
      ],
    },
    endingB: {
      title: "你的答案",
      summary: `原文给出的是一种答案：${conclusion.slice(0, 70)}。而这一条是你自己走的——它没有被谁验证过，所以它也不会被别人替你负责。`,
      nodes: [
        { speaker: "narrator", expression: "calm", text: "你选了另一条。没有人能告诉你这算不算对。" },
        ...(quoted[0]
          ? [
              {
                speaker: "character" as const,
                expression: "tense" as const,
                text: quoted[0].slice(0, 74),
              },
            ]
          : []),
        { speaker: "narrator", expression: "relieved", text: "但你至少知道了，另一种可能是长什么样的。" },
      ],
    },
  };
}

/**
 * 未接入 AI 时的本地候选池：话题取自真实知乎热榜，
 * 代表段落为本地整理（不复述具体当事人、不编造数据）。
 */
export const LOCAL_CANDIDATES: CandidatePost[] = [
  {
    question: "于东来发文称胖东来再招员工都是学员性质，合同四年不续签",
    category: "现实向",
    heat: "1103 万热度 · 热榜",
    summary: "顶薪、导师、只签四年——用「有期限的好」换团队的持续更新。",
    excerpt:
      "先把条件摆在桌上：行业顶薪、配专属导师、三年让你独当一面。然后才是那条容易被忽略的——合同只签四年，到期重新竞聘。支持的人说，这是把「好」变成可流通的能力，而不是把人养在温室里；反对的人说，再好的待遇一旦带上倒计时，就不再是安稳，而是租来的。两种说法都能自洽，真正的分歧在于：你把工作当成一次交易，还是一段关系。",
  },
  {
    question: "河北医大二院工作人员先后收受贿赂46次，累计涉案1.84亿元",
    category: "人性实验",
    heat: "2340 万热度 · 热榜",
    summary: "值得推演的不是金额，是「46 次」——每一次伸手之前，他都确信不会被发现。",
    excerpt:
      "第一次往往最小，小到可以解释成「人情」。第二次开始，规则就被悄悄改写了：不是「我要不要拿」，而是「这次会不会被发现」。46 次的意思是，这套自我说服重复了 46 遍，而且每一遍都比上一遍更熟练。真正让人后背发凉的地方在这里——防线不是被一次攻破的，是被一次次「应该没事」磨没的。",
  },
  {
    question: "清朝人口为何从1400万迅速长到4亿？",
    category: "硬核脑洞",
    heat: "892 万热度 · 热榜",
    summary: "答案不在生育意愿，而在一株从美洲来的作物和一次税制改革。",
    excerpt:
      "把时间轴摊开：人口的增长曲线不是匀速的，它在某个节点突然抬头。抬头之前发生了两件事——一种耐旱、不挑地的作物被引进并在山地推广开，让原本养不活人的坡地开始产粮；同时，征税的口径从「按人头」慢慢转向「按地亩」，多生孩子不再等于多交税。两件事叠加，才有了那条陡峭的曲线。所以这不是一个关于「愿意生」的故事，而是一个关于「养得活」的故事。",
  },
  {
    question: "男生考上北大医学部放弃，2026 年又考进北大图灵班",
    category: "现实向",
    heat: "654 万热度 · 热榜",
    summary: "有人替他惋惜那一年，也有人说那一年本来就不是浪费。",
    excerpt:
      "他第一次高考考上了，然后没有去。第二年重新来，换了一个方向。旁观者的争论立刻分成两派：一派算的是沉没成本——本来已经上岸，为什么要重游一次；另一派算的是方向成本——如果四年读完才发现走错，代价只会更大。这两种算法都成立，区别只在于你把「时间」当成消耗品，还是当成校准过程的必要开销。",
  },
  {
    question: "HYROX 北京站比赛选手失禁仍完成比赛，规则与卫生安全引争议",
    category: "人性实验",
    heat: "521 万热度 · 热榜",
    summary: "当「完成」被设为唯一目标，代价该由谁来承担？",
    excerpt:
      "赛事把「完赛」定成唯一目标，于是所有选项都被这个目标重新排序：不舒服可以忍，体面可以后放，身体发出的信号可以被解释成「还能坚持」。支持者说这正是竞技精神的边界测试；反对者说，把这种坚持剪成宣传片，等于把一种伤害包装成荣誉。分歧的落点其实很具体——一场比赛的规则，应该保护成绩，还是保护参赛的人。",
  },
  {
    question: "如何看待苹果宣布 app 可以直接获取 iPhone Duo 铰链开合角度",
    category: "硬核脑洞",
    heat: "403 万热度 · 热榜",
    summary: "当设备知道自己是折着的，软件能做的事就变了。",
    excerpt:
      "一个开合角度，看起来只是硬件参数，交到开发者手里就变成了上下文：半折是支架态，接近合拢是口袋态，完全展开是桌面态。可推演的方向有两个——好的那一面是应用终于能跟着形态走，视频会自动变成上下分屏、相机自动进入腰平取景；需要警惕的那一面是所有应用都可以问一句「你现在折到多少度」，而这个信息背后是你此刻把设备放在什么位置、以什么姿态看着它。能力本身中性，边界得提前想清楚。",
  },
];


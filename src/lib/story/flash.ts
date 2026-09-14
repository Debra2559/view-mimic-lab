/**
 * 金句闪卡（L3）：不是所有文章都值得做完整世界线，
 * 但几乎任何一条好内容都能提炼出一句话 + 一个画面。
 *
 * 数据可由「知乎 CLI 抓热点 → AI 提炼」离线预生成；
 * 本文件先用手工提炼的真实热榜内容验证形态。
 */

export interface FlashCardData {
  id: string;
  /** 原始提问（来自知乎热榜/搜索） */
  question: string;
  /** 提炼出的那句最戳的话 */
  quote: string;
  /** 展开后的一句话背景：为什么这句话值得停下来看 */
  context: string;
  /** 分类标签 */
  category: string;
  /** 热度文案，如「2340 万热度」 */
  heat: string;
  /** 氛围色对 [起点, 终点]：CSS 渐变与分享卡画布共用 */
  colors: readonly [string, string];
  /** 背景装饰用的话题关键字（超大半透明） */
  glyph: string;
  /** 原文链接（可选）；没有时展开层给出知乎搜索入口 */
  sourceUrl?: string;
}

/** 真实知乎热榜提炼（2026-09-13 抓取） */
export const FLASH_CARDS: FlashCardData[] = [
  {
    id: "flash-yida",
    question: "河北医大二院工作人员先后收受贿赂46次，累计涉案1.84亿元",
    quote: "46 次伸手，每一次都以为这次不会被发现。",
    context:
      "真正值得停下来看的不是金额，而是「46 次」这个数字——每一次伸手之前，他都确信自己不会被抓到。",
    category: "法治",
    heat: "2340 万热度",
    colors: ["#4a2020", "#96341f"],
    glyph: "贿",
  },
  {
    id: "flash-pangdonglai",
    question: "于东来发文称胖东来再招员工都是学员性质，合同四年不续签",
    quote: "他把「对员工好」写进制度，也把「期限」写进了制度。",
    context:
      "争议的焦点不是待遇够不够好，而是——「好」为什么必须有期限？这条讨论里，两种答案都站得住。",
    category: "商业",
    heat: "1103 万热度",
    colors: ["#234a42", "#3a7a5a"],
    glyph: "度",
  },
  {
    id: "flash-qingchao",
    question: "清朝人口为何从1400万迅速长到4亿？",
    quote: "不是清朝人突然能生了，是他们终于不用担心饿死了。",
    context:
      "从 1400 万到 4 亿，翻了近 30 倍。答案不在生育意愿，而在一条从美洲传来的作物和一项税收制度的改变。",
    category: "历史",
    heat: "892 万热度",
    colors: ["#5a3d1a", "#a06a28"],
    glyph: "生",
  },
  {
    id: "flash-beida",
    question: "男生考上北大医学部放弃，2026 年又考进北大图灵班",
    quote: "有些人不是走错了路，只是绕了个弯去他真正想去的地方。",
    context:
      "他去年考上北大医学部却放弃，今年重新高考考进图灵班。有人替他惋惜那一年，也有人说那一年本来就不是浪费。",
    category: "教育",
    heat: "654 万热度",
    colors: ["#2a3a5a", "#3d5a9a"],
    glyph: "路",
  },
  {
    id: "flash-hyrox",
    question: "HYROX 北京站选手失禁仍完成比赛，规则与卫生安全引争议",
    quote: "把「完赛」定成唯一目标，身体发出的信号就变成了可以商量的东西。",
    context:
      "争议不在于他坚持了什么，而在于——把这种坚持剪进宣传片之后，后来的人会以为这就是标准。",
    category: "人性实验",
    heat: "521 万热度",
    colors: ["#5a2a26", "#a2492e"],
    glyph: "忍",
  },
  {
    id: "flash-yuren",
    question: "罗永浩称野人先生冰激凌很一般，对方该如何回应这场舆情",
    quote: "一场舆情的输赢，常常不在谁有理，而在谁先开口。",
    context:
      "被公开差评之后，最有杀伤力的从来不是那句话本身，而是回应的方式——先讲道理，还是先接住情绪。",
    category: "商业",
    heat: "1180 万热度",
    colors: ["#2a2a52", "#4a4a9a"],
    glyph: "应",
  },
  {
    id: "flash-lpl",
    question: "LPL 2026 赛季季后赛总决赛 AL 3:1 击败 BLG 夺冠",
    quote: "冠军只有一个，但所有人都练了一整年。",
    context:
      "镜头只给到举杯的那五个人。同一个场馆里，另一支队伍刚刚打完了他们这一年最后一场比赛。",
    category: "体育",
    heat: "1640 万热度",
    colors: ["#1f3a52", "#2f6a94"],
    glyph: "冠",
  },
  {
    id: "flash-nezha",
    question: "浙江太乙圣莲拟 30 亿元入主哪吒汽车",
    quote: "三十亿能买下一个名字，买不回上一批车主的心。",
    context:
      "资本可以换掉董事会、换掉产线、换掉 logo，但已经卖出去的那批车还在路上跑，它们的口碑会替新东家说话。",
    category: "商业",
    heat: "736 万热度",
    colors: ["#3a2a52", "#6a3a9a"],
    glyph: "资",
  },
  {
    id: "flash-duo",
    question: "如何看待苹果宣布 app 可以直接获取 iPhone Duo 铰链开合角度",
    quote: "当设备知道自己是折着的，软件能做的事就变了。",
    context:
      "一个开合角度，交到开发者手里就变成了上下文：半折是支架态、合拢是口袋态、展开是桌面态——也变成了「你现在以什么姿态看着它」这条信息。",
    category: "硬核脑洞",
    heat: "403 万热度",
    colors: ["#2a3a42", "#3d7a82"],
    glyph: "折",
  },
  {
    id: "flash-liangbandao",
    question: "餐饮店被曝员工单人工作 17 小时，博主调查发现实为两班倒",
    quote: "「一个人干 17 小时」和「两班倒」之间，差的不是体力，是账本。",
    context:
      "同一条时间线，两种讲法：一种在说人有多苦，一种在说成本怎么摊。真相往往不在情绪最响的那一版里。",
    category: "社会",
    heat: "612 万热度",
    colors: ["#4a3a20", "#8a6a30"],
    glyph: "账",
  },
];

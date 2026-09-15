import { CARD_QR_HINT } from "@/lib/share-target";
/**
 * 金句闪卡（L3）：不是所有文章都值得做完整世界线，
 * 但几乎任何一条好内容都能被提炼成一句"标题党 + 一个悬念"。
 *
 * 数据可由「知乎 CLI 抓热点 → AI 提炼」离线预生成；
 * 本文件先用手工提炼的真实热榜内容验证形态。
 *
 * 海报设计约束（2026-09-14 改版）：
 * - 主标题必须是「数字/结论」型标题党，其中 headlineNumber 用强调色放大；
 * - teaser 只制造悬念，不解释答案（答案是点进去之后的事）；
 * - 卡面不出现分类标签、热度等无效信息，只保留标题、悬念与出口。
 */

export interface FlashCardData {
  id: string;
  /** 原始提问（知乎热榜/搜索）——海报底部来源与分享文案用 */
  question: string;
  /** 主标题前缀（常规字重） */
  headlineLead: string;
  /** 主标题里要高饱和放大的关键词/数字 */
  headlineNumber: string;
  /** 主标题后缀（可选，跟在数字后面） */
  headlineTail?: string;
  /** 悬念副题：制造好奇，不揭晓答案 */
  teaser: string;
  /** 分类（大厅、统计与筛选用；卡面不展示） */
  category: string;
  /** 氛围色对 [起点, 终点]：海报色层与分享卡画布共用 */
  colors: readonly [string, string];
  /** 强调色：高亮主标题关键词，冷色画面里唯一的亮色 */
  accent: string;
  /** 分享卡二维码下方的强利益诱导文案 */
  qrHint: string;
  /** 原文链接（可选） */
  sourceUrl?: string;
}

/** 真实知乎热榜提炼（2026-09-13 抓取，2026-09-14 按海报调性重写文案） */
export const FLASH_CARDS: FlashCardData[] = [
  {
    id: "flash-yida",
    question: "河北医大二院工作人员先后收受贿赂46次，累计涉案1.84亿元",
    sourceUrl: "https://www.zhihu.com/question/2082440100701548705/answer/2082478418482967389",
    headlineLead: "涉案",
    headlineNumber: "1.84 亿",
    teaser: "为什么 46 次伸手，一次都没被发现？",
    category: "法治",
    colors: ["#0a1020", "#16233c"],
    accent: "#ff3b47",
    qrHint: CARD_QR_HINT,
  },
  {
    id: "flash-pangdonglai",
    question: "于东来称胖东来再招员工都是学员性质，合同四年不续签",
    sourceUrl: "https://www.zhihu.com/question/2082486057405362877/answer/2082761852782752283",
    headlineLead: "顶薪配导师，合同只签",
    headlineNumber: "4 年",
    teaser: "「对员工好」，为什么必须写上一个期限？",
    category: "商业",
    colors: ["#08191b", "#123330"],
    accent: "#2fd6b0",
    qrHint: CARD_QR_HINT,
  },
  {
    id: "flash-qingchao",
    question: "清朝人口为何从1400万迅速长到4亿",
    sourceUrl: "https://www.zhihu.com/question/528355615/answer/2082539417672201153",
    headlineLead: "清朝人口翻了",
    headlineNumber: "30 倍",
    teaser: "不是突然能生了，是终于不用再饿死？",
    category: "历史",
    colors: ["#1a1206", "#3d2a0c"],
    accent: "#ffb03a",
    qrHint: CARD_QR_HINT,
  },
  {
    id: "flash-beida",
    question: "男生去年考上北大医学部放弃，2026年又考进北大图灵班",
    sourceUrl: "https://www.zhihu.com/question/2082370923865420719/answer/2082564771564492546",
    headlineLead: "考上北大医学部他退学了，",
    headlineNumber: "1 年",
    headlineTail: "后重考进图灵班",
    teaser: "那一年，真的是浪费吗？",
    category: "教育",
    colors: ["#081124", "#1a2f5c"],
    accent: "#5b8cff",
    qrHint: "扫码看那一年他做了什么",
  },
  {
    id: "flash-hyrox",
    question: "HYROX 外国选手失禁完赛，其排泄物会影响其他选手健康吗",
    sourceUrl: "https://www.zhihu.com/question/2082790239286682306/answer/2082827962756359109",
    headlineLead: "把「完赛」当成唯一目标，",
    headlineNumber: "1 次失禁",
    headlineTail: "只是开始",
    teaser: "规则里写了吐痰罚时，却没写「要不要停下来」？",
    category: "人性实验",
    colors: ["#1c0a07", "#3d140c"],
    accent: "#ff5a3c",
    qrHint: "扫码看这场争议的两边",
  },
  {
    id: "flash-yuren",
    question: "罗永浩吐槽野人先生太难吃，网友喊话官方不要回答",
    sourceUrl: "https://zhuanlan.zhihu.com/p/2082513104450209133",
    headlineLead: "被公开差评后，",
    headlineNumber: "第 1 句话",
    headlineTail: "就决定了输赢",
    teaser: "被点名那一刻，先讲道理还是先接住情绪？",
    category: "商业",
    colors: ["#080c24", "#1b2260"],
    accent: "#7b8cff",
    qrHint: "扫码看这场舆情怎么收场",
  },
  {
    id: "flash-lpl",
    question: "LPL 2026 赛季季后赛总决赛 AL 3:1 击败 BLG 夺得总冠军",
    sourceUrl: "https://www.zhihu.com/question/2082449921253303582/answer/2082540773061543446",
    headlineLead: "镜头只给到举杯的 5 个人，",
    headlineNumber: "另一队",
    headlineTail: "刚打完最后一场",
    teaser: "冠军只有一个，为什么所有人都练了一整年？",
    category: "体育",
    colors: ["#061726", "#0f3f60"],
    accent: "#3fc0ff",
    qrHint: "扫码看这个赛季的另一种结局",
  },
  {
    id: "flash-nezha",
    question: "浙江太乙圣莲拟 30 亿元入主哪吒汽车",
    sourceUrl: "https://www.zhihu.com/question/2081827882993823882/answer/2082177893552100171",
    headlineLead: "出价",
    headlineNumber: "30 亿",
    headlineTail: "买下哪吒汽车",
    teaser: "已经卖出去的那批车，打算怎么买回来？",
    category: "商业",
    colors: ["#160c28", "#301a5c"],
    accent: "#a86bff",
    qrHint: "扫码看这笔钱买得到什么",
  },
  {
    id: "flash-duo",
    question: "苹果宣布 app 可以直接获取 iPhone Duo 铰链开合角度",
    sourceUrl: "https://www.zhihu.com/question/2081661494270415480/answer/2082499610619142729",
    headlineLead: "从",
    headlineNumber: "0—180°",
    headlineTail: "开始，手机知道自己在被怎么用",
    teaser: "半折、合拢、展开——它凭什么知道？",
    category: "硬核脑洞",
    colors: ["#061619", "#0e353d"],
    accent: "#2fd0e0",
    qrHint: "扫码看这个角度能做什么",
  },
  {
    id: "flash-liangbandao",
    question: "勇哥餐饮事件：火锅店实为两班倒，并非员工单人工作17小时",
    sourceUrl: "https://www.zhihu.com/question/2081927215936189203/answer/2082459873523118707",
    headlineLead: "「一个人干",
    headlineNumber: "17 小时",
    headlineTail: "」和「两班倒」的差别",
    teaser: "差的不是体力，是账本？",
    category: "社会",
    colors: ["#141004", "#3a2d0e"],
    accent: "#ffc247",
    qrHint: "扫码看两种讲法背后的账",
  },
];

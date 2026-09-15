/**
 * 分享卡出图（canvas 750×1200 PNG）——两种模式：
 *
 * 1) headline：金句闪卡的海报卡。看山大脸铺满画面（大眼审视、鼻子贴镜头），
 *    标题党主标题 + 高饱和数字 + 悬念副题，二维码缩小并配强利益诱导。
 * 2) quote：划线金句。用户在回答里划中的那句话做主角，扫码回到原文那一句。
 *
 * 两种模式共用：加载图、避头尾换行、二维码落地（扫码回到对应位置并高亮）。
 */
import type { FlashCardData } from "@/lib/story/flash";
import { MASCOT_PEEK, MASCOT_STILL } from "@/lib/story/mascot";

/** 海报卡（金句闪卡）：标题党 + 悬念 */
export interface HeadlineCardInput {
  mode: "headline";
  /** 主标题前缀 */
  headlineLead: string;
  /** 高饱和放大的关键词/数字 */
  headlineNumber: string;
  /** 主标题后缀 */
  headlineTail?: string;
  /** 悬念副题 */
  teaser: string;
  /** 来源（知乎热榜提问） */
  source: string;
  /** 冷色底 [起点, 终点] */
  colors: readonly [string, string];
  /** 强调色 */
  accent: string;
  /** 二维码下方诱导语 */
  qrHint?: string;
}

/** 划线金句卡：用户划中的那句话做主角 */
export interface QuoteLineCardInput {
  mode: "quote";
  quote: string;
  source: string;
  meta?: string;
  label?: string;
  colors: readonly [string, string];
  qrHint?: string;
}

export type QuoteCardInput = HeadlineCardInput | QuoteLineCardInput;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 中文排版避头尾：这些字符不允许出现在行首（宁可让上一行略微超宽） */
const NO_LINE_START = new Set([..."，。！？；：、」』）】〉》—…·"]);

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const char of text) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line && !NO_LINE_START.has(char)) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** 等比铺满（cover）并居中绘制 */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** 白底圆角二维码 + 下方/侧边诱导语 */
function drawQr(
  ctx: CanvasRenderingContext2D,
  qr: HTMLImageElement,
  boxX: number,
  boxY: number,
  size: number,
  hint: string,
  hintAlign: "right" | "below",
  W: number,
  pad: number,
) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(boxX - 8, boxY - 8, size + 16, size + 16, 14);
  ctx.fill();
  ctx.drawImage(qr, boxX, boxY, size, size);

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = "600 25px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.textAlign = hintAlign === "right" ? "right" : "center";
  if (hintAlign === "right") {
    ctx.fillText(hint, W - pad, boxY + size + 44);
  } else {
    ctx.fillText(hint, boxX + size / 2, boxY + size + 44);
  }
  ctx.textAlign = "left";
}

/** ① 海报卡：看山大脸 + 标题党 + 悬念 + 小二维码 */
async function renderHeadlineCard(
  ctx: CanvasRenderingContext2D,
  input: HeadlineCardInput,
  qrDataUrl: string,
  W: number,
  H: number,
) {
  const pad = 64;

  // 看山大脸铺满画面
  try {
    const peek = await loadImage(MASCOT_PEEK);
    drawCover(ctx, peek, 0, 0, W, H);
  } catch {
    /* 素材缺失时退回纯色底 */
  }

  // 冷色层：用卡片自己的冷色给画面染色（上重下轻，保持大脸可见）
  const tint = ctx.createLinearGradient(0, 0, W * 0.4, H);
  tint.addColorStop(0, `${input.colors[0]}d9`);
  tint.addColorStop(0.55, `${input.colors[1]}59`);
  tint.addColorStop(1, `${input.colors[1]}bf`);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);

  // 文字区压暗（顶部）+ 底部托底
  const topScrim = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  topScrim.addColorStop(0, "rgba(6,10,20,0.94)");
  topScrim.addColorStop(0.55, "rgba(6,10,20,0.62)");
  topScrim.addColorStop(1, "rgba(6,10,20,0)");
  ctx.fillStyle = topScrim;
  ctx.fillRect(0, 0, W, H * 0.62);

  const bottomScrim = ctx.createLinearGradient(0, H * 0.66, 0, H);
  bottomScrim.addColorStop(0, "rgba(6,10,20,0)");
  bottomScrim.addColorStop(1, "rgba(5,8,16,0.85)");
  ctx.fillStyle = bottomScrim;
  ctx.fillRect(0, H * 0.66, W, H * 0.34);

  const maxWidth = W - pad * 2;

  // 主标题前缀
  let y = 150;
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.font = "500 33px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(input.headlineLead, pad, y);

  // 高饱和关键词：大到能当画面主角，太宽自动降字号
  y += 118;
  let numFont = 132;
  ctx.font = `800 ${numFont}px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
  while (ctx.measureText(input.headlineNumber).width > maxWidth && numFont > 64) {
    numFont -= 6;
    ctx.font = `800 ${numFont}px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
  }
  ctx.fillStyle = input.accent;
  ctx.fillText(input.headlineNumber, pad, y);

  // 主标题后缀
  if (input.headlineTail) {
    y += 62;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.font = "600 36px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    for (const line of wrapText(ctx, input.headlineTail, maxWidth).slice(0, 2)) {
      ctx.fillText(line, pad, y);
      y += 50;
    }
  }

  // 悬念副题（与数字拉开距离，避免贴到一起）
  y += 66;
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.font = "400 31px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  for (const line of wrapText(ctx, input.teaser, maxWidth).slice(0, 3)) {
    ctx.fillText(line, pad, y);
    y += 46;
  }

  // 来源（小字，压在画面中部偏下）
  y += 20;
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.font = "400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  for (const line of wrapText(ctx, input.source, maxWidth).slice(0, 2)) {
    ctx.fillText(line, pad, y);
    y += 34;
  }

  // 品牌（左下）
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = "700 24px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("看山画境", pad, H - 58);

  // 二维码（缩小，右下角）+ 强利益诱导
  try {
    const qr = await loadImage(qrDataUrl);
    const size = 138;
    drawQr(ctx, qr, W - pad - size, H - 98 - size, size, input.qrHint ?? CARD_QR_HINT, "right", W, pad);
  } catch {
    /* 二维码失败不阻塞 */
  }
}

/** ② 划线金句卡：用户划中的那句话做主角 */
async function renderQuoteCard(
  ctx: CanvasRenderingContext2D,
  input: QuoteLineCardInput,
  qrDataUrl: string,
  W: number,
  H: number,
) {
  const pad = 72;

  const bg = ctx.createLinearGradient(0, 0, W * 0.5, H);
  bg.addColorStop(0, input.colors[0]);
  bg.addColorStop(1, input.colors[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "500 26px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(input.label ?? "金 句 闪 卡", pad, 140);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, 178);
  ctx.lineTo(pad + 90, 178);
  ctx.stroke();

  let quoteFont = 64;
  let quoteLines: string[] = [];
  for (; quoteFont >= 44; quoteFont -= 4) {
    ctx.font = `700 ${quoteFont}px 'Songti SC', SimSun, serif`;
    quoteLines = wrapText(ctx, input.quote, W - pad * 2);
    if (quoteLines.length <= 4) break;
  }
  ctx.fillStyle = "#ffffff";
  const lineHeight = quoteFont * 1.55;
  const quoteTop = 470;
  quoteLines.forEach((line, i) => {
    ctx.fillText(line, pad, quoteTop + i * lineHeight);
  });
  const quoteEnd = quoteTop + Math.max(quoteLines.length - 1, 0) * lineHeight;

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "400 28px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  const sourceLines = wrapText(ctx, input.source, W - pad * 2).slice(0, 2);
  sourceLines.forEach((line, i) => {
    ctx.fillText(line, pad, quoteEnd + 74 + i * 46);
  });

  if (input.meta) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText(input.meta, pad, quoteEnd + 74 + sourceLines.length * 46 + 26);
  }

  const dividerY = H - 280;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, dividerY);
  ctx.lineTo(W - pad, dividerY);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = "700 26px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("看山画境", pad, dividerY + 46);
  const brandWidth = ctx.measureText("看山画境").width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = "400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("· 每一篇好回答，都是一幅能走进去的画", pad + brandWidth + 14, dividerY + 46);

  try {
    const mascot = await loadImage(MASCOT_STILL.greeting);
    const scale = Math.min(200 / mascot.naturalHeight, 210 / mascot.naturalWidth);
    const mw = mascot.naturalWidth * scale;
    const mh = mascot.naturalHeight * scale;
    const mx = pad;
    const my = H - 24 - mh;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(mx + mw / 2, my + mh / 2, Math.min(Math.max(mw, mh) * 0.62, 100), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(mx + mw / 2, my + mh / 2);
    ctx.rotate(-0.07);
    ctx.drawImage(mascot, -mw / 2, -mh / 2, mw, mh);
    ctx.restore();
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "700 30px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText("吱～", mx + mw + 6, my + 46);
  } catch {
    /* 看山加载失败不影响卡片 */
  }

  try {
    const qr = await loadImage(qrDataUrl);
    const size = 148;
    const boxX = W - pad - size - 8;
    const boxY = dividerY + 56;
    drawQr(ctx, qr, boxX, boxY, size, input.qrHint ?? CARD_QR_HINT, "below", W, pad);
  } catch {
    /* 二维码失败不阻塞 */
  }
}

/** 生成竖版分享卡（750×1200 PNG dataURL）。 */
export async function generateQuoteCard(input: QuoteCardInput, qrDataUrl: string): Promise<string> {
  const W = 750;
  const H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  if (input.mode === "headline") {
    await renderHeadlineCard(ctx, input, qrDataUrl, W, H);
  } else {
    await renderQuoteCard(ctx, input, qrDataUrl, W, H);
  }

  return canvas.toDataURL("image/png");
}

/** 金句闪卡 → 海报卡输入 */
export function flashToQuote(card: FlashCardData): QuoteCardInput {
  return {
    mode: "headline",
    headlineLead: card.headlineLead,
    headlineNumber: card.headlineNumber,
    headlineTail: card.headlineTail,
    teaser: card.teaser,
    source: card.question,
    colors: card.colors,
    accent: card.accent,
    qrHint: card.qrHint,
  };
}

/** 兼容旧调用：直接由闪卡出图 */
export function generateFlashCard(card: FlashCardData, qrDataUrl: string): Promise<string> {
  return generateQuoteCard(flashToQuote(card), qrDataUrl);
}

export function buildFlashShareText(card: FlashCardData): string {
  const headline = `${card.headlineLead}${card.headlineNumber}${card.headlineTail ?? ""}`;
  return `${headline}——${card.teaser}（来自知乎热榜「${card.question}」）`;
}

/** 分享文案（两种模式通用） */
export function buildQuoteShareText(input: QuoteCardInput): string {
  if (input.mode === "headline") {
    const headline = `${input.headlineLead}${input.headlineNumber}${input.headlineTail ?? ""}`;
    return `${headline}——${input.teaser}（来自知乎热榜「${input.source}」）`;
  }
  return `在知乎读到一句：「${input.quote}」——出自「${input.source}」。`;
}

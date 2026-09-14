/**
 * 金句卡（canvas 生成 750×1200 PNG）——闪卡与"划线金句"共用同一套出图逻辑。
 *
 * 对应 PRD 的划线金句闭环：金句是钩子，扫卡上的二维码，
 * 打开会直接落在这句金句所在的位置（闪卡 / 原文段落）并高亮。
 */
import type { FlashCardData } from "@/lib/story/flash";
import { MASCOT_STILL } from "@/lib/story/mascot";

/** 出图所需的通用输入：闪卡和划线都归一到这个结构 */
export interface QuoteCardInput {
  /** 那句金句 */
  quote: string;
  /** 来源：原提问 / 回答标题 */
  source: string;
  /** 来源说明，如「2340 万热度」「知乎回答」 */
  meta?: string;
  /** 顶部标签，默认「金 句 闪 卡」 */
  label?: string;
  /** 氛围色对 [起点, 终点] */
  colors: readonly [string, string];
  /** 背景装饰字；缺省取金句的首个汉字 */
  glyph?: string;
  /** 二维码下方的提示语 */
  qrHint?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const char of text) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function pickGlyph(input: QuoteCardInput): string {
  if (input.glyph) return input.glyph;
  const chinese = input.quote.match(/[\u4e00-\u9fa5]/);
  return chinese ? chinese[0]! : "句";
}

/** 生成竖版金句卡（750×1200 PNG dataURL）。 */
export async function generateQuoteCard(input: QuoteCardInput, qrDataUrl: string): Promise<string> {
  const W = 750;
  const H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, W * 0.5, H);
  bg.addColorStop(0, input.colors[0]);
  bg.addColorStop(1, input.colors[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 超大话题字，右上角半透明衬线
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 400px 'Songti SC', SimSun, serif";
  ctx.textAlign = "right";
  ctx.fillText(pickGlyph(input), W + 40, 360);
  ctx.restore();

  const pad = 72;
  ctx.textAlign = "left";

  // 顶部标签
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "500 26px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(input.label ?? "金 句 闪 卡", pad, 140);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, 178);
  ctx.lineTo(pad + 90, 178);
  ctx.stroke();

  // 金句：衬线大字，自动换行；过长时自动降字号
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

  // 来源
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

  // 底部分隔
  const ctaY = H - 220;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, ctaY - 46);
  ctx.lineTo(W - pad, ctaY - 46);
  ctx.stroke();

  // 看山 + 署名
  try {
    const mascot = await loadImage(MASCOT_STILL.greeting);
    ctx.drawImage(mascot, pad, ctaY - 16, 96, 96);
  } catch {
    /* 看山加载失败不影响卡片 */
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = "600 28px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("看山画境", pad + 112, ctaY + 30);
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = "400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("每一篇好回答，都是一幅能走进去的画", pad + 112, ctaY + 66);

  // 二维码（右下角，白底圆角）
  try {
    const qr = await loadImage(qrDataUrl);
    const size = 148;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(W - pad - size - 8, ctaY - 16, size + 16, size + 16, 14);
    ctx.fill();
    ctx.drawImage(qr, W - pad - size, ctaY - 8, size, size);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "400 20px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(input.qrHint ?? "扫码回到这句金句", W - pad, ctaY + size + 32);
    ctx.textAlign = "left";
  } catch {
    /* 二维码失败不阻塞 */
  }

  return canvas.toDataURL("image/png");
}

/** 金句闪卡 → 通用出图输入 */
export function flashToQuote(card: FlashCardData): QuoteCardInput {
  return {
    quote: card.quote,
    source: card.question,
    meta: card.heat,
    label: `金 句 闪 卡 · ${card.category}`,
    colors: card.colors,
    glyph: card.glyph,
  };
}

/** 兼容旧调用：直接由闪卡出图 */
export function generateFlashCard(card: FlashCardData, qrDataUrl: string): Promise<string> {
  return generateQuoteCard(flashToQuote(card), qrDataUrl);
}

export function buildFlashShareText(card: FlashCardData): string {
  return `「${card.quote}」——来自知乎热榜「${card.question}」。这句话值得你停下来看一眼。`;
}

/** 划线金句的分享文案 */
export function buildQuoteShareText(input: QuoteCardInput): string {
  return `在知乎读到一句：「${input.quote}」——出自「${input.source}」。`;
}

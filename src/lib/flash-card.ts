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

  // 超大话题字：按实际墨迹边界计算位置与字号，保证整字完整落在卡内右上角
  const glyphChar = pickGlyph(input);
  const glyphMargin = 44; // 距画布上/右边距
  const glyphMax = 380; // 墨迹目标边长
  let glyphFont = 420;
  ctx.font = `900 ${glyphFont}px 'Songti SC', SimSun, serif`;
  const probe = ctx.measureText(glyphChar);
  const probeW = probe.actualBoundingBoxLeft + probe.actualBoundingBoxRight;
  const probeH = probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent;
  if (probeW > 0 && probeH > 0) {
    glyphFont = Math.round(glyphFont * Math.min(1, glyphMax / Math.max(probeW, probeH)));
  }
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${glyphFont}px 'Songti SC', SimSun, serif`;
  ctx.textAlign = "left";
  const gm = ctx.measureText(glyphChar);
  const glyphX = W - glyphMargin - (gm.actualBoundingBoxRight || 0);
  const glyphY = glyphMargin + (gm.actualBoundingBoxAscent || glyphFont * 0.8);
  ctx.fillText(glyphChar, glyphX, glyphY);
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

  // ── 底部品牌区（Y=920 以下）：分隔线 → 品牌行 → 左看山 / 右二维码 ──
  // 布局约束：品牌行占满整宽但绝不进入底部带；看山与二维码分列左右两端，
  // 中间留空，任何两个元素都不重叠。
  const dividerY = H - 280;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, dividerY);
  ctx.lineTo(W - pad, dividerY);
  ctx.stroke();

  // 品牌行：看山画境 · slogan（一行排开，整行可用宽度 606px，约需 520px）
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = "700 26px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("看山画境", pad, dividerY + 46);
  const brandWidth = ctx.measureText("看山画境").width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = "400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("· 每一篇好回答，都是一幅能走进去的画", pad + brandWidth + 14, dividerY + 46);

  // 看山：左下角大尺寸主角——保持原始宽高比（不再压扁）、轻微倾斜显萌、
  // 背后一团柔光晕让它从氛围色里跳出来。
  try {
    const mascot = await loadImage(MASCOT_STILL.greeting);
    const scale = Math.min(200 / mascot.naturalHeight, 210 / mascot.naturalWidth);
    const mw = mascot.naturalWidth * scale;
    const mh = mascot.naturalHeight * scale;
    const mx = pad;
    const my = H - 24 - mh;
    // 柔光晕
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(mx + mw / 2, my + mh / 2, Math.min(Math.max(mw, mh) * 0.62, 100), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 轻微左倾，像是在跟读卡的人打招呼
    ctx.save();
    ctx.translate(mx + mw / 2, my + mh / 2);
    ctx.rotate(-0.07);
    ctx.drawImage(mascot, -mw / 2, -mh / 2, mw, mh);
    ctx.restore();
    // 看山的声音
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "700 30px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText("吱～", mx + mw + 6, my + 46);
  } catch {
    /* 看山加载失败不影响卡片 */
  }

  // 二维码（右下角，白底圆角 + 正下方提示；与左侧看山互不侵犯）
  try {
    const qr = await loadImage(qrDataUrl);
    const size = 148;
    const boxX = W - pad - size - 16;
    const boxY = dividerY + 56;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, size + 16, size + 16, 14);
    ctx.fill();
    ctx.drawImage(qr, boxX + 8, boxY + 8, size, size);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "400 20px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(input.qrHint ?? "扫码回到这句金句", W - pad, boxY + size + 16 + 32);
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

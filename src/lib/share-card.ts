import type { Ending, Story } from "@/lib/story";

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

/** 生成竖版结局分享卡片（750×1200 PNG dataURL），用于保存/分享。 */
export async function generateEndingCard(story: Story, ending: Ending): Promise<string> {
  const W = 750;
  const H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  // 背景：楼道场景 cover 绘制
  const bg = await loadImage(story.background);
  const scale = Math.max(W / bg.width, H / bg.height);
  const bw = bg.width * scale;
  const bh = bg.height * scale;
  ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);

  // 暗色渐变，保证文字可读
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(8, 12, 24, 0.55)");
  grad.addColorStop(0.45, "rgba(8, 12, 24, 0.35)");
  grad.addColorStop(1, "rgba(8, 12, 24, 0.92)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const pad = 72;
  ctx.textAlign = "left";

  // 顶部标签
  ctx.fillStyle = "rgba(255, 196, 120, 0.95)";
  ctx.font = "500 26px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("穿 越 进 高 赞 回 答", pad, 150);

  // 分隔线
  ctx.strokeStyle = "rgba(255, 196, 120, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, 190);
  ctx.lineTo(pad + 90, 190);
  ctx.stroke();

  // 结局标签
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "400 28px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(`我在「${story.card.question}」抵达的结局`, pad, 480);

  // 结局称号
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 68px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(`「${ending.title}」`, pad, 570);

  // 结局文案（自动换行）
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "400 34px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  const lines = wrapText(ctx, ending.summary, W - pad * 2);
  lines.forEach((line, i) => {
    ctx.fillText(line, pad, 660 + i * 56);
  });

  // 底部 CTA
  const ctaY = H - 200;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, ctaY - 50);
  ctx.lineTo(W - pad, ctaY - 50);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "500 30px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("从听故事的人，变成写故事的人。", pad, ctaY + 10);

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("点进这条回答，穿越进它的世界 →", pad, ctaY + 60);

  return canvas.toDataURL("image/png");
}

export function buildShareText(story: Story, ending: Ending): string {
  return `我穿越进了高赞回答「${story.card.question}」，抵达结局《${ending.title}》——${ending.summary} 你也来试试，点进回答就能穿越进它的世界。`;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

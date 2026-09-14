import { ArrowUpRight, Quote, Share2 } from "lucide-react";
import { useState } from "react";

import { QuoteCardSheet } from "@/components/story/QuoteCardSheet";
import { buildFlashShareText, flashToQuote } from "@/lib/flash-card";
import type { FlashCardData } from "@/lib/story/flash";
import { mascotFor } from "@/lib/story/mascot";

/**
 * 金句闪卡（L3）：不是所有文章都有世界线，
 * 但几乎任何一条好内容都能被提炼成"一句话 + 一个画面"。
 *
 * 排版：金句、解读、两个出口**全部叠在卡片本身**（渐变海报）上。
 * 视觉层级：金句（30px 衬线 + 装饰引号）> 解读（白 70%）> 来源（白 50%）。
 * 热度与标签并列在左上，大话题字独占右上——两者互不干扰。
 * 闪卡是钩子，原讨论才是鱼塘。
 */
export function FlashCard({ card }: { card: FlashCardData }) {
  const [shareOpen, setShareOpen] = useState(false);
  const searchUrl = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(card.question)}`;

  return (
    <div id={`flashcard-${card.id}`} className="relative scroll-mt-24 transition-shadow duration-500">
      <div
        className="group relative flex min-h-[430px] flex-col overflow-hidden px-5 py-5"
        style={{ background: `linear-gradient(160deg, ${card.colors[0]}, ${card.colors[1]})` }}
      >
        {/* 超大半透明话题字：独占右上角，向右上方溢出，与左上文字区互不干扰 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-16 select-none text-[200px] font-black leading-none text-white/10 [font-family:'Songti_SC',SimSun,serif]"
        >
          {card.glyph}
        </span>
        {/* 底部阅读渐变：让白色文字在任何氛围色上都立得住 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(180deg,transparent,oklch(0_0_0/45%))]"
        />

        {/* 顶部：标签 + 热度（并列在左上） */}
        <div className="relative flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium tracking-widest text-white/85 backdrop-blur-sm">
            <Quote className="size-3" />
            金句闪卡 · {card.category}
          </span>
          <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
            {card.heat}
          </span>
        </div>

        {/* 金句：海报主角。装饰引号 + 30px 衬线加粗 */}
        <div className="relative mt-auto pt-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-4 -left-1 select-none text-[68px] font-black leading-none text-white/25 [font-family:'Songti_SC',SimSun,serif]"
          >
            “
          </span>
          <p className="relative text-[30px] font-bold leading-[1.5] tracking-[0.01em] text-white drop-shadow-[0_2px_14px_oklch(0_0_0/55%)] [font-family:'Songti_SC',SimSun,serif]">
            {card.quote}
          </p>
        </div>

        {/* 解读：第二层级，白 70% */}
        <p className="relative mt-3.5 text-[13.5px] leading-[1.85] text-white/70">{card.context}</p>

        {/* 两个出口：白底为主、描边为副，在深色卡面上都清晰 */}
        <div className="relative mt-4 flex flex-wrap items-center gap-2 pr-12">
          <a
            href={card.sourceUrl ?? searchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-white/12 px-3.5 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            看讨论
            <ArrowUpRight className="size-3.5" />
          </a>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-kanshan-deep transition-colors hover:bg-white/90"
          >
            <Share2 className="size-3.5" />
            生成金句
          </button>
        </div>

        {/* 来源小字（脚注）：第三层级，白 50% */}
        <p className="relative mt-3 truncate pr-14 text-[11.5px] text-white/50">{card.question}</p>

        {/* 右下角看山：这张卡也是它画的 */}
        <img
          src={mascotFor(card.id)}
          alt=""
          aria-hidden="true"
          width={80}
          height={80}
          className="absolute bottom-3.5 right-3.5 size-12 object-contain opacity-95 transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {shareOpen && (
        <QuoteCardSheet
          input={flashToQuote(card)}
          shareUrl={`${window.location.origin}/?flash=${card.id}`}
          shareText={buildFlashShareText(card)}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

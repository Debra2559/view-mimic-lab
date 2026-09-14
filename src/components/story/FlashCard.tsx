import { ArrowUpRight, ChevronDown, Quote, Share2 } from "lucide-react";
import { useState } from "react";

import { QuoteCardSheet } from "@/components/story/QuoteCardSheet";
import { buildFlashShareText, flashToQuote } from "@/lib/flash-card";
import type { FlashCardData } from "@/lib/story/flash";
import { mascotFor } from "@/lib/story/mascot";

/**
 * 金句闪卡（L3）：不是所有文章都有世界线，
 * 但几乎任何一条好内容都能被提炼成"一句话 + 一个画面"。
 *
 * 点击卡片展开一层轻解读，并给出回到知乎原讨论的出口——
 * 闪卡是钩子，原讨论才是鱼塘。
 */
export function FlashCard({ card }: { card: FlashCardData }) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const searchUrl = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(card.question)}`;

  return (
    <li
      id={`flashcard-${card.id}`}
      className="relative scroll-mt-24 transition-shadow duration-500"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`金句闪卡：${card.quote}（点击${open ? "收起" : "展开"}解读）`}
        className="group block w-full cursor-pointer text-left"
      >
        {/* 氛围画面区 */}
        <div
          className="relative aspect-[16/9] overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${card.colors[0]}, ${card.colors[1]})` }}
        >
          {/* 超大半透明话题字，当背景 */}
          <span
            aria-hidden="true"
            className="absolute -right-4 -top-9 select-none text-[190px] font-black leading-none text-white/10 [font-family:'Songti_SC',SimSun,serif]"
          >
            {card.glyph}
          </span>

          {/* 顶部标签 */}
          <span className="absolute left-4 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium tracking-widest text-white/85 backdrop-blur-sm">
            <Quote className="size-3" />
            金句闪卡 · {card.category}
          </span>

          {/* 金句本体 */}
          <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-[21px] font-bold leading-[1.7] text-white drop-shadow-[0_2px_12px_oklch(0_0_0/40%)] [font-family:'Songti_SC',SimSun,serif]">
            {card.quote}
          </p>

          {/* 右下角看山：这张卡也是它画的 */}
          <img
            src={mascotFor(card.id)}
            alt=""
            aria-hidden="true"
            width={72}
            height={72}
            className="absolute bottom-3 right-3 size-9 object-contain opacity-95 transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* 底部信息条 */}
        <div className="flex items-center gap-2.5 border-b border-border bg-background px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
            {card.question}
          </span>
          <span className="shrink-0 text-[12px] text-muted-foreground/70">{card.heat}</span>
          <ChevronDown
            className={`size-4 shrink-0 text-kanshan-blue transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* 展开：轻解读 + 回到原讨论的出口 */}
      {open && (
        <div className="border-b border-border bg-kanshan-sky/35 px-4 py-3.5">
          <p className="text-[13.5px] leading-[1.85] text-foreground/80">{card.context}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={card.sourceUrl ?? searchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-kanshan-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-kanshan-blue transition-colors hover:border-kanshan-blue/40 hover:bg-kanshan-sky"
            >
              去知乎看这条讨论
              <ArrowUpRight className="size-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-kanshan-blue px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-kanshan-deep"
            >
              <Share2 className="size-3.5" />
              生成金句卡
            </button>
          </div>
        </div>
      )}

      {shareOpen && (
        <QuoteCardSheet
          input={flashToQuote(card)}
          shareUrl={`${window.location.origin}/?flash=${card.id}`}
          shareText={buildFlashShareText(card)}
          onClose={() => setShareOpen(false)}
        />
      )}
    </li>
  );
}

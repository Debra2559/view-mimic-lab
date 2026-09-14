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
 * 排版：金句、解读、两个出口**全部叠在卡片本身**（渐变海报）上——
 * 不再有卡片下方的第二块白色区域；用户读完想行动，直接点「看讨论」或「生成金句」。
 * 闪卡是钩子，原讨论才是鱼塘。
 */
export function FlashCard({ card }: { card: FlashCardData }) {
  const [shareOpen, setShareOpen] = useState(false);
  const searchUrl = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(card.question)}`;

  return (
    <li id={`flashcard-${card.id}`} className="relative scroll-mt-24 transition-shadow duration-500">
      <div
        className="group relative flex min-h-[430px] flex-col overflow-hidden px-5 py-5"
        style={{ background: `linear-gradient(160deg, ${card.colors[0]}, ${card.colors[1]})` }}
      >
        {/* 超大半透明话题字，当背景 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -top-10 select-none text-[190px] font-black leading-none text-white/10 [font-family:'Songti_SC',SimSun,serif]"
        >
          {card.glyph}
        </span>
        {/* 底部阅读渐变：让白色文字在任何氛围色上都立得住 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(180deg,transparent,oklch(0_0_0/45%))]"
        />

        {/* 顶部：标签 + 热度 */}
        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium tracking-widest text-white/85 backdrop-blur-sm">
            <Quote className="size-3" />
            金句闪卡 · {card.category}
          </span>
          <span className="mt-0.5 shrink-0 text-[11.5px] text-white/70">{card.heat}</span>
        </div>

        {/* 金句本体：贴着下半部分，像海报的主标题 */}
        <p className="relative mt-auto text-[26px] font-bold leading-[1.6] text-white drop-shadow-[0_2px_12px_oklch(0_0_0/50%)] [font-family:'Songti_SC',SimSun,serif]">
          {card.quote}
        </p>

        {/* 解读：也叠在卡上 */}
        <p className="relative mt-3.5 text-[13.5px] leading-[1.85] text-white/80">{card.context}</p>

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

        {/* 来源小字（脚注） */}
        <p className="relative mt-3 truncate pr-14 text-[11.5px] text-white/55">{card.question}</p>

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
    </li>
  );
}

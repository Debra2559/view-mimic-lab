import { ArrowUpRight, Quote, Share2 } from "lucide-react";
import { useState } from "react";

import { QuoteCardSheet } from "@/components/story/QuoteCardSheet";
import { buildFlashShareText, flashToQuote } from "@/lib/flash-card";
import type { FlashCardData } from "@/lib/story/flash";
import { mascotFor } from "@/lib/story/mascot";

/**
 * 金句闪卡（L3）· 海报入口卡
 *
 * 主页上的形态与「分享出去的金句卡」一致：氛围底 + 超大话题字 + 衬线金句 + 看山署名。
 * 它只负责吸引点击 —— 整卡点击直接跳到知乎原讨论（金句是钩子，原文是鱼塘），
 * 不再在信息流里展开解读与选项。
 * 右上角保留一个小分享按钮，用于生成可分享的金句卡（延续分享闭环）。
 */
export function FlashCard({ card }: { card: FlashCardData }) {
  const [shareOpen, setShareOpen] = useState(false);
  const targetUrl =
    card.sourceUrl ?? `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(card.question)}`;

  return (
    <div id={`flashcard-${card.id}`} className="relative scroll-mt-24">
      <div
        className="group relative flex min-h-[420px] flex-col overflow-hidden px-5 py-5"
        style={{ background: `linear-gradient(160deg, ${card.colors[0]}, ${card.colors[1]})` }}
      >
        {/* 超大半透明话题字：完整落在卡片右上角内 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-7 select-none text-[156px] font-black leading-[1.25] text-white/10 [font-family:'Songti_SC',SimSun,serif]"
        >
          {card.glyph}
        </span>
        {/* 底部阅读渐变：让白色文字在任何氛围色上都立得住 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(180deg,transparent,oklch(0_0_0/45%))]"
        />

        {/* 顶部：类型 + 热度（左侧让出右上角给大字与分享按钮） */}
        <div className="relative flex items-center gap-2 pr-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium tracking-widest text-white/85 backdrop-blur-sm">
            <Quote className="size-3" />
            金句闪卡 · {card.category}
          </span>
          <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
            {card.heat}
          </span>
        </div>

        {/* 金句：海报主角 */}
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

        {/* 来源 */}
        <p className="relative mt-4 line-clamp-2 pr-14 text-[12.5px] leading-[1.7] text-white/65">
          {card.question}
        </p>

        {/* 点击提示：整卡可点，这里是它的视觉表达 */}
        <div className="relative mt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-kanshan-deep shadow-sm transition-transform duration-200 group-hover:translate-x-0.5">
            看这条讨论
            <ArrowUpRight className="size-4" />
          </span>
        </div>

        {/* 右下角看山署名 */}
        <img
          src={mascotFor(card.id)}
          alt=""
          aria-hidden="true"
          width={80}
          height={80}
          className="absolute bottom-3.5 right-3.5 size-12 object-contain opacity-95 transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {/* 整卡点击层：跳到原文讨论（位于分享按钮之下） */}
      <a
        href={targetUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`看这条讨论：${card.question}`}
        className="absolute inset-0 z-10"
      />

      {/* 分享按钮：置于点击层之上 */}
      <button
        type="button"
        onClick={() => setShareOpen(true)}
        aria-label="生成这张金句卡"
        className="absolute right-3 top-3.5 z-20 grid size-9 place-items-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/50"
      >
        <Share2 className="size-4" />
      </button>

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

import { ArrowUpRight, Share2 } from "lucide-react";
import { useState } from "react";

import { QuoteCardSheet } from "@/components/story/QuoteCardSheet";
import { buildFlashShareText, flashToQuote } from "@/lib/flash-card";
import type { FlashCardData } from "@/lib/story/flash";
import { MASCOT_PEEK } from "@/lib/story/mascot";

/**
 * 金句闪卡（L3）· 海报入口卡（与分享出去的金句卡同一套视觉）
 *
 * 设计约束（2026-09-14 按用户要求重做）：
 * ① 焦点：主标题就是"数字/结论"，用强调色放到最大；原金句改写成悬念副题；
 * ② 精简：去掉背景大字、热度等无效信息；
 * ③ 调性：冷色底 + 唯一的亮色强调（黑白红蓝式警示感）；
 * ④ 出口：可见的「看这条讨论」链接（不再用整卡透明浮层）；
 * ⑤ 画面：看山大脸占据画面——大眼审视、鼻子贴镜头；
 * ⑥ 留白更少：标题、悬念、来源、出口四层紧排，画面高度由内容决定。
 */
export function FlashCard({ card }: { card: FlashCardData }) {
  const [shareOpen, setShareOpen] = useState(false);
  const targetUrl =
    card.sourceUrl ?? `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(card.question)}`;

  return (
    <div id={`flashcard-${card.id}`} className="relative scroll-mt-24">
      <div className="relative flex min-h-[430px] flex-col overflow-hidden px-5 py-5">
        {/* 看山大脸：铺满画面（大眼 + 鼻子贴镜头） */}
        <img
          src={MASCOT_PEEK}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />

        {/* 冷色层：用卡片自己的冷色给画面染色，上重下轻，大脸保持可见 */}
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `linear-gradient(165deg, ${card.colors[0]}d9 0%, ${card.colors[1]}59 55%, ${card.colors[1]}bf 100%)`,
          }}
        />
        {/* 文字区压暗（顶部）+ 底托（下沿） */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[56%] bg-[linear-gradient(180deg,rgba(6,10,20,0.94)_0%,rgba(6,10,20,0.55)_58%,rgba(6,10,20,0)_100%)]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(0deg,rgba(5,8,16,0.85)_0%,rgba(6,10,20,0)_100%)]"
        />

        {/* 顶部：标题党 + 悬念（文字只占上部，把下半张脸让给看山） */}
        <div className="relative pr-12">
          <p className="text-[15px] font-medium tracking-wide text-white/75">{card.headlineLead}</p>
          <p
            className="mt-1 text-[64px] font-black leading-[1.06] tracking-tight"
            style={{ color: card.accent, textShadow: "0 3px 24px rgba(0,0,0,0.55)" }}
          >
            {card.headlineNumber}
          </p>
          {card.headlineTail && (
            <p className="mt-2 text-[19px] font-semibold leading-[1.5] text-white/90">{card.headlineTail}</p>
          )}
          <p className="mt-3 text-[15.5px] leading-[1.7] text-white/70">{card.teaser}</p>
        </div>

        {/* 出口：可见链接（不是整卡浮层） */}
        <div className="relative mt-auto pt-6">
          <a
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`看这条讨论：${card.question}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-kanshan-deep shadow-sm transition-transform duration-200 hover:translate-x-0.5"
          >
            看这条讨论
            <ArrowUpRight className="size-4" />
          </a>
          <p className="mt-3 line-clamp-1 text-[11.5px] text-white/45">{card.question}</p>
        </div>
      </div>

      {/* 分享按钮（生成同款海报卡） */}
      <button
        type="button"
        onClick={() => setShareOpen(true)}
        aria-label="生成这张金句卡"
        className="absolute right-3 top-3.5 z-20 grid size-9 place-items-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/55"
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

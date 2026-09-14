import { ChevronRight, Sparkles } from "lucide-react";

import type { Story } from "@/lib/story";
import { mascotFor } from "@/lib/story/mascot";

/**
 * 金句剧场入口卡（L2）· 海报卡
 *
 * 主页上的形态与分享卡一致：剧场封面图 + 压暗叠字 + 核心抉择。
 * 它只负责吸引点击 —— 整卡点进剧场（真正的剧情在剧场里，不在信息流里）。
 */
export function TheaterEntry({ story, onEnter }: { story: Story; onEnter: (id: string) => void }) {
  const endingCount = Object.keys(story.endings).length;

  return (
    <button
      type="button"
      onClick={() => onEnter(story.id)}
      aria-label={`进入${story.chapterLabel}：${story.card.question}`}
      className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl text-left"
    >
      <div className="relative flex min-h-[400px] flex-col overflow-hidden px-5 py-5">
        {/* 剧场封面 + 压暗，保证白字可读 */}
        {story.card.coverImage ? (
          <img
            src={story.card.coverImage}
            alt={story.backgroundAlt}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0" style={{ background: story.card.cover }} aria-hidden="true" />
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.16_0.03_265/0.55)_0%,oklch(0.13_0.03_265/0.72)_45%,oklch(0.1_0.03_265/0.92)_100%)]"
        />

        {/* 顶部：剧场编号 + 时长 */}
        <div className="relative flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kanshan-blue px-2.5 py-1 text-[11px] font-semibold tracking-widest text-white shadow-sm">
            <Sparkles className="size-3" />
            {story.chapterLabel}
          </span>
          <span className="rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur-sm">
            单幕 · 约 1 分钟
          </span>
        </div>

        {/* 情境 + 核心抉择 */}
        <div className="relative mt-auto pt-8">
          <p className="text-[14px] leading-[1.85] text-white/80">
            {story.introLines[0]}
            {story.introLines[1] && (
              <>
                <br />
                {story.introLines[1]}
              </>
            )}
          </p>

          {/* 核心抉择：海报主标题 */}
          <p className="mt-4 text-[25px] font-bold leading-[1.55] text-white drop-shadow-[0_2px_14px_oklch(0_0_0/55%)] [font-family:'Songti_SC',SimSun,serif]">
            {story.choicePrompt}
          </p>
        </div>

        {/* 点击提示 */}
        <div className="relative mt-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-kanshan-deep shadow-sm">
            进入剧场
            <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>

        {/* 底部署名 */}
        <div className="relative mt-4 flex items-center gap-1.5 pr-14 text-[11.5px] text-white/60">
          <img
            src={mascotFor(story.id)}
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="size-4 shrink-0 object-contain"
          />
          <span>看山画的</span>
          <span className="text-white/30">·</span>
          <span>一次抉择 · {endingCount} 个结局</span>
        </div>
      </div>
    </button>
  );
}

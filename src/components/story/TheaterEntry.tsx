import { ChevronRight, Sparkles } from "lucide-react";

import type { Story } from "@/lib/story";
import { mascotFor } from "@/lib/story/mascot";

/**
 * 金句剧场入口卡（L2）：比金句闪卡重一点、比完整世界线轻很多。
 *
 * 设计思路（对应 PRD 的入戏三步）：
 *  ① 认出——用一句话情境让用户秒懂"这是什么场景"；
 *  ② 好奇——把核心抉择摆出来；
 *  ③ 有话可说——把两个选项直接摆在信息流里，
 *     用户不用进剧场就已经在想"我选哪个"。
 * 点卡片任意处进入剧场。
 */
export function TheaterEntry({ story, onEnter }: { story: Story; onEnter: (id: string) => void }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onEnter(story.id)}
        aria-label={`进入${story.chapterLabel}：${story.card.question}`}
        className="group block w-full cursor-pointer overflow-hidden rounded-2xl border border-kanshan-line bg-white text-left shadow-sm transition-shadow duration-300 hover:shadow-md"
      >
        {/* 顶栏：类型 + 时长，先给用户"这事只要一分钟"的预期 */}
        <div className="flex items-center gap-2 px-4 pt-3.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kanshan-blue px-2.5 py-1 text-[11px] font-semibold tracking-widest text-white">
            <Sparkles className="size-3" />
            {story.chapterLabel}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">单幕 · 约 1 分钟</span>
        </div>

        {/* ① 认出：一句话情境，有画面感 */}
        <div className="px-4 pt-3">
          <p className="text-[14.5px] leading-[1.85] text-foreground/75">
            {story.introLines[0]}
            {story.introLines[1] && (
              <>
                <br />
                {story.introLines[1]}
              </>
            )}
          </p>
        </div>

        {/* ② 好奇：核心抉择，加粗压一句 */}
        <p className="px-4 pt-2.5 text-[16px] font-bold leading-snug text-foreground">
          {story.choicePrompt}
        </p>

        {/* ③ 有话可说：两个选项直接摆在信息流里 */}
        <div className="space-y-2 px-4 py-3.5">
          {story.choices.map((option, index) => (
            <div
              key={option.key}
              className="flex items-start gap-3 rounded-xl border border-kanshan-line bg-kanshan-sky/40 px-3.5 py-3 transition-colors duration-200 group-hover:border-kanshan-blue/30"
            >
              <span className="mt-0.5 font-mono text-[11px] tabular-nums text-kanshan-blue/80">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium leading-snug text-foreground/90">
                  {option.label}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {option.innerVoice}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 底栏：看山署名 + 玩法说明 + 进入箭头 */}
        <div className="flex items-center gap-1.5 border-t border-border/60 bg-kanshan-sky/25 px-4 py-2.5">
          <img
            src={mascotFor(story.id)}
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="size-4 shrink-0 object-contain"
          />
          <span className="text-[11.5px] text-muted-foreground">看山画的</span>
          <span className="mx-1 text-[11.5px] text-muted-foreground/40">·</span>
          <span className="text-[11.5px] text-muted-foreground">一次抉择 · 两个结局</span>
          <span className="ml-auto inline-flex items-center gap-0.5 text-[12px] font-semibold text-kanshan-blue">
            进入剧场
            <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>
    </div>
  );
}

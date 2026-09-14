import { ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";

import { recordClick } from "@/lib/heat";
import { mascotFor } from "@/lib/story/mascot";
import type { Story } from "@/lib/story";

/**
 * 嵌在回答正文里的世界线入口。
 * 做成一张知乎风的浅色卡片：白底浅蓝、左侧看山、蓝色文案——
 * 一眼就是"知乎里长出来的东西"，而不是一个外来的游戏广告。
 */
export function PortalEntry({ story, onEnter }: { story: Story; onEnter: (storyId: string) => void }) {
  const [connecting, setConnecting] = useState(false);

  const handleClick = () => {
    if (connecting) return;
    setConnecting(true);
    recordClick(story.id);
    window.setTimeout(() => onEnter(story.id), 900);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${story.portal.action}，进入这条回答的世界`}
      className="group my-3 flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-kanshan-line bg-gradient-to-r from-kanshan-sky to-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:border-kanshan-blue/40 hover:shadow-md"
    >
      {/* 浅蓝圆底 + 属于这条线的看山 */}
      <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-kanshan-blue/10">
        <img
          src={mascotFor(story.id)}
          alt=""
          aria-hidden="true"
          width={72}
          height={72}
          className="size-8 object-contain transition-transform duration-300 group-hover:scale-110"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-medium tracking-wide text-kanshan-blue">
          {story.portal.title}
        </span>
        <span className="mt-0.5 block truncate text-[15px] font-semibold text-foreground/90">
          {connecting ? "正在连接世界……" : story.portal.action}
        </span>
      </span>

      {connecting ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-kanshan-blue" />
      ) : (
        <ChevronRight className="size-4 shrink-0 text-kanshan-blue/70 transition-transform duration-200 group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

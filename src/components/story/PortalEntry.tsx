import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { recordClick } from "@/lib/heat";
import type { Story } from "@/lib/story";

/** 每条回答都可以生成自己的穿越入口：文案与目标世界线来自 Story。 */
export function PortalEntry({ story, onEnter }: { story: Story; onEnter: (storyId: string) => void }) {
  const [connecting, setConnecting] = useState(false);

  const handleClick = () => {
    if (connecting) return;
    setConnecting(true);
    recordClick(story.id);
    window.setTimeout(() => onEnter(story.id), 260);
  };

  return (
    <div className="my-2 flex items-center gap-4 rounded-2xl border border-border bg-secondary/60 px-4 py-4">
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${story.portal.action}，进入这条回答的世界`}
        className="animate-portal relative grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-story-night text-story-glow"
      >
        <span className="portal-shimmer absolute inset-0" aria-hidden="true" />
        <Sparkles className="relative size-7" strokeWidth={1.8} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-foreground">{story.portal.title}</p>
        <button
          type="button"
          onClick={handleClick}
          className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-medium text-primary"
        >
          {connecting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              正在连接世界……
            </>
          ) : (
            `${story.portal.action} 〉`
          )}
        </button>
      </div>
    </div>
  );
}

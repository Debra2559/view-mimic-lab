import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { mascotFor } from "@/lib/story/mascot";

/**
 * 卡片轮播（闪卡/剧场共用）：
 * 一次只展示一个案例，左右滑动（移动端原生手势）或点箭头翻页切换。
 *
 * 实现：scroll-snap 横向滚动容器，每页整宽；
 * 页码指示「n / N」+ 边缘箭头；initialPage 支持扫码回流时直接落到目标页。
 */
export function CardCarousel({
  title,
  hint,
  total,
  initialPage = 0,
  mascotKey,
  children,
}: {
  title: string;
  hint?: string;
  total: number;
  /** 初始页（扫码回流时定位到对应案例） */
  initialPage?: number;
  /** 标题前的小看山按哪个 id 分配（同主题固定同一只） */
  mascotKey: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(Math.max(0, Math.min(total - 1, initialPage)));

  const go = (index: number, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(total - 1, index));
    track.scrollTo({ left: next * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
    setPage(next);
  };

  // 扫码回流：首帧直接落到目标页，不做动画
  useEffect(() => {
    if (initialPage <= 0) return;
    const frame = requestAnimationFrame(() => go(initialPage, false));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setPage(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div className="relative">
      {/* 标题行：小看山 + 名称 + 翻页（箭头放在这里，绝不遮挡卡片内容） */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <img
          src={mascotFor(mascotKey)}
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="size-5 shrink-0 object-contain"
        />
        <span className="text-[13px] font-semibold text-foreground/80">{title}</span>
        {hint && <span className="hidden text-[11.5px] text-muted-foreground/70 sm:inline">{hint}</span>}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="上一个"
            disabled={page === 0}
            onClick={() => go(page - 1)}
            className="grid size-6 place-items-center rounded-full border border-border text-foreground/70 transition-colors hover:border-kanshan-blue/40 hover:text-kanshan-blue disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground/70"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="min-w-[46px] text-center text-[11.5px] tabular-nums text-muted-foreground">
            {page + 1} / {total}
          </span>
          <button
            type="button"
            aria-label="下一个"
            disabled={page >= total - 1}
            onClick={() => go(page + 1)}
            className="grid size-6 place-items-center rounded-full border border-border text-foreground/70 transition-colors hover:border-kanshan-blue/40 hover:text-kanshan-blue disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground/70"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

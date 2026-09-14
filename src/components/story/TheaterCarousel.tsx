import { useMemo } from "react";

import { CardCarousel } from "@/components/story/CardCarousel";
import { TheaterEntry } from "@/components/story/TheaterEntry";
import { STORIES } from "@/lib/story";

/**
 * 金句剧场轮播：主页只出现一次，一次展示一条剧场，
 * 左右翻页切换（不再按间隔混排进信息流）。
 *
 * 数据驱动：stories 里凡是 chapterLabel 以「金句剧场」开头的都自动入列。
 */
export function TheaterCarousel({ onEnter }: { onEnter: (id: string) => void }) {
  const theaterStories = useMemo(
    () => STORIES.filter((story) => story.chapterLabel.startsWith("金句剧场")),
    [],
  );

  if (theaterStories.length === 0) return null;

  return (
    <CardCarousel
      title="金句剧场"
      hint="左右翻页"
      total={theaterStories.length}
      mascotKey="theater-carousel"
    >
      {theaterStories.map((story) => (
        <div key={story.id} className="w-full shrink-0 snap-center px-0.5">
          <TheaterEntry story={story} onEnter={onEnter} />
        </div>
      ))}
    </CardCarousel>
  );
}

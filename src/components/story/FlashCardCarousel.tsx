import { useEffect, useState } from "react";

import { CardCarousel } from "@/components/story/CardCarousel";
import { FlashCard } from "@/components/story/FlashCard";
import { FLASH_CARDS } from "@/lib/story/flash";

/**
 * 金句闪卡轮播：主页只出现一次，一次展示一张，
 * 左右翻页切换不同金句（不再按间隔混排进信息流）。
 *
 * 扫码回流（?flash=xxx）时直接落到对应那张，并交给外层做高亮。
 * 注意：目标页必须在挂载后读取（SSR 与客户端首帧必须一致，否则 hydration 报错）。
 */
export function FlashCardCarousel() {
  const [initialPage, setInitialPage] = useState(0);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("flash");
    if (!id) return;
    const index = FLASH_CARDS.findIndex((card) => card.id === id);
    if (index > 0) setInitialPage(index);
  }, []);

  return (
    <CardCarousel
      title="金句闪卡"
      hint="左右翻页"
      total={FLASH_CARDS.length}
      initialPage={initialPage}
      mascotKey="flash-carousel"
    >
      {FLASH_CARDS.map((card) => (
        <div key={card.id} className="w-full shrink-0 snap-center">
          <FlashCard card={card} />
        </div>
      ))}
    </CardCarousel>
  );
}

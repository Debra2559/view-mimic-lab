import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bike,
  Flame,
  Search,
  Brain,
  Bug,
  Globe2,
  Hourglass,
  Lock,
  Play,
  Repeat,
  Sparkles,
  Trash2,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  getEndingCount,
  getHubEntries,
  WORLD_CATEGORIES,
  type HubEntry,
  type WorldCard,
} from "@/lib/story";
import { removeGenerated } from "@/lib/story/custom";
import { getHeatRank, heatLabel, heatScore, recordClick } from "@/lib/heat";
import { getPost } from "@/lib/feed";
import { getUnlocked } from "@/lib/story/progress";
import { StoryForge } from "@/components/story/StoryForge";
import { Button } from "@/components/ui/button";

const ICONS: Record<WorldCard["icon"], LucideIcon> = {
  bike: Bike,
  globe: Globe2,
  brain: Brain,
  bug: Bug,
  hourglass: Hourglass,
  repeat: Repeat,
};

export function WorldHub({
  currentWorldId,
  onEnterWorld,
  onClose,
}: {
  currentWorldId: string;
  onEnterWorld: (id: string) => void;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("全部");
  const [entries, setEntries] = useState<HubEntry[]>([]);
  const [forgeOpen, setForgeOpen] = useState(false);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const scrollRaf = useRef(0);

  /** Apple Watch 式滚动：卡片离视口中心越远，越小越淡 */
  const updateCardScales = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const vh = window.innerHeight;
    const mid = vh / 2;
    cardRefs.current.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > vh + 80) return;
      const dist = Math.min(1, Math.abs(rect.top + rect.height / 2 - mid) / mid);
      const scale = 1 - dist * 0.1;
      el.style.transform = `scale(${scale.toFixed(3)})`;
      el.style.opacity = (1 - dist * 0.35).toFixed(3);
    });
  }, []);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(updateCardScales);
  }, [updateCardScales]);

  useEffect(() => {
    setEntries(getHubEntries());
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    // 按热度排名：回答数、收藏数、点击量共同决定，未上榜的排最后
    const sorted = [...entries].sort((a, b) => {
      const ra = getHeatRank(a.id) || Number.MAX_SAFE_INTEGER;
      const rb = getHeatRank(b.id) || Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
    return sorted.filter((world) => {
      const matchCategory = category === "全部" || world.card.category === category;
      const haystack = `${world.card.question}${world.card.hook}${world.card.tags.join("")}${world.card.category}`.toLowerCase();
      return matchCategory && (q === "" || haystack.includes(q));
    });
  }, [keyword, category, entries]);

  useEffect(() => {
    const raf = requestAnimationFrame(updateCardScales);
    return () => cancelAnimationFrame(raf);
  }, [filtered.length, updateCardScales]);

  const handlePick = (world: HubEntry) => {
    if (world.status !== "playable") {
      toast("这条世界线还在生成中", { description: "已为你预约，开放时第一时间通知。" });
      return;
    }
    recordClick(world.id);
    onEnterWorld(world.id);
  };

  return (
    <div
      className="hub-in fixed inset-0 z-[60] overflow-y-auto bg-hub-night font-body"
      onScroll={handleScroll}
      role="dialog"
      aria-label="互动回答世界"
    >
      <div className="hub-aurora pointer-events-none absolute inset-0" aria-hidden="true" />

      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-hub-ink/10 bg-hub-night/60 px-4 py-3.5 backdrop-blur-2xl">
        <div>
          <p className="flex items-center gap-1.5 font-display text-[11px] tracking-[0.22em] text-hub-glow/90">
            <Sparkles className="size-3" />
            WORLD LOBBY
          </p>
          <h2 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight text-hub-ink">
            挑一条世界线走进去
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="关闭互动回答世界"
          onClick={onClose}
          className="size-9 rounded-full border border-hub-ink/10 bg-hub-panel/60 text-hub-ink/80 hover:bg-hub-panel hover:text-hub-ink"
        >
          <X className="size-4.5" />
        </Button>
      </header>

      <div className="relative px-4 pt-4">
        <label className="relative block">
          <span className="sr-only">搜索「如果」世界线</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-hub-ink/40" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索「如果……会怎样」"
            className="h-11 w-full rounded-2xl border border-hub-ink/15 bg-hub-panel/40 pl-9 pr-9 text-[14px] text-hub-ink outline-none backdrop-blur-xl placeholder:text-hub-ink/45 focus:border-hub-glow/50 focus:bg-hub-panel/60"
          />
          {keyword && (
            <button
              type="button"
              aria-label="清空搜索"
              onClick={() => setKeyword("")}
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-hub-ink/10 text-hub-ink/70 hover:bg-hub-ink/20"
            >
              <X className="size-3.5" />
            </button>
          )}
        </label>

        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["全部", ...WORLD_CATEGORIES].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] transition-colors ${
                category === item
                  ? "border-hub-coral/70 bg-hub-coral/15 text-hub-coral"
                  : "border-hub-ink/15 bg-hub-panel/45 text-hub-ink/70 hover:border-hub-ink/25 hover:bg-hub-panel/60"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setForgeOpen(true)}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-hub-glow/40 bg-hub-panel/35 px-4 py-3 text-left backdrop-blur-xl transition-colors hover:border-hub-glow/60 hover:bg-hub-panel/50"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-hub-glow/30 bg-hub-glow/15 text-hub-glow">
            <Wand2 className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[14.5px] font-medium text-hub-ink">
              投喂一条知乎「如果」回答
            </span>
            <span className="block text-[12px] text-hub-ink/55">
              自动生成专属剧情、立绘与分支结局
            </span>
          </span>
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="relative px-4 py-16 text-center text-[13px] text-hub-ink/50">
          没有找到这条世界线，换个关键词试试。
        </p>
      )}

      <div className="relative grid grid-cols-2 gap-3.5 px-4 pb-14 pt-4 [perspective:800px]">
        {filtered.map((world, index) => {
          const Icon = ICONS[world.card.icon];
          const rank = getHeatRank(world.id) || null;
          const post = getPost(world.id);
          return (
            <div
              key={world.id}
              ref={(el) => {
                if (el) cardRefs.current.set(world.id, el);
                else cardRefs.current.delete(world.id);
              }}
              className="hub-card-wrap relative will-change-transform"
            >
              <button
                type="button"
                onClick={() => handlePick(world)}
                style={{ animationDelay: `${index * 0.07}s` }}
                className="hub-card group relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-3xl border border-hub-ink/10 bg-hub-panel/20 text-left"
              >
                {/* 全幅封面，铺满整卡 */}
                {world.card.coverImage ? (
                  <img
                    src={world.card.coverImage}
                    alt={world.card.question}
                    loading="lazy"
                    width={640}
                    height={800}
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <span
                    className="absolute inset-0 grid place-items-center"
                    style={{ background: world.card.cover }}
                  >
                    <Icon className="hub-glyph size-14 text-hub-ink/80" strokeWidth={1.2} />
                  </span>
                )}
                {/* 阅读渐变：顶部压暗 + 底部信息区 */}
                <span
                  className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.15_0.03_265/0.55)_0%,transparent_30%,transparent_42%,oklch(0.16_0.03_265/0.82)_70%,oklch(0.14_0.03_265/0.95)_100%)]"
                  aria-hidden="true"
                />

                {/* 顶部徽标 */}
                <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
                  {rank && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur-md ${
                        rank <= 3
                          ? "border-hub-coral/50 bg-hub-coral/20 text-hub-coral"
                          : "border-hub-ink/10 bg-hub-night/55 text-hub-ink/85"
                      }`}
                      title="热度由回答数、收藏数和点击量共同决定"
                    >
                      <Flame className="size-2.5" />
                      No.{rank}
                      {post && <span className="font-normal opacity-80">· {heatLabel(heatScore(post))}</span>}
                    </span>
                  )}
                  {world.generated ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-hub-ink/10 bg-hub-night/55 px-2 py-0.5 text-[10px] tracking-widest text-hub-glow backdrop-blur-md">
                      <Wand2 className="size-2.5" />
                      我生成的
                    </span>
                  ) : (
                    world.id === currentWorldId && (
                      <span className="rounded-full border border-hub-ink/10 bg-hub-night/55 px-2 py-0.5 text-[10px] tracking-widest text-hub-glow backdrop-blur-md">
                        当前世界
                      </span>
                    )
                  )}
                </span>
                <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-hub-ink/10 bg-hub-night/55 px-2 py-0.5 text-[10px] text-hub-ink/85 backdrop-blur-md">
                  {world.status === "playable" ? (
                    <Play className="size-2.5" />
                  ) : (
                    <Lock className="size-2.5" />
                  )}
                  {world.status === "playable" ? "可进入" : "即将开启"}
                </span>

                {/* 底部信息，浮在封面之上 */}
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3.5">
                  <span className="line-clamp-2 text-[15px] font-semibold leading-[1.45] text-hub-ink">
                    {world.card.question}
                  </span>
                  <span className="line-clamp-2 text-[12px] leading-[1.55] text-hub-ink/70">
                    {world.card.hook}
                  </span>
                  <span className="mt-0.5 flex flex-wrap gap-1">
                    {world.card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-hub-ink/15 bg-hub-night/45 px-2 py-0.5 text-[10.5px] text-hub-ink/80 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                  <span className="mt-0.5 flex items-center justify-between text-[11px] text-hub-ink/55">
                    <span>{world.card.players}</span>
                    {world.status === "playable" && (
                      <span className="text-hub-coral/90">
                        结局 {getUnlocked(world.id).length}/{getEndingCount(world.id)}
                      </span>
                    )}
                  </span>
                </span>
              </button>

              {world.generated && (
                <button
                  type="button"
                  aria-label="删除这条生成的世界线"
                  onClick={() => {
                    removeGenerated(world.id);
                    setEntries(getHubEntries());
                    toast("已删除这条世界线");
                  }}
                  className="absolute right-2.5 top-9 z-10 grid size-7 place-items-center rounded-full border border-hub-ink/10 bg-hub-night/60 text-hub-ink/70 backdrop-blur-md hover:text-hub-ink"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {forgeOpen && (
        <StoryForge
          onClose={() => setForgeOpen(false)}
          onCreated={(id) => {
            setForgeOpen(false);
            setEntries(getHubEntries());
            onEnterWorld(id);
          }}
        />
      )}
    </div>
  );
}

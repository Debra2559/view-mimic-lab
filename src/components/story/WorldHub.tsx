import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bike,
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
      const scale = 1 - dist * 0.12;
      el.style.transform = `scale(${scale.toFixed(3)})`;
      el.style.opacity = (1 - dist * 0.4).toFixed(3);
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
    return entries.filter((world) => {
      const matchCategory = category === "全部" || world.card.category === category;
      const haystack = `${world.card.question}${world.card.hook}${world.card.tags.join("")}${world.card.category}`.toLowerCase();
      return matchCategory && (q === "" || haystack.includes(q));
    });
  }, [keyword, category, entries]);

  const handlePick = (world: HubEntry) => {
    if (world.status !== "playable") {
      toast("这条世界线还在生成中", { description: "已为你预约，开放时第一时间通知。" });
      return;
    }
    onEnterWorld(world.id);
  };

  return (
    <div
      className="hub-in fixed inset-0 z-[60] overflow-y-auto bg-story-night"
      onScroll={handleScroll}
      role="dialog"
      aria-label="互动回答世界"
    >
      <div className="hub-aurora pointer-events-none absolute inset-0" aria-hidden="true" />

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-story-ink/10 bg-story-night/80 px-4 py-3 backdrop-blur-xl">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] tracking-[0.3em] text-story-glow">
            <Sparkles className="size-3.5" />
            互动回答世界
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-story-ink">挑一条世界线走进去</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="关闭互动回答世界"
          onClick={onClose}
          className="size-10 rounded-full bg-story-panel text-story-ink/80 hover:text-story-ink"
        >
          <X className="size-5" />
        </Button>
      </header>

      <div className="relative px-4 pt-4">
        <label className="relative block">
          <span className="sr-only">搜索「如果」世界线</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-story-ink/45" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索「如果……会怎样」"
            className="h-11 w-full rounded-full border border-story-ink/15 bg-story-panel pl-9 pr-9 text-[14px] text-story-ink outline-none backdrop-blur-md placeholder:text-story-ink/40 focus:border-story-glow/60"
          />
          {keyword && (
            <button
              type="button"
              aria-label="清空搜索"
              onClick={() => setKeyword("")}
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-story-ink/10 text-story-ink/70"
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
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                category === item
                  ? "border-story-glow/60 bg-story-glow/15 text-story-glow"
                  : "border-story-ink/15 bg-story-panel text-story-ink/65"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setForgeOpen(true)}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-story-glow/45 bg-story-glow/10 px-4 py-3 text-left"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-story-glow/20 text-story-glow">
            <Wand2 className="size-4.5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[14.5px] font-semibold text-story-ink">
              投喂一条知乎「如果」回答
            </span>
            <span className="block text-[12px] text-story-ink/60">
              自动生成专属剧情、立绘与分支结局
            </span>
          </span>
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="relative px-4 py-16 text-center text-[13px] text-story-ink/50">
          没有找到这条世界线，换个关键词试试。
        </p>
      )}

      <div className="relative grid grid-cols-2 gap-3 px-4 pb-12 pt-4">
        {filtered.map((world, index) => {
          const Icon = ICONS[world.card.icon];
          return (
            <div key={world.id} className="relative">
              <button
                type="button"
                onClick={() => handlePick(world)}
                style={{ animationDelay: `${index * 0.07}s` }}
                className="hub-card group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-story-ink/12 bg-story-panel text-left backdrop-blur-md"
              >
                <div
                  className="relative h-28 w-full overflow-hidden"
                  style={{ background: world.card.cover }}
                >
                  <span className="hub-glyph absolute inset-0 grid place-items-center text-story-ink/90">
                    <Icon className="size-11" strokeWidth={1.4} />
                  </span>
                  <span className="hub-shine absolute inset-0" aria-hidden="true" />
                  {world.generated ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-story-night/70 px-2 py-0.5 text-[10px] tracking-widest text-story-glow">
                      <Wand2 className="size-2.5" />
                      我生成的
                    </span>
                  ) : (
                    world.id === currentWorldId && (
                      <span className="absolute left-2 top-2 rounded-full bg-story-night/70 px-2 py-0.5 text-[10px] tracking-widest text-story-glow">
                        当前世界
                      </span>
                    )
                  )}
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-story-night/70 px-2 py-0.5 text-[10px] text-story-ink/85">
                    {world.status === "playable" ? (
                      <Play className="size-2.5" />
                    ) : (
                      <Lock className="size-2.5" />
                    )}
                    {world.status === "playable" ? "可进入" : "即将开启"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-[1.5] text-story-ink">
                    {world.card.question}
                  </h3>
                  <p className="line-clamp-2 text-[12.5px] leading-[1.6] text-story-ink/60">
                    {world.card.hook}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {world.card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-story-ink/15 px-2 py-0.5 text-[10.5px] text-story-ink/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-story-ink/45">{world.card.players}</span>
                    {world.status === "playable" && (
                      <span className="text-[11px] text-story-glow/85">
                        结局 {getUnlocked(world.id).length}/{getEndingCount(world.id)}
                      </span>
                    )}
                  </div>
                </div>
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
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-story-night/70 text-story-ink/70 hover:text-story-ink"
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

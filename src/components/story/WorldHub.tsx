import {
  Bike,
  Brain,
  Bug,
  Globe2,
  Hourglass,
  Lock,
  Play,
  Repeat,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { HUB_ENTRIES, type HubEntry, type WorldCard } from "@/lib/story";
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

      <div className="relative grid grid-cols-2 gap-3 px-4 pb-12 pt-4">
        {HUB_ENTRIES.map((world, index) => {
          const Icon = ICONS[world.card.icon];
          return (
          <button
            key={world.id}
            type="button"
            onClick={() => handlePick(world)}
            style={{ animationDelay: `${index * 0.07}s` }}
            className="hub-card group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-story-ink/12 bg-story-panel text-left backdrop-blur-md"
          >
            <div className="relative h-28 w-full overflow-hidden" style={{ background: world.card.cover }}>
              <span className="hub-glyph absolute inset-0 grid place-items-center text-story-ink/90">
                <Icon className="size-11" strokeWidth={1.4} />
              </span>
              <span className="hub-shine absolute inset-0" aria-hidden="true" />
              {world.id === currentWorldId && (
                <span className="absolute left-2 top-2 rounded-full bg-story-night/70 px-2 py-0.5 text-[10px] tracking-widest text-story-glow">
                  当前世界
                </span>
              )}
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-story-night/70 px-2 py-0.5 text-[10px] text-story-ink/85">
                {world.status === "playable" ? <Play className="size-2.5" /> : <Lock className="size-2.5" />}
                {world.status === "playable" ? "可进入" : "即将开启"}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-[1.5] text-story-ink">
                {world.card.question}
              </h3>
              <p className="line-clamp-2 text-[12.5px] leading-[1.6] text-story-ink/60">{world.card.hook}</p>
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
              <span className="mt-1 text-[11px] text-story-ink/45">{world.card.players}</span>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}

import {
  Bike,
  ChevronRight,
  Clock,
  DoorOpen,
  Ear,
  Eye,
  Flame,
  Hand,
  LayoutGrid,
  Lightbulb,
  Package,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Smartphone,
  Sparkles,
  StickyNote,
  VolumeX,
  Wind,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ShareSheet } from "@/components/story/ShareSheet";
import { WorldHub } from "@/components/story/WorldHub";
import {
  getCharacter,
  getStory,
  type Ending,
  type Interaction,
  type Story,
  type StoryNode,
} from "@/lib/story";
import { getUnlocked, unlockEnding } from "@/lib/story/progress";
import { Button } from "@/components/ui/button";

type Phase = "transition" | "intro" | "dialogue" | "choice" | "ending";
type ChoiceKey = "A" | "B";

const EMBERS = [8, 22, 37, 54, 68, 81, 92];

const INTERACTION_ICONS = {
  hand: Hand,
  flame: Flame,
  door: DoorOpen,
  phone: Smartphone,
  package: Package,
  ear: Ear,
  eye: Eye,
  clock: Clock,
  bike: Bike,
  wind: Wind,
  light: Lightbulb,
  note: StickyNote,
} as const;

export function StoryWorld({ storyId, onExit }: { storyId: string; onExit: () => void }) {
  const [activeId, setActiveId] = useState(storyId);
  const [phase, setPhase] = useState<Phase>("transition");
  const [nodeIndex, setNodeIndex] = useState(0);
  const [choice, setChoice] = useState<ChoiceKey | null>(null);
  const [muted, setMuted] = useState(true);
  const [auto, setAuto] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [touched, setTouched] = useState<string[]>([]);
  const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null);
  const [peeking, setPeeking] = useState(false);


  const story: Story = useMemo(() => getStory(activeId), [activeId]);

  useEffect(() => {
    setUnlocked(getUnlocked(activeId));
  }, [activeId]);

  useEffect(() => {
    if (phase !== "transition") return;
    const timer = window.setTimeout(() => setPhase("intro"), 1300);
    return () => window.clearTimeout(timer);
  }, [phase, activeId]);

  const activeEnding: Ending | null = choice ? story.endings[choice] : null;
  const activeNodes: StoryNode[] = activeEnding ? activeEnding.nodes : story.nodes;
  const activeNode = activeNodes[nodeIndex];
  const speaker = activeNode ? getCharacter(activeNode.speaker) : undefined;

  useEffect(() => {
    if (phase === "ending" && activeEnding) {
      setUnlocked(unlockEnding(story.id, activeEnding.key));
    }
  }, [phase, activeEnding, story.id]);

  const totalEndings = Object.keys(story.endings).length;
  const branchTotal = story.nodes.length + 1;
  const progress = activeEnding
    ? 1
    : Math.min((nodeIndex + (phase === "choice" ? 1 : 0) + 1) / branchTotal, 1);

  const restart = () => {
    setChoice(null);
    setNodeIndex(0);
    setPhase("intro");
  };

  const replayOther = () => {
    const other: ChoiceKey = choice === "A" ? "B" : "A";
    setChoice(other);
    setNodeIndex(0);
    setPhase("dialogue");
  };

  const enterWorld = (id: string) => {
    setHubOpen(false);
    setActiveId(id);
    setChoice(null);
    setNodeIndex(0);
    setPhase("transition");
  };

  const advance = useCallback(() => {
    setNodeIndex((value) => {
      if (value < activeNodes.length - 1) return value + 1;
      setPhase(choice ? "ending" : "choice");
      return value;
    });
  }, [activeNodes.length, choice]);

  const pick = (key: ChoiceKey) => {
    setChoice(key);
    setNodeIndex(0);
    setPhase("dialogue");
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-story-night text-story-ink"
      role="dialog"
      aria-label="互动故事世界"
    >
      <img
        key={story.background}
        src={story.background}
        alt={story.backgroundAlt}
        width={1344}
        height={768}
        className="scene-drift absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000 data-[visible=true]:opacity-100"
        data-visible={phase !== "transition" && phase !== "intro"}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-story-night/70 via-transparent to-story-night"
        aria-hidden="true"
      />
      {phase !== "transition" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {EMBERS.map((left, index) => (
            <span
              key={left}
              className="ember"
              style={{ left: `${left}%`, animationDelay: `${index * 0.9}s` }}
            />
          ))}
        </div>
      )}

      {phase === "transition" && (
        <div className="transition-zoom absolute inset-0 grid place-items-center bg-background">
          <p className="text-[17px] font-medium tracking-[0.3em] text-muted-foreground">世界线接入中</p>
        </div>
      )}

      {phase === "intro" && (
        <button
          type="button"
          onClick={() => setPhase("dialogue")}
          className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-6 bg-story-night px-8 text-center"
        >
          <span className="rounded-full border border-story-glow/40 px-4 py-1 text-[12px] tracking-[0.3em] text-story-glow">
            {story.chapterLabel}
          </span>
          {story.introLines.map((line) => (
            <p key={line} className="text-[19px] leading-[1.9] text-story-ink/90">
              {line}
            </p>
          ))}
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-story-glow/50 px-6 py-3 text-[16px] font-semibold text-story-glow">
            睁开眼睛
            <ChevronRight className="size-4" />
          </span>
        </button>
      )}

      {(phase === "dialogue" || phase === "choice") && (
        <>
          <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-story-ink/20 bg-story-panel px-3 py-1 text-[12px] tracking-widest text-story-ink/80">
                {choice ? `${story.chapterLabel} · 分歧之后` : story.chapterLabel}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={auto ? "关闭自动播放" : "开启自动播放"}
                  onClick={() => setAuto((value) => !value)}
                  className="size-10 rounded-full bg-story-panel text-story-ink/80 hover:text-story-ink data-[on=true]:text-story-glow"
                  data-on={auto}
                >
                  {auto ? <Pause className="size-5" /> : <Play className="size-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="打开互动回答世界"
                  onClick={() => setHubOpen(true)}
                  className="size-10 rounded-full bg-story-panel text-story-glow hover:text-story-glow"
                >
                  <LayoutGrid className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={muted ? "取消静音（暂未接入音频）" : "静音"}
                  onClick={() => setMuted((value) => !value)}
                  className="size-10 rounded-full bg-story-panel text-story-ink/80 hover:text-story-ink"
                >
                  <VolumeX className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="退出故事，回到回答"
                  onClick={onExit}
                  className="size-10 rounded-full bg-story-panel text-story-ink/80 hover:text-story-ink"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>
            <div
              className="progress-bar mt-3 h-[3px] w-full overflow-hidden rounded-full bg-story-ink/15"
              role="progressbar"
              aria-label="剧情进度"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="block h-full w-full rounded-full bg-gradient-to-r from-story-glow to-story-ember"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </header>

          {phase === "dialogue" && activeNode && speaker && (
            <img
              key={`sprite-${story.id}-${choice ?? "main"}-${nodeIndex}`}
              src={speaker.sprites[activeNode.expression ?? "calm"]}
              alt={`${speaker.name}的半身立绘`}
              width={768}
              height={1024}
              className="sprite-rise absolute bottom-40 left-1/2 z-10 w-[62%] max-w-[340px] -translate-x-1/2 drop-shadow-[0_8px_32px_oklch(0.1_0.02_260/60%)] sm:bottom-44"
            />
          )}

          {phase === "dialogue" && activeNode && (
            <DialogueBox
              key={`dialogue-${story.id}-${choice ?? "main"}-${nodeIndex}`}
              node={activeNode}
              speakerName={speaker?.name}
              speakerAvatar={speaker?.sprites[activeNode.expression ?? "calm"]}
              auto={auto}
              onAdvance={advance}
            />
          )}

          {phase === "choice" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-end gap-4 bg-story-night/60 px-6 pb-24 backdrop-blur-[2px]">
              <p className="choice-in mb-2 text-center text-[17px] font-medium text-story-ink">
                {story.choicePrompt}
              </p>
              {story.choices.map((option, index) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => pick(option.ending)}
                  className="choice-in choice-card flex w-full max-w-md cursor-pointer items-start gap-3 rounded-2xl border border-story-ink/15 bg-story-panel px-5 py-4 text-left backdrop-blur-md"
                  style={{ animationDelay: `${index * 0.12}s` }}
                >
                  <span className="choice-key mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-story-glow/50 text-[13px] font-bold text-story-glow">
                    {option.key}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold text-story-ink">{option.label}</span>
                    <span className="mt-1 block text-[14px] text-story-ink/60">{option.innerVoice}</span>
                  </span>
                </button>
              ))}
              <p className="text-[12px] text-story-ink/45">每个选择都会写进你的结局图鉴</p>
            </div>
          )}
        </>
      )}

      {phase === "ending" && activeEnding && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-story-night/85 px-8 text-center backdrop-blur-sm">
          <div className="ending-pop flex flex-col items-center">
            <p className="flex items-center gap-1.5 text-[13px] tracking-[0.4em] text-story-glow">
              <Sparkles className="size-3.5" />
              结局
            </p>
            <h2 className="mt-3 text-[30px] font-bold text-story-ink">「{activeEnding.title}」</h2>
            <p className="mt-6 max-w-md text-[16px] leading-[1.9] text-story-ink/85">{activeEnding.summary}</p>

            <div className="mt-6 flex items-center gap-2">
              {Object.values(story.endings).map((item) => {
                const got = unlocked.includes(item.key);
                return (
                  <span
                    key={item.key}
                    className="rounded-full border px-3 py-1 text-[12px] data-[got=true]:border-story-glow/60 data-[got=true]:text-story-glow data-[got=false]:border-story-ink/20 data-[got=false]:text-story-ink/40"
                    data-got={got}
                  >
                    {got ? `「${item.title}」` : "未解锁结局"}
                  </span>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-story-ink/50">
              结局图鉴 {unlocked.length}/{totalEndings}
            </p>
          </div>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3">
            {unlocked.length < totalEndings && (
              <Button
                onClick={replayOther}
                className="h-12 rounded-full bg-story-glow text-[16px] font-semibold text-story-night hover:bg-story-glow/90"
              >
                <Sparkles className="size-4" />
                去看另一种选择的结局
              </Button>
            )}
            <Button
              variant="outline"
              onClick={restart}
              className="h-12 rounded-full border-story-glow/40 bg-transparent text-[16px] text-story-ink hover:bg-story-ink/10 hover:text-story-ink"
            >
              <RotateCcw className="size-4" />
              重启世界线
            </Button>
            <Button
              variant="outline"
              onClick={() => setHubOpen(true)}
              className="h-12 rounded-full border-story-ink/25 bg-transparent text-[16px] text-story-ink hover:bg-story-ink/10 hover:text-story-ink"
            >
              <LayoutGrid className="size-4" />
              探索互动回答世界
            </Button>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShareOpen(true)}
                className="h-11 flex-1 text-[15px] text-story-ink/70 hover:text-story-ink"
              >
                <Share2 className="size-4" />
                分享结局
              </Button>
              <Button
                variant="ghost"
                onClick={onExit}
                className="h-11 flex-1 text-[15px] text-story-ink/70 hover:text-story-ink"
              >
                回到回答
              </Button>
            </div>
          </div>
        </div>
      )}

      {hubOpen && (
        <WorldHub currentWorldId={story.id} onEnterWorld={enterWorld} onClose={() => setHubOpen(false)} />
      )}

      {shareOpen && activeEnding && (
        <ShareSheet story={story} ending={activeEnding} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

function DialogueBox({
  node,
  speakerName,
  speakerAvatar,
  auto,
  onAdvance,
}: {
  node: StoryNode;
  speakerName?: string | undefined;
  speakerAvatar?: string | undefined;
  auto: boolean;
  onAdvance: () => void;
}) {
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);
  const typing = shown < node.text.length;

  useEffect(() => {
    setShown(0);
    doneRef.current = false;
  }, [node]);

  useEffect(() => {
    if (!typing) return;
    const timer = window.setInterval(() => {
      setShown((value) => Math.min(value + 1, node.text.length));
    }, 45);
    return () => window.clearInterval(timer);
  }, [node, typing]);

  useEffect(() => {
    if (!auto || typing) return;
    const timer = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onAdvance();
      }
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [auto, typing, onAdvance]);

  const handleClick = useCallback(() => {
    if (typing) {
      setShown(node.text.length);
      return;
    }
    if (!doneRef.current) {
      doneRef.current = true;
      onAdvance();
    }
  }, [typing, node.text.length, onAdvance]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="点击继续剧情"
      className="absolute inset-x-0 bottom-0 z-20 cursor-pointer px-4 pb-6 pt-10 text-left"
    >
      <div className="relative rounded-2xl border border-story-ink/12 bg-story-panel px-5 pb-5 pt-4 backdrop-blur-md">
        <span
          className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-story-glow/70 to-transparent"
          aria-hidden="true"
        />
        {speakerName && (
          <span className="absolute -top-4 left-5 flex items-center gap-2 rounded-full border border-story-glow/40 bg-story-night py-0.5 pl-1 pr-3">
            {speakerAvatar && (
              <img
                src={speakerAvatar}
                alt=""
                width={64}
                height={64}
                className="size-6 rounded-full object-cover object-top"
              />
            )}
            <span className="text-[13px] font-semibold text-story-glow">{speakerName}</span>
          </span>
        )}
        <p className="min-h-[3.4em] text-[16.5px] leading-[1.75] text-story-ink/95">
          {node.text.slice(0, shown)}
          {typing && (
            <span className="caret-blink ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-story-glow" />
          )}
        </p>
        <span className="mt-1 flex justify-end text-[12px] text-story-ink/50">
          {typing ? "点击显示全文" : auto ? "自动播放中…" : "点击继续 ▾"}
        </span>
      </div>
    </button>
  );
}

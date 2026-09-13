import {
  ChevronRight,
  LayoutGrid,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ShareSheet } from "@/components/story/ShareSheet";
import { WorldHub } from "@/components/story/WorldHub";
import {
  getCharacter,
  getStory,
  type Ending,
  type Story,
  type StoryNode,
} from "@/lib/story";
import { getUnlocked, unlockEnding } from "@/lib/story/progress";
import { Ambience } from "@/lib/story/ambience";
import { Button } from "@/components/ui/button";
import greetingAsset from "@/assets/mascot/greeting.gif.asset.json";

type Phase = "transition" | "intro" | "dialogue" | "choice" | "ending";

/** 结局 key，父分支 + 字母构成树状路径，如 A -> AB -> ABA */
type ChoiceKey = string;

const EMBERS = [8, 22, 37, 54, 68, 81, 92];

const MASCOT_SEEN_KEY = "portal-mascot-seen";

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
  const [showMascot, setShowMascot] = useState(false);
  const ambienceRef = useRef<Ambience | null>(null);

  /** IP 向导只在用户第一次进入互动世界时出现 */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(MASCOT_SEEN_KEY) !== "1") {
      setShowMascot(true);
    }
  }, []);


  const story: Story = useMemo(() => getStory(activeId), [activeId]);

  useEffect(() => {
    setUnlocked(getUnlocked(activeId));
  }, [activeId]);

  /** 背景音：跟随剧情阶段切换氛围 */
  useEffect(() => {
    if (muted) return;
    const mood =
      phase === "ending"
        ? "ending"
        : phase === "choice"
          ? "choice"
          : phase === "intro" || phase === "transition"
            ? "intro"
            : "dialogue";
    ambienceRef.current?.setMood(mood);
  }, [phase, muted]);

  useEffect(() => () => ambienceRef.current?.dispose(), []);

  const toggleSound = async () => {
    if (muted) {
      ambienceRef.current ??= new Ambience();
      await ambienceRef.current.start("dialogue");
      setMuted(false);
      return;
    }
    ambienceRef.current?.mute();
    setMuted(true);
  };

  useEffect(() => {
    if (phase !== "transition") return;
    const timer = window.setTimeout(() => setPhase("intro"), 1300);
    return () => window.clearTimeout(timer);
  }, [phase, activeId]);

  const activeEnding: Ending | null = (choice ? story.endings[choice] : null) ?? null;
  const activeNodes: StoryNode[] = activeEnding ? activeEnding.nodes : story.nodes;
  const activeNode = activeNodes[nodeIndex];
  const speaker = activeNode ? getCharacter(activeNode.speaker) : undefined;

  useEffect(() => {
    if (phase === "ending" && activeEnding) {
      setUnlocked(unlockEnding(story.id, activeEnding.key));
    }
  }, [phase, activeEnding, story.id]);

  /** 终局 = 没有后续岔路的结局 */
  const finalEndings = Object.values(story.endings).filter((item) => !item.next);
  const totalEndings = finalEndings.length;
  const unlockedFinal = finalEndings.filter((item) => unlocked.includes(item.key)).length;
  const depth = activeEnding ? activeEnding.key.length : 0;
  const parentKey = depth > 1 ? activeEnding!.key.slice(0, -1) : null;
  const branchTotal = story.nodes.length + 1;
  const progress = activeEnding
    ? 1
    : Math.min((nodeIndex + (phase === "choice" ? 1 : 0) + 1) / branchTotal, 1);

  const restart = () => {
    setChoice(null);
    setNodeIndex(0);
    setPhase("intro");
  };

  /** 回到上一个岔路口，去走没走过的那条 */
  const backToFork = () => {
    setNodeIndex(0);
    if (parentKey) {
      setChoice(parentKey);
      setPhase("ending");
      return;
    }
    setChoice(null);
    setNodeIndex(story.nodes.length - 1);
    setPhase("choice");
  };

  const enterWorld = (id: string) => {
    setHubOpen(false);
    setActiveId(id);
    setChoice(null);
    setNodeIndex(0);
    setPhase("transition");
  };

  /** 分享世界线直达链接：朋友打开 /world/:id 就能直接玩 */
  const shareWorld = async () => {
    const url = `${window.location.origin}/world/${activeId}`;
    const text = `我刚在「${story.card.question}」这条世界线里做了一个选择——换你会怎么走？`;
    if (navigator.share) {
      try {
        await navigator.share({ title: story.card.question, text, url });
        return;
      } catch {
        /* 用户取消分享，静默 */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast("链接已复制", { description: "发给朋友，对方打开就能直接玩这条世界线。" });
    } catch {
      toast("复制这个链接发给朋友", { description: url });
    }
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

  /** 分叉点与结局切换到第二张场景图 */
  const sceneShifted = phase === "choice" || phase === "ending";

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
        className="scene-drift absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-1000 data-[visible=true]:opacity-100 data-[dim=true]:scale-105 data-[dim=true]:opacity-30 data-[dim=true]:blur-[2px]"
        data-visible={phase !== "transition" && phase !== "intro"}
        data-dim={sceneShifted}
      />
      {story.forkScene && (
        <img
          key={story.forkScene}
          src={story.forkScene}
          alt=""
          aria-hidden="true"
          width={1280}
          height={720}
          className="scene-drift absolute inset-0 h-full w-full scale-110 object-cover opacity-0 transition-all duration-[1400ms] ease-out data-[visible=true]:scale-100 data-[visible=true]:opacity-100"
          data-visible={sceneShifted}
        />
      )}
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
          onClick={() => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(MASCOT_SEEN_KEY, "1");
            }
            setShowMascot(false);
            setPhase("dialogue");
          }}
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

          {/* IP 向导：第一次进入互动世界时出来打招呼 */}
          {showMascot && (
            <div className="pointer-events-none absolute bottom-6 left-6 flex items-end gap-3">
              <img
                src={greetingAsset.url}
                alt="穿越向导"
                width={120}
                height={120}
                className="size-28 object-contain drop-shadow-[0_8px_24px_oklch(0.1_0.02_260/50%)]"
              />
              <div className="max-w-[210px] rounded-2xl border border-story-glow/30 bg-story-panel px-4 py-3 text-left shadow-[0_12px_40px_oklch(0.08_0.02_260/45%)]">
                <p className="text-[13px] leading-relaxed text-story-ink/90">
                  嗨，我是你的穿越向导。点一下屏幕，睁开眼睛进入这个世界。
                </p>
                <span className="mt-1 block text-[11px] text-story-ink/50">点击任意处开始</span>
              </div>
            </div>
          )}
        </button>
      )}

      {(phase === "dialogue" || phase === "choice") && (
        <>
          <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-story-ink/20 bg-story-panel px-3 py-1 text-[12px] tracking-widest text-story-ink/80">
                {choice ? `${story.chapterLabel} · 第 ${choice.length} 层分歧` : story.chapterLabel}
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
                  aria-label="分享这条世界线给朋友"
                  onClick={shareWorld}
                  className="size-10 rounded-full bg-story-panel text-story-ink/80 hover:text-story-ink"
                >
                  <Share2 className="size-5" />
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
                  aria-label={muted ? "打开背景音乐" : "关闭背景音乐"}
                  onClick={toggleSound}
                  className="size-10 rounded-full bg-story-panel text-story-ink/80 hover:text-story-ink data-[on=true]:text-story-glow"
                  data-on={!muted}
                >
                  {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
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
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="progress-bar h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-story-ink/15"
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
            <div className="choice-screen absolute inset-0 z-30 flex flex-col items-center justify-end px-5 pb-10">
              <div className="w-full max-w-md">
                <p className="choice-in text-[19px] font-semibold leading-[1.65] text-story-ink">
                  {story.choicePrompt}
                </p>

                <div className="mt-5 border-t border-story-ink/10">
                  {story.choices.map((option, index) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => pick(option.ending)}
                      className="choice-in group flex w-full cursor-pointer items-baseline gap-4 border-b border-story-ink/10 py-4 text-left"
                      style={{ animationDelay: `${0.08 + index * 0.1}s` }}
                    >
                      <span className="font-mono text-[12px] tabular-nums text-story-glow/70">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] font-medium leading-snug text-story-ink">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-story-ink/45">
                          {option.innerVoice}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}


        </>
      )}


      {phase === "ending" && activeEnding && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-story-night/75 via-story-night/85 to-story-night px-8 py-10 text-center backdrop-blur-[2px]">
          <div className="ending-pop flex flex-col items-center">
            <p className="flex items-center gap-1.5 text-[13px] tracking-[0.4em] text-story-glow">
              <Sparkles className="size-3.5" />
              {activeEnding.next ? `第 ${depth} 幕` : "终局"}
            </p>
            <h2 className="mt-3 text-[30px] font-bold text-story-ink">「{activeEnding.title}」</h2>
            <p className="mt-6 max-w-md text-[16px] leading-[1.9] text-story-ink/85">{activeEnding.summary}</p>

            {!activeEnding.next && (
              <>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {finalEndings.map((item) => {
                    const got = unlocked.includes(item.key);
                    return (
                      <span
                        key={item.key}
                        className="rounded-full border px-3 py-1 text-[12px] data-[got=true]:border-story-glow/60 data-[got=true]:text-story-glow data-[got=false]:border-story-ink/20 data-[got=false]:text-story-ink/40"
                        data-got={got}
                      >
                        {got ? `「${item.title}」` : "未解锁"}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-2 text-[12px] text-story-ink/50">
                  结局图鉴 {unlockedFinal}/{totalEndings}
                </p>
              </>
            )}
          </div>

          {/* 故事还能往下长：继续延伸的岔路 */}
          {activeEnding.next && (
            <div className="mt-8 w-full max-w-md">
              <p className="text-[15px] leading-relaxed text-story-ink/75">{activeEnding.next.prompt}</p>
              <div className="mt-4 flex flex-col gap-3">
                {activeEnding.next.choices.map((option, index) => (
                  <button
                    key={option.ending}
                    type="button"
                    onClick={() => pick(option.ending)}
                    className="choice-in choice-card group relative w-full cursor-pointer overflow-hidden rounded-[20px] border border-story-ink/12 bg-story-night/55 px-5 py-4 text-left backdrop-blur-xl"
                    style={{ animationDelay: `${0.1 + index * 0.12}s` }}
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-story-glow to-story-ember opacity-70"
                      aria-hidden="true"
                    />
                    <span className="choice-sheen" aria-hidden="true" />
                    <span className="flex items-start gap-3.5">
                      <span className="choice-key mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-story-glow/50 bg-story-night/60 text-[13px] font-bold text-story-glow">
                        {option.key}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[17.5px] font-semibold leading-snug text-story-ink">
                          {option.label}
                        </span>
                        <span className="mt-1.5 block text-[13.5px] leading-relaxed text-story-ink/55">
                          {option.innerVoice}
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex w-full max-w-md flex-col gap-3">
            {!activeEnding.next && unlockedFinal < totalEndings && (
              <Button
                onClick={backToFork}
                className="h-12 rounded-full bg-story-glow text-[16px] font-semibold text-story-night hover:bg-story-glow/90"
              >
                <Sparkles className="size-4" />
                回到上一个岔路，走另一条
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

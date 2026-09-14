import {
  ChevronRight,
  LayoutGrid,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Users,
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
import { getAudience, recordChoice } from "@/lib/story/audience";
import { MASCOT } from "@/lib/story/mascot";
import { Ambience } from "@/lib/story/ambience";
import { Button } from "@/components/ui/button";

type Phase = "transition" | "intro" | "dialogue" | "choice" | "ending";

/** 结局 key，父分支 + 字母构成树状路径，如 A -> AB -> ABA */
type ChoiceKey = string;

const EMBERS = [8, 22, 37, 54, 68, 81, 92];

/** 向导是否已经接过引，按世界线分别记录：每进入一条新世界线都该有向导 */
const MASCOT_SEEN_PREFIX = "portal-mascot-seen:";

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
  /** 转场向导状态：none 不显示台词 / first 首次引导 / again 再次接入 */
  const [mascot, setMascot] = useState<"none" | "first" | "again">("none");
  const ambienceRef = useRef<Ambience | null>(null);
  /** 防止同一个结局被重复计入观众席 */
  const recordedRef = useRef<string | null>(null);


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

  /** 结束转场、进入入境页（转场可见即可，等待感降到最低） */
  const finishTransition = useCallback(() => {
    setMascot("none");
    setPhase("intro");
  }, []);

  useEffect(() => {
    if (phase !== "transition") return;
    // 每次接入都由看山出来引导；首次稍微多留一会儿，再次进入几乎不等待
    const seenKey = MASCOT_SEEN_PREFIX + activeId;
    const firstVisit =
      typeof window !== "undefined" && window.localStorage.getItem(seenKey) !== "1";
    setMascot(firstVisit ? "first" : "again");
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => {
        if (firstVisit && typeof window !== "undefined") {
          window.localStorage.setItem(seenKey, "1");
        }
        setMascot("none");
        setPhase("intro");
      },
      // 旧值 2600/1600 被实测出"点完入口还要硬等 2.9 秒"，这里压到 900/400
      reduced ? 120 : firstVisit ? 900 : 400,
    );
    return () => window.clearTimeout(timer);
  }, [phase, activeId]);

  const activeEnding: Ending | null = (choice ? story.endings[choice] : null) ?? null;
  const audience = activeEnding ? getAudience(story.id, activeEnding.key) : null;
  const activeNodes: StoryNode[] = activeEnding ? activeEnding.nodes : story.nodes;
  const activeNode = activeNodes[nodeIndex];
  const speaker = activeNode ? getCharacter(activeNode.speaker) : undefined;

  useEffect(() => {
    if (phase === "ending" && activeEnding) {
      setUnlocked(unlockEnding(story.id, activeEnding.key));
      // 观众席：把玩家自己这次的选择也记进去
      const mark = `${story.id}:${activeEnding.key}`;
      if (recordedRef.current !== mark) {
        recordedRef.current = mark;
        recordChoice(story.id, activeEnding.key);
      }
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
        <button
          type="button"
          onClick={finishTransition}
          aria-label="跳过接入动画，直接进入"
          className="transition-zoom absolute inset-0 z-30 grid cursor-pointer place-items-center bg-background"
        >
          <div className="flex flex-col items-center gap-5">
            {/* IP 向导：每次接入都由看山来引导 */}
            {/* 不加 CSS 位移动画——动画中的亚像素重采样会让图片变糊，素材自身已带动作 */}
            <img
              src={MASCOT.greeting}
              alt="穿越向导"
              width={120}
              height={120}
              className="size-28 object-contain drop-shadow-[0_8px_24px_oklch(0.1_0.02_260/50%)]"
            />
            <p className="text-[17px] font-medium tracking-[0.3em] text-muted-foreground">世界线接入中</p>
            {mascot === "first" && (
              <p className="text-[13px] text-muted-foreground/80">嗨，我是你的穿越向导，正在为你打开通道……</p>
            )}
            {mascot === "again" && (
              <p className="text-[13px] text-muted-foreground/80">又见面了，正在为你打开通道</p>
            )}
            <span className="mt-2 text-[11.5px] text-muted-foreground/60">点击任意处直接进入</span>
          </div>
        </button>
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
                {/* 观众席：这条路不是你一个人在走 */}
                {audience && (
                  <p className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-story-ink/15 px-3.5 py-1.5 text-[13px] text-story-ink/70">
                    <Users className="size-3.5" />
                    这条世界线上，{audience.percent}% 的人和你走到了同一个结局
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
            <div className="mt-8 w-full max-w-md text-left">
              <p className="text-[15px] leading-relaxed text-story-ink/75">{activeEnding.next.prompt}</p>
              <div className="mt-4 border-t border-story-ink/10">
                {activeEnding.next.choices.map((option, index) => (
                  <button
                    key={option.ending}
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
    }, 18);
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

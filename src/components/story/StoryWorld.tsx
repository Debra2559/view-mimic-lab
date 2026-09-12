import { ChevronRight, RotateCcw, Share2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ShareSheet } from "@/components/story/ShareSheet";
import {
  CHARACTER_NAME,
  CHARACTER_SPRITES,
  CHOICES,
  ENDINGS,
  INTRO_LINES,
  MAIN_NODES,
  STORY_BACKGROUND,
  type Ending,
  type StoryNode,
} from "@/lib/story";
import { Button } from "@/components/ui/button";

type Phase = "transition" | "intro" | "dialogue" | "choice" | "ending";
type ChoiceKey = "A" | "B";

export function StoryWorld({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("transition");
  const [nodeIndex, setNodeIndex] = useState(0);
  const [choice, setChoice] = useState<ChoiceKey | null>(null);
  const [muted, setMuted] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase("intro"), 1300);
    return () => window.clearTimeout(timer);
  }, []);

  const restart = () => {
    setChoice(null);
    setNodeIndex(0);
    setPhase("intro");
  };

  const activeNodes: StoryNode[] = choice ? ENDINGS[choice].nodes : MAIN_NODES;
  const activeNode = activeNodes[nodeIndex];
  const activeEnding: Ending | null = choice ? ENDINGS[choice] : null;

  const advance = () => {
    if (phase === "dialogue") {
      if (nodeIndex < activeNodes.length - 1) {
        setNodeIndex((value) => value + 1);
      } else if (choice) {
        setPhase("ending");
      } else {
        setPhase("choice");
      }
    }
  };

  const pick = (key: ChoiceKey) => {
    setChoice(key);
    setNodeIndex(0);
    setPhase("dialogue");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-story-night text-story-ink" role="dialog" aria-label="互动故事世界">
      <img
        src={STORY_BACKGROUND}
        alt="凌晨的老公寓楼道，一辆正在充电的电动车渗出烟雾"
        width={1344}
        height={768}
        className="scene-drift absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000 data-[visible=true]:opacity-100"
        data-visible={phase !== "transition" && phase !== "intro"}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-story-night/70 via-transparent to-story-night" aria-hidden="true" />

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
          {INTRO_LINES.map((line) => (
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
          <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
            <span className="rounded-full border border-story-ink/20 bg-story-panel px-3 py-1 text-[12px] tracking-widest text-story-ink/80">
              {choice ? "世界线 · 分歧之后" : "世界线 · 01"}
            </span>
            <div className="flex items-center gap-2">
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
          </header>

          {phase === "dialogue" && activeNode?.speaker === "linxia" && (
            <img
              key={`sprite-${choice ?? "main"}-${nodeIndex}`}
              src={CHARACTER_SPRITES[activeNode.expression ?? "calm"]}
              alt={`${CHARACTER_NAME}的半身立绘`}
              width={768}
              height={1024}
              className="sprite-rise absolute bottom-40 left-1/2 z-10 w-[62%] max-w-[340px] -translate-x-1/2 drop-shadow-[0_8px_32px_oklch(0.1_0.02_260/60%)] sm:bottom-44"
            />
          )}

          {phase === "dialogue" && activeNode && (
            <DialogueBox key={`dialogue-${choice ?? "main"}-${nodeIndex}`} node={activeNode} onAdvance={advance} />
          )}

          {phase === "choice" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-end gap-4 bg-story-night/60 px-6 pb-24 backdrop-blur-[2px]">
              <p className="choice-in mb-2 text-center text-[17px] font-medium text-story-ink">
                烟雾越来越浓。你的选择是——
              </p>
              {CHOICES.map((option, index) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => pick(option.key)}
                  className="choice-in w-full max-w-md cursor-pointer rounded-2xl border border-story-ink/15 bg-story-panel px-5 py-4 text-left backdrop-blur-md transition-colors hover:border-story-glow/60"
                  style={{ animationDelay: `${index * 0.12}s` }}
                >
                  <span className="block text-[17px] font-semibold text-story-ink">{option.label}</span>
                  <span className="mt-1 block text-[14px] text-story-ink/60">{option.innerVoice}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {phase === "ending" && activeEnding && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-story-night/85 px-8 text-center backdrop-blur-sm">
          <p className="text-[13px] tracking-[0.4em] text-story-glow">结局</p>
          <h2 className="mt-3 text-[30px] font-bold text-story-ink">「{activeEnding.title}」</h2>
          <p className="mt-6 max-w-md text-[16px] leading-[1.9] text-story-ink/85">{activeEnding.summary}</p>
          <div className="mt-10 flex w-full max-w-md flex-col gap-3">
            <Button
              onClick={restart}
              className="h-12 rounded-full bg-story-glow text-[16px] font-semibold text-story-night hover:bg-story-glow/90"
            >
              <RotateCcw className="size-4" />
              重启世界线
            </Button>
            <Button
              variant="outline"
              onClick={onExit}
              className="h-12 rounded-full border-story-ink/25 bg-transparent text-[16px] text-story-ink hover:bg-story-ink/10 hover:text-story-ink"
            >
              回到高赞回答
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShareOpen(true)}
              className="h-11 text-[15px] text-story-ink/70 hover:text-story-ink"
            >
              <Share2 className="size-4" />
              分享我的结局
            </Button>
          </div>
        </div>
      )}

      {shareOpen && activeEnding && <ShareSheet ending={activeEnding} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

function DialogueBox({ node, onAdvance }: { node: StoryNode; onAdvance: () => void }) {
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

  const isNarration = node.speaker === "narrator";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="点击继续剧情"
      className="absolute inset-x-0 bottom-0 z-20 cursor-pointer px-4 pb-6 pt-10 text-left"
    >
      <div className="rounded-2xl border border-story-ink/12 bg-story-panel px-5 pb-5 pt-4 backdrop-blur-md">
        {!isNarration && (
          <span className="absolute -top-3 left-6 rounded-full border border-story-glow/40 bg-story-night px-3 py-0.5 text-[13px] font-semibold text-story-glow">
            {CHARACTER_NAME}
          </span>
        )}
        <p className="min-h-[3.4em] text-[16.5px] leading-[1.75] text-story-ink/95">
          {node.text.slice(0, shown)}
          {typing && <span className="caret-blink ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-story-glow" />}
        </p>
        <span className="mt-1 flex justify-end text-[12px] text-story-ink/50">{typing ? "点击显示全文" : "点击继续 ▾"}</span>
      </div>
    </button>
  );
}

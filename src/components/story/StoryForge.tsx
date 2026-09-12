import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { generateStory } from "@/lib/story/generate.functions";
import { saveGenerated } from "@/lib/story/custom";

const SAMPLE = `每一次“去责任化”都不是一次性的塌方，而是一层层剥落……`;

export function StoryForge({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const generate = useServerFn(generateStory);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (question.trim().length < 2 || answer.trim().length < 30) {
      toast("再补充一点", { description: "需要提问标题和至少 30 字的回答正文。" });
      return;
    }
    setLoading(true);
    try {
      const data = await generate({ data: { question: question.trim(), answer: answer.trim() } });
      const entry = saveGenerated(data);
      toast("世界线生成完成", { description: data.hook });
      onCreated(entry.id);
    } catch (error) {
      toast("生成失败", {
        description: error instanceof Error ? error.message : "请稍后再试一次。",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-story-night/95 backdrop-blur-xl"
      role="dialog"
      aria-label="投喂知乎回答生成世界线"
    >
      <header className="sticky top-0 flex items-center justify-between border-b border-story-ink/10 bg-story-night/80 px-4 py-3 backdrop-blur-xl">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] tracking-[0.3em] text-story-glow">
            <Wand2 className="size-3.5" />
            世界线锻造台
          </p>
          <h2 className="mt-1 text-[19px] font-bold text-story-ink">投喂一条真实的「如果」回答</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="关闭锻造台"
          onClick={onClose}
          className="size-10 rounded-full bg-story-panel text-story-ink/80 hover:text-story-ink"
        >
          <X className="size-5" />
        </Button>
      </header>

      <div className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 py-5">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] text-story-ink/70">知乎提问</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="如果人类突然拥有读心术，会怎样？"
            className="h-12 rounded-xl border border-story-ink/15 bg-story-panel px-4 text-[15px] text-story-ink outline-none placeholder:text-story-ink/35 focus:border-story-glow/60"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[13px] text-story-ink/70">高赞回答正文（粘贴原文即可）</span>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={10}
            placeholder={SAMPLE}
            className="resize-y rounded-xl border border-story-ink/15 bg-story-panel px-4 py-3 text-[14.5px] leading-[1.8] text-story-ink outline-none placeholder:text-story-ink/30 focus:border-story-glow/60"
          />
          <span className="text-right text-[11.5px] text-story-ink/40">{answer.length} / 8000</span>
        </label>

        <p className="rounded-xl border border-story-ink/12 bg-story-panel px-4 py-3 text-[12.5px] leading-[1.8] text-story-ink/60">
          将自动生成这条回答专属的穿越入口、剧情对白、角色立绘与两条分支结局，并放进互动宇宙大厅。
        </p>

        <Button
          onClick={submit}
          disabled={loading}
          className="h-12 rounded-full bg-story-glow text-[16px] font-semibold text-story-night hover:bg-story-glow/90"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "正在生成世界线…" : "生成这条世界线"}
        </Button>
        {loading && (
          <p className="text-center text-[12px] text-story-ink/45">
            正在改写剧情与分支，通常需要 20~60 秒。
          </p>
        )}
      </div>
    </div>
  );
}

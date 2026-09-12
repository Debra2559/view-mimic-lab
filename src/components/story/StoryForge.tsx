import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Search, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  discoverPosts,
  generateStory,
  type CandidatePost,
} from "@/lib/story/generate.functions";
import { saveGenerated } from "@/lib/story/custom";

const SAMPLE = `每一次“去责任化”都不是一次性的塌方，而是一层层剥落……`;

type Tab = "pick" | "paste";

export function StoryForge({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const generate = useServerFn(generateStory);
  const discover = useServerFn(discoverPosts);

  const [tab, setTab] = useState<Tab>("pick");
  const [keyword, setKeyword] = useState("");
  const [posts, setPosts] = useState<CandidatePost[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (kw?: string) => {
    setSearching(true);
    try {
      const list = await discover({ data: kw?.trim() ? { keyword: kw.trim() } : {} });
      setPosts(list);
    } catch (error) {
      toast("检索失败", {
        description: error instanceof Error ? error.message : "请稍后再试一次。",
      });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (q: string, a: string, busyKey?: string) => {
    if (busyKey) setPending(busyKey);
    else setLoading(true);
    try {
      const data = await generate({ data: { question: q, answer: a } });
      const entry = saveGenerated(data);
      toast("世界线生成完成", { description: data.hook });
      onCreated(entry.id);
    } catch (error) {
      toast("生成失败", {
        description: error instanceof Error ? error.message : "请稍后再试一次。",
      });
    } finally {
      setPending(null);
      setLoading(false);
    }
  };

  const submitPaste = () => {
    if (question.trim().length < 2 || answer.trim().length < 30) {
      toast("再补充一点", { description: "需要提问标题和至少 30 字的回答正文。" });
      return;
    }
    void create(question.trim(), answer.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-story-night/95 backdrop-blur-xl"
      role="dialog"
      aria-label="选择帖子生成世界线"
    >
      <header className="sticky top-0 z-10 border-b border-story-ink/10 bg-story-night/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] tracking-[0.3em] text-story-glow">
              <Wand2 className="size-3.5" />
              世界线锻造台
            </p>
            <h2 className="mt-1 text-[19px] font-bold text-story-ink">挑一条「如果」，一键开世界</h2>
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
        </div>

        <div className="mt-3 flex gap-2">
          {(
            [
              ["pick", "选帖子生成"],
              ["paste", "粘贴原文"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`h-8 rounded-full px-3.5 text-[12.5px] transition-colors ${
                tab === key
                  ? "bg-story-glow text-story-night"
                  : "bg-story-panel text-story-ink/60 hover:text-story-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === "pick" ? (
        <div className="mx-auto flex max-w-[560px] flex-col gap-3 px-4 py-4">
          <div className="flex gap-2">
            <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-story-ink/15 bg-story-panel px-3">
              <Search className="size-4 shrink-0 text-story-ink/40" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void search(keyword)}
                placeholder="想穿越什么方向？如：末日、职场、时间"
                className="w-full bg-transparent text-[14px] text-story-ink outline-none placeholder:text-story-ink/35"
              />
            </div>
            <Button
              onClick={() => void search(keyword)}
              disabled={searching}
              aria-label="一键检索合适的帖子"
              className="h-11 shrink-0 rounded-xl bg-story-glow px-4 text-[14px] font-semibold text-story-night hover:bg-story-glow/90"
            >
              {searching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              一键检索
            </Button>
          </div>

          {searching && posts.length === 0 && (
            <p className="py-10 text-center text-[13px] text-story-ink/45">
              正在检索合适的「如果」帖子…
            </p>
          )}

          {posts.map((post) => {
            const busy = pending === post.question;
            return (
              <article
                key={post.question}
                className="rounded-2xl border border-story-ink/12 bg-story-panel p-4"
              >
                <div className="flex items-center gap-2 text-[11.5px] text-story-ink/45">
                  <span className="rounded-full bg-story-glow/15 px-2 py-0.5 text-story-glow">
                    {post.category}
                  </span>
                  <span>{post.heat}</span>
                </div>
                <h3 className="mt-2 text-[16px] font-semibold leading-[1.5] text-story-ink">
                  {post.question}
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.75] text-story-ink/60">{post.summary}</p>
                <p className="mt-2 line-clamp-3 text-[12.5px] leading-[1.8] text-story-ink/40">
                  {post.excerpt}
                </p>
                <Button
                  onClick={() => void create(post.question, post.excerpt, post.question)}
                  disabled={busy || pending !== null}
                  className="mt-3 h-10 w-full rounded-full bg-story-glow text-[14.5px] font-semibold text-story-night hover:bg-story-glow/90"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {busy ? "正在生成世界线…" : "一键生成剧情"}
                </Button>
              </article>
            );
          })}

          {!searching && posts.length === 0 && (
            <p className="py-10 text-center text-[13px] text-story-ink/45">
              没有检索到帖子，换个方向再试一次。
            </p>
          )}
        </div>
      ) : (
        <div className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 py-5">
          <label className="flex flex-col gap-2">
            <span className="text-[13px] text-story-ink/70">提问标题</span>
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

          <Button
            onClick={submitPaste}
            disabled={loading}
            className="h-12 rounded-full bg-story-glow text-[16px] font-semibold text-story-night hover:bg-story-glow/90"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "正在生成世界线…" : "生成这条世界线"}
          </Button>
        </div>
      )}

      {(loading || pending) && (
        <p className="pb-6 text-center text-[12px] text-story-ink/45">
          正在改写剧情与分支，通常需要 20~60 秒。
        </p>
      )}
    </div>
  );
}

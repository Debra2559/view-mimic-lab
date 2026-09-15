import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  MessageCircle,
  MoreVertical,
  Share2,
  Sparkles,
  Star,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StoryWorld } from "@/components/story/StoryWorld";
import { LoginPromptSheet, useZhihuAuth } from "@/components/story/LoginGate";
import { QuoteCardSheet } from "@/components/story/QuoteCardSheet";
import { Button } from "@/components/ui/button";
import { getContributors, getPost, type SideAnswer } from "@/lib/feed";
import { getArticle } from "@/lib/articles";
import { ImportedArticleView } from "@/components/story/ImportedArticleView";
import { getStory } from "@/lib/story";
import { mascotFor } from "@/lib/story/mascot";

export const Route = createFileRoute("/answer/$id")({
  loader: ({ params }) => {
    const post = getPost(params.id) ?? null;
    const article = getArticle(params.id) ?? null;
    if (!post && !article) throw notFound();
    return { post, article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "回答不存在 — 看山画境" }, { name: "robots", content: "noindex" }] };
    }
    const { post, article } = loaderData;
    const title = post?.title ?? article?.title ?? "看山画境";
    const description = (post?.excerpt ?? article?.excerpt ?? "").slice(0, 150);
    return {
      meta: [
        { title: `${title} — 看山画境` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: AnswerNotFound,
  component: AnswerPage,
});

function AnswerNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[768px] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-[22px] font-bold">没有找到这条回答</h1>
      <Button asChild>
        <Link to="/">返回首页</Link>
      </Button>
    </main>
  );
}

function AnswerPage() {
  const { post, article } = Route.useLoaderData();

  // 从知乎导入的真文章：金句卡挂在正文对应的那一段上
  if (article && !post) return <ImportedArticleView article={article} />;

  const [followed, setFollowed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);
  const story = post.storyId ? getStory(post.storyId) : null;
  const contributors = getContributors(post);

  /** 划线金句：用户在正文里划中的句子 */
  const [selection, setSelection] = useState<{
    text: string;
    paraIndex: number;
    top: number;
    left: number;
  } | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  // 硬门禁：剧场（裂缝入口）与金句卡都需要先登录知乎账号
  const gate = useZhihuAuth();
  const [gateFeature, setGateFeature] = useState("");
  const requireLogin = (feature: string, run: () => void) => {
    if (gate.authorized) {
      run();
      return;
    }
    setGateFeature(feature);
  };

  // 划中正文里的句子 → 浮出「生成金句卡」
  useEffect(() => {
    const check = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const text = sel.toString().replace(/\s+/g, " ").trim();
      if (text.length < 6 || text.length > 90) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
      const para = el?.closest("[data-para-index]");
      if (!para) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setSelection({
        text,
        paraIndex: Number(para.getAttribute("data-para-index")),
        top: Math.max(rect.top - 54, 70),
        left: Math.min(Math.max(rect.left + rect.width / 2, 80), window.innerWidth - 80),
      });
    };
    document.addEventListener("mouseup", check);
    document.addEventListener("touchend", check);
    return () => {
      document.removeEventListener("mouseup", check);
      document.removeEventListener("touchend", check);
    };
  }, []);

  // 扫码落地：?hl=<段落序号> → 滚到那一段并高亮（金句在原文里的位置）
  useEffect(() => {
    const hl = new URLSearchParams(window.location.search).get("hl");
    if (hl === null) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`para-${hl}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("quote-highlight");
      window.setTimeout(() => el.classList.remove("quote-highlight"), 3800);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [post.id]);

  const scrollToNext = () => {
    window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });
  };

  const share = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const data = { title: post.title, text: post.excerpt.slice(0, 60), url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(`${post.title}\n${url}`);
      toast.success("链接已复制，去分享给朋友吧");
    } catch {
      toast.error("分享没有成功，可以手动复制地址栏链接");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[768px] bg-background pb-24 text-foreground md:border-x md:border-border">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="flex h-12 items-center justify-between px-8 pt-3 text-[15px] font-semibold sm:px-10">
          <span>11:11</span>
          <div className="flex items-center gap-2" aria-label="网络与电量状态">
            <span className="flex items-end gap-0.5" aria-hidden="true">
              <i className="h-1 w-1 rounded-sm bg-foreground" />
              <i className="h-2 w-1 rounded-sm bg-foreground" />
              <i className="h-3 w-1 rounded-sm bg-foreground" />
              <i className="h-4 w-1 rounded-sm bg-foreground" />
            </span>
            <Wifi className="size-5" strokeWidth={2.6} />
            <span className="relative h-4 w-7 rounded-[5px] border-2 border-foreground/70 p-0.5">
              <i className="block h-full w-4 rounded-sm bg-foreground" />
            </span>
          </div>
        </div>

        <nav className="flex h-[64px] items-center gap-2 border-b border-border px-3" aria-label="页面导航">
          <Button variant="ghost" size="icon" aria-label="返回首页" asChild>
            <Link to="/">
              <ChevronLeft className="size-7" strokeWidth={1.8} />
            </Link>
          </Button>
          <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{post.title}</span>
          <Button variant="ghost" size="icon" aria-label="分享" onClick={share}>
            <Share2 className="size-6" strokeWidth={1.8} />
          </Button>
        </nav>
      </div>

      <header className="border-b border-border px-5 pb-6 pt-6 sm:px-8">
        <h1 className="text-[25px] font-bold leading-[1.35]">{post.title}</h1>
        <p className="mt-3 text-[16px] text-muted-foreground">{post.questionMeta}</p>

        {story && (
          <button
            type="button"
            onClick={() => requireLogin("剧场", () => setStoryId(post.storyId!))}
            className="portal-chip group relative mt-5 flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-kanshan-line bg-gradient-to-r from-kanshan-sky/70 to-white p-2 pr-3 text-left backdrop-blur-sm transition-all duration-200 hover:border-kanshan-blue/40 hover:shadow-md"
            aria-label={`${story.portal.title}，${story.portal.action}`}
          >
            <span className="portal-chip-glow absolute inset-0 opacity-50" aria-hidden="true" />
            {/* 场景缩略图 + 右下角看山角标：这条线是看山画的 */}
            <span className="relative shrink-0">
              <img
                src={story.background}
                alt={story.backgroundAlt}
                className="relative size-[52px] rounded-xl object-cover"
                loading="lazy"
              />
              <img
                src={mascotFor(story.id)}
                alt=""
                aria-hidden="true"
                width={40}
                height={40}
                className="absolute -bottom-1 -right-1 size-5 object-contain drop-shadow-[0_1px_3px_oklch(0.25_0.03_260/35%)]"
              />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[12px] font-medium text-kanshan-blue">
                <Sparkles className="size-3" strokeWidth={1.8} />
                {story.portal.title}
              </span>
              <span className="mt-0.5 block truncate text-[14px] font-semibold text-foreground/90">
                {story.portal.action}
              </span>
            </span>
            <ChevronRight className="relative size-4 shrink-0 text-kanshan-blue/70 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </button>
        )}
      </header>


      <article className="px-5 pb-8 pt-7 sm:px-8">
        <section className="flex items-center gap-3" aria-label="作者信息">
          {post.avatar ? (
            <img
              src={post.avatar}
              alt={`作者${post.author}头像`}
              className="size-[54px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className={`grid size-[54px] shrink-0 place-items-center rounded-full bg-gradient-to-br text-[20px] font-bold text-white ${post.accent}`}
              aria-hidden="true"
            >
              {post.author.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[19px] font-semibold">{post.author}</h2>
            <p className="mt-0.5 truncate text-[15px] text-muted-foreground">{post.bio}</p>
          </div>
          <Button
            variant="ghost"
            aria-pressed={followed}
            onClick={() => setFollowed((value) => !value)}
            className="h-11 min-w-[96px] rounded-full bg-primary-soft px-5 text-[17px] font-semibold text-primary hover:bg-primary-soft/80 hover:text-primary"
          >
            {followed ? "已关注" : "+ 关注"}
          </Button>
        </section>

        <div className="mt-5 flex items-center justify-between text-[15px] text-muted-foreground">
          <span>{post.upvotes} 人赞同了该回答 〉</span>
          <span className="flex items-center gap-1.5 text-primary">
            <Headphones className="size-[18px] fill-primary" />201 人听过
          </span>
        </div>

        <div className="answer-copy mt-5 space-y-7 text-[20px] leading-[1.78]">
          {post.paragraphs.map((text, index) => (
            <p
              key={`${post.id}-p-${index}`}
              id={`para-${index}`}
              data-para-index={index}
              className="scroll-mt-24 rounded-md transition-colors duration-500"
            >
              {text}
            </p>
          ))}
        </div>
      </article>

      {post.otherAnswers.length > 0 && (
        <section className="border-t-8 border-muted px-5 pb-10 pt-6 sm:px-8" aria-label="全部回答">
          <h2 className="text-[19px] font-bold">全部 {contributors.length} 个回答</h2>
          <ul className="mt-4 space-y-4">
            {post.otherAnswers.map((answer) => (
              <OtherAnswer key={answer.id} answer={answer} />
            ))}
          </ul>
          {story && (
            <Button
              variant="outline"
              onClick={() => requireLogin("剧场", () => setStoryId(post.storyId!))}
              className="mt-6 h-12 w-full rounded-full border-primary/40 text-[16px] font-semibold text-primary hover:text-primary"
            >
              <Sparkles className="size-[18px]" />
              进入这个世界
            </Button>
          )}
        </section>
      )}


      <Button
        variant="outline"
        size="icon"
        aria-label="向下阅读"
        onClick={scrollToNext}
        className="fixed bottom-24 right-[max(1.5rem,calc((100vw-768px)/2+1.5rem))] z-20 size-12 rounded-full border-border bg-background shadow-lg"
      >
        <ChevronDown className="size-6" />
      </Button>

      <footer className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[74px] max-w-[768px] items-center border-t border-border bg-background px-4 shadow-[0_-6px_18px_var(--footer-shadow)] sm:px-8">
        <Button
          variant="ghost"
          onClick={() => setFollowed((value) => !value)}
          className="px-2 text-[16px] font-semibold text-primary hover:text-primary"
        >
          {followed ? "已关注" : "+关注"}
        </Button>
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <ActionButton
            label="赞同"
            count={liked ? post.upvotes + 1 : post.upvotes}
            active={liked}
            onClick={() => setLiked((v) => !v)}
          >
            <ArrowBigUp />
          </ActionButton>
          <ActionButton label="不赞同">
            <ArrowBigDown />
          </ActionButton>
          <ActionButton
            label="收藏"
            count={saved ? post.stars + 1 : post.stars}
            active={saved}
            onClick={() => setSaved((v) => !v)}
          >
            <Star />
          </ActionButton>
          <ActionButton label="评论" count={post.comments}>
            <MessageCircle />
          </ActionButton>
          <ActionButton label="分享" onClick={share}>
            <Share2 />
          </ActionButton>
          <ActionButton label="更多">
            <MoreVertical />
          </ActionButton>
        </div>
      </footer>

      {storyId && <StoryWorld storyId={storyId} onExit={() => setStoryId(null)} />}

      {gateFeature && (
        <LoginPromptSheet feature={gateFeature} open onClose={() => setGateFeature("")} />
      )}

      {/* 划线金句：在正文里划中一句话，浮出入口 */}
      {selection && !quoteOpen && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => requireLogin("金句卡", () => setQuoteOpen(true))}
          style={{ top: selection.top, left: selection.left }}
          className="fixed z-40 inline-flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-kanshan-blue px-3.5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-kanshan-blue/30 transition-transform hover:scale-105"
        >
          <Sparkles className="size-3.5" />
          生成金句卡
        </button>
      )}

      {quoteOpen && selection && (
        <QuoteCardSheet
          input={{
            mode: "quote",
            quote: selection.text,
            source: post.title,
            meta: `${post.author} · 知乎回答`,
            label: "划 线 金 句",
            colors: ["#2a3a5a", "#3d5a9a"],
            qrHint: "扫码回到原文这一句",
          }}
          shareUrl={`${window.location.origin}/answer/${post.id}?hl=${selection.paraIndex}`}
          shareText={`在知乎读到一句：「${selection.text}」——出自「${post.title}」。`}
          onClose={() => {
            setQuoteOpen(false);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        />
      )}
    </main>
  );
}

function ActionButton({
  label,
  count,
  active = false,
  onClick,
  children,
}: {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={onClick ? active : undefined}
      onClick={onClick}
      className={active ? "relative size-11 text-primary hover:text-primary" : "relative size-11"}
    >
      <span className="[&_svg]:size-7 [&_svg]:stroke-[1.7]">{children}</span>
      {count !== undefined && <span className="absolute -right-1 top-0 text-[11px] font-medium">{count}</span>}
    </Button>
  );
}

function OtherAnswer({ answer }: { answer: SideAnswer }) {
  const [open, setOpen] = useState(false);
  const paragraphs = open ? answer.paragraphs : answer.paragraphs.slice(0, 1);

  return (
    <li className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2.5">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[15px] font-bold text-white ${answer.accent}`}
          aria-hidden="true"
        >
          {answer.author.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{answer.author}</p>
          <p className="truncate text-[13px] text-muted-foreground">{answer.bio}</p>
        </div>
      </div>
      <p className="mt-3 inline-flex rounded-full bg-primary-soft/60 px-3 py-1 text-[12px] font-semibold text-primary">
        {answer.stance}
      </p>
      <div className={`answer-copy mt-3 space-y-4 text-[17px] leading-[1.75] ${open ? "" : "text-foreground/85"}`}>
        {paragraphs.map((text, index) => (
          <p key={`${answer.id}-p-${index}`} className={!open && index === 0 ? "line-clamp-3" : ""}>
            {text}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[14px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ArrowBigUp className="size-5" strokeWidth={1.6} />
          {answer.upvotes}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="ml-auto text-[15px] font-semibold text-primary"
        >
          {open ? "收起" : "展开全文"}
        </button>
      </div>
    </li>
  );
}

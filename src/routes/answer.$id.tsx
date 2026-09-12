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
import { useState } from "react";
import { toast } from "sonner";

import { PortalEntry } from "@/components/story/PortalEntry";
import { StoryWorld } from "@/components/story/StoryWorld";
import { Button } from "@/components/ui/button";
import { getContributors, getPost, type SideAnswer } from "@/lib/feed";
import { getStory } from "@/lib/story";

export const Route = createFileRoute("/answer/$id")({
  loader: ({ params }) => {
    const post = getPost(params.id);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "回答不存在 — 穿越乎" }, { name: "robots", content: "noindex" }] };
    }
    const { post } = loaderData;
    const description = post.excerpt.slice(0, 150);
    return {
      meta: [
        { title: `${post.title} — 穿越乎` },
        { name: "description", content: description },
        { property: "og:title", content: post.title },
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
  const { post } = Route.useLoaderData();
  const [followed, setFollowed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);
  const story = post.storyId ? getStory(post.storyId) : null;
  const contributors = getContributors(post);

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
          <section
            className="mt-5 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-soft/70 to-primary-soft/20 p-4"
            aria-label="这个问题的世界线"
          >
            <p className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-primary">
              <Globe2 className="size-4" />
              本问题已生成 1 条世界线
            </p>
            <p className="mt-2 text-[16px] font-semibold leading-snug">
              这条世界线由本题的 {contributors.length} 个回答共同长成
            </p>
            <ul className="mt-3 space-y-2">
              {contributors.map((person) => (
                <li key={person.id} className="flex items-center gap-2.5">
                  {person.avatar ? (
                    <img src={person.avatar} alt="" className="size-7 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[12px] font-bold text-white ${person.accent}`}
                      aria-hidden="true"
                    >
                      {person.author.slice(0, 1)}
                    </span>
                  )}
                  <span className="shrink-0 text-[14px] font-medium">{person.author}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{person.stance}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setStoryId(post.storyId!)}
              className="mt-4 h-11 w-full rounded-full text-[16px] font-semibold"
            >
              <Sparkles className="size-[18px]" />
              穿过这些回答，进入那个世界
            </Button>
          </section>
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
            <div key={`${post.id}-p-${index}`} className="space-y-7">
              <p>{text}</p>
              {story && post.portalAfter === index + 1 && (
                <PortalEntry story={story} onEnter={setStoryId} />
              )}
            </div>
          ))}
        </div>
      </article>

      {post.otherAnswers.length > 0 && (
        <section className="border-t-8 border-muted px-5 pb-10 pt-6 sm:px-8" aria-label="全部回答">
          <h2 className="text-[19px] font-bold">
            全部 {contributors.length} 个回答
            {story && (
              <span className="ml-2 align-middle text-[13px] font-medium text-primary">都参与构成了这条世界线</span>
            )}
          </h2>
          <ul className="mt-4 space-y-4">
            {post.otherAnswers.map((answer) => (
              <OtherAnswer key={answer.id} answer={answer} />
            ))}
          </ul>
          {story && (
            <Button
              variant="outline"
              onClick={() => setStoryId(post.storyId!)}
              className="mt-6 h-12 w-full rounded-full border-primary/40 text-[16px] font-semibold text-primary hover:text-primary"
            >
              <Sparkles className="size-[18px]" />
              带着这些视角，进入世界
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

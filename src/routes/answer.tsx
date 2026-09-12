import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  ChevronLeft,
  Headphones,
  MessageCircle,
  MoreVertical,
  Search,
  Share2,
  SquarePen,
  Star,
  UserRoundPlus,
  Wifi,
} from "lucide-react";
import { useState } from "react";

import authorAvatar from "@/assets/author-avatar.jpg";
import { PortalEntry } from "@/components/story/PortalEntry";
import { StoryWorld } from "@/components/story/StoryWorld";
import { getStory } from "@/lib/story";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "社会现象如果大家都去责任化的结果会是什么？" },
      {
        name: "description",
        content: "关于社会责任与公共安全的深度回答。",
      },
      { property: "og:title", content: "社会现象如果大家都去责任化的结果会是什么？" },
      { property: "og:description", content: "关于社会责任与公共安全的深度回答。" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnswerPage,
});

function AnswerPage() {
  const [followed, setFollowed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);
  const answerStory = getStory("corridor");

  const scrollToNext = () => {
    window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });
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

        <nav className="flex h-[72px] items-center border-b border-border px-4" aria-label="页面导航">
          <Button variant="ghost" size="icon" aria-label="返回上一页" onClick={() => history.back()}>
            <ChevronLeft className="size-7" strokeWidth={1.8} />
          </Button>
          <div className="ml-auto flex items-center gap-1 text-primary">
            <Button variant="ghost" className="h-11 px-3 text-[17px] font-semibold text-primary">
              <UserRoundPlus className="size-[21px]" />邀请回答
            </Button>
            <Button variant="ghost" className="h-11 px-3 text-[17px] font-semibold text-primary">
              <SquarePen className="size-[20px]" />写回答
            </Button>
            <Button variant="ghost" size="icon" aria-label="搜索" className="ml-1">
              <Search className="size-7 text-foreground" strokeWidth={1.8} />
            </Button>
          </div>
        </nav>
      </div>

      <header className="border-b border-border px-5 pb-6 pt-6 sm:px-8">
        <h1 className="text-[25px] font-bold leading-[1.35] tracking-normal">
          社会现象如果大家都去责任化的结果会是什么？
        </h1>
        <p className="mt-3 text-[16px] text-muted-foreground">知乎 · 1,340 个回答 · 3499 个关注 〉</p>
      </header>

      <article className="px-5 pb-8 pt-7 sm:px-8">
        <section className="flex items-center gap-3" aria-label="作者信息">
          <img
            src={authorAvatar}
            alt="作者东莞仔头像"
            width={512}
            height={512}
            className="size-[54px] shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[19px] font-semibold">东莞仔</h2>
              <span className="grid size-6 place-items-center rounded-md bg-badge text-xs font-bold text-badge-foreground">◇</span>
              <span className="grid size-6 place-items-center rounded-full border-2 border-badge bg-badge-soft text-xs">◎</span>
            </div>
            <p className="mt-0.5 truncate text-[15px] text-muted-foreground">和联胜准话事人。</p>
          </div>
          <Button
            variant="ghost"
            aria-pressed={followed}
            onClick={() => setFollowed((value) => !value)}
            className="h-11 min-w-[96px] rounded-full bg-primary-soft px-5 text-[17px] font-semibold text-primary hover:bg-primary-soft/80 hover:text-primary"
          >
            {followed ? "已关注" : "+ 关注"}
          </Button>
          <Button variant="ghost" size="icon" aria-label="分享回答" className="hidden sm:inline-flex">
            <Share2 className="size-7" strokeWidth={1.8} />
          </Button>
        </section>

        <div className="mt-5 flex items-center justify-between text-[15px] text-muted-foreground">
          <span>6306 人赞同了该回答 〉</span>
          <span className="flex items-center gap-1.5 text-primary">
            <Headphones className="size-[18px] fill-primary" />201 人听过
          </span>
        </div>

        <div className="answer-copy mt-5 space-y-7 text-[20px] leading-[1.78] tracking-normal">
          <p>结果就是，整个社会的运行成本会极速上升。任何不起眼的小事最终都有可能演化成重大事故。</p>
          <p>举个最简单的例子。</p>
          <p>一个外卖员凌晨到一个小区送餐，当他送完下楼以后发现一个违规在楼道里充电的电动车车座位置正在往外冒烟，这是电池内部燃烧的征兆。周围还堆积了一大堆纸壳塑料等回收垃圾。</p>
          <p>此时根据这个外卖员的心态就会诞生两个选择。</p>
          <PortalEntry story={answerStory} onEnter={setStoryId} />
          <p className="border-b border-dashed border-muted-foreground/60">
            A外卖员是个善良且富有责任感的人，他觉得自己发现了这个危险源，自己就有责任去解决，于是他会选择马上报警，同时通知物业管理人员，帮忙与其一起转移这辆随时要烧起来的电动车。
          </p>
          <p>外卖员用自己可能被烧伤的风险与耽误的送单时间，换得了整栋楼的财产与人身安全。</p>
          <p>B外卖员认为这不是自己的职责，物业和车主才应该承担责任。他继续离开，最终火势蔓延，所有人都为一次原本可以阻止的小事故付出了更大的代价。</p>
        </div>
      </article>

      <Button
        variant="outline"
        size="icon"
        aria-label="向下阅读"
        onClick={scrollToNext}
        className="fixed bottom-24 right-[max(1.5rem,calc((100vw-768px)/2+1.5rem))] z-20 size-12 rounded-full border-border bg-background shadow-lg"
      >
        <ChevronDown className="size-6" />
      </Button>

      <footer className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[74px] max-w-[768px] items-center border-t border-border bg-background px-5 shadow-[0_-6px_18px_var(--footer-shadow)] sm:px-8">
        <img src={authorAvatar} alt="东莞仔" width={512} height={512} className="size-10 rounded-full object-cover" />
        <span className="ml-2 max-w-12 truncate text-[15px]">东...</span>
        <Button
          variant="ghost"
          onClick={() => setFollowed((value) => !value)}
          className="px-2 text-[16px] font-semibold text-primary hover:text-primary"
        >
          {followed ? "已关注" : "+关注"}
        </Button>
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <ActionButton label="赞同" count={liked ? 6307 : 6306} active={liked} onClick={() => setLiked((v) => !v)}>
            <ArrowBigUp />
          </ActionButton>
          <ActionButton label="不赞同"><ArrowBigDown /></ActionButton>
          <ActionButton label="收藏" count={saved ? 714 : 713} active={saved} onClick={() => setSaved((v) => !v)}>
            <Star />
          </ActionButton>
          <ActionButton label="评论" count={463}><MessageCircle /></ActionButton>
          <ActionButton label="更多"><MoreVertical /></ActionButton>
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
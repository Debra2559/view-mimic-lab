import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowBigUp,
  BadgeCheck,
  Flame,
  House,
  MessageCircle,
  Mic,
  Plus,
  Sparkles,
  Star,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import authorAvatar from "@/assets/author-avatar.jpg";
import { type FeedPost } from "@/lib/feed";
import {
  getClicks,
  getRankedPosts,
  getRotatedFeed,
  heatLabel,
  heatScore,
  recordClick,
} from "@/lib/heat";
import { ArticleCard } from "@/components/story/ArticleCard";
import { IMPORTED_ARTICLES, type ImportedArticle } from "@/lib/articles";
import { MASCOT_STILL } from "@/lib/story/mascot";
import { WorldHub } from "@/components/story/WorldHub";
import { LoginGateOverlay, useZhihuAuth } from "@/components/story/LoginGate";
import { ZhihuAvatar } from "@/components/story/ZhihuAvatar";
import { zhihuAuthState } from "@/lib/zhihu/zhihu.functions";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "推荐 — 看山画境" },
      {
        name: "description",
        content: "知乎风格推荐流：每一个「如果」的回答背后，都藏着一条可以穿越的世界线。",
      },
      { property: "og:title", content: "推荐 — 看山画境" },
      { property: "og:description", content: "每一个「如果」的回答背后，都藏着一条可以穿越的世界线。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // 在服务端就把登录态取好交给首屏：否则 SSR HTML 里先是默认头像，水合后才换成真头像（会闪）
  loader: async () => ({ zhihu: await zhihuAuthState() }),
  component: FeedPage,
});

const TABS = ["关注", "推荐", "热榜", "故事", "知识", "圈子", "专栏"];

function formatCount(value: number) {
  return value >= 10000 ? `${(value / 10000).toFixed(1)} 万` : String(value);
}

function FeedPage() {
  const [activeTab, setActiveTab] = useState("推荐");
  const [dismissed, setDismissed] = useState<string[]>([]);
  /** 首页直接打开「世界线大厅」：否则金句剧场这类没有推荐流帖子的内容无处可找 */
  const [hubOpen, setHubOpen] = useState(false);
  const [hubGateOpen, setHubGateOpen] = useState(false);
  const navigate = useNavigate();
  // 知乎登录态：首屏用 loader（服务端）给的值，客户端再刷新一次
  const zhihu = useZhihuAuth(Route.useLoaderData().zhihu);

  // 热度排序 + 每次进首页轮换一位，热榜常看常新。
  // 轮换依赖 sessionStorage，挂载后再启用，避免服务端与客户端首屏不一致。
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // 金句分享卡的二维码落地：扫码打开 ?flash=xxx，直接落在那句金句的位置并高亮
  useEffect(() => {
    if (!hydrated) return;
    const flashId = new URLSearchParams(window.location.search).get("flash");
    if (!flashId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`flashcard-${flashId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-kanshan-blue/70", "rounded-2xl");
      window.setTimeout(() => {
        el.classList.remove("ring-4", "ring-kanshan-blue/70", "rounded-2xl");
      }, 3200);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [hydrated]);
  const ranked = useMemo(
    () => (hydrated ? getRotatedFeed() : getRankedPosts()),
    [hydrated],
  );
  const items = ranked.filter((item) => !dismissed.includes(item.id));

  // 主页只放文章：本地内容 + 从知乎导入的真文章（每 2 条插 1 篇）。
  // 金句闪卡不再作为独立模块出现——它挂在文章正文里对应的那一段上；
  // 金句剧场移进「看山画境」大厅（互动游戏社区）。
  const mixed = useMemo(() => {
    const out: Array<
      | { type: "post"; item: FeedPost }
      | { type: "article"; item: ImportedArticle }
    > = [];
    const queue = [...IMPORTED_ARTICLES];
    items.forEach((item, index) => {
      out.push({ type: "post", item });
      if ((index + 1) % 2 === 0 && queue.length > 0) {
        out.push({ type: "article", item: queue.shift()! });
      }
    });
    // 本地内容不够长时，剩余文章补在末尾
    while (queue.length > 0) out.push({ type: "article", item: queue.shift()! });
    return out;
  }, [items]);


  return (
    <main className="mx-auto min-h-screen max-w-[768px] bg-background pb-24 text-foreground md:border-x md:border-border">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="flex h-12 items-center justify-between px-8 pt-3 text-[15px] font-semibold sm:px-10">
          <span>10:38</span>
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

        <div className="px-4 pb-2 pt-1">
          <div className="flex h-12 items-center gap-2 rounded-full border-2 border-primary/70 bg-primary-soft/40 px-4">
            <span className="min-w-0 flex-1 truncate text-[16px] text-muted-foreground">
              如果地球停止自转，会怎样？
            </span>
            <span className="shrink-0 rounded-md border border-rose-400 px-1 text-[12px] font-semibold text-rose-500">
              热
            </span>
            <Mic className="size-5 shrink-0 text-muted-foreground" />
            <span className="shrink-0 rounded-full bg-primary-soft px-4 py-1.5 text-[16px] font-semibold text-primary">
              搜索
            </span>
          </div>
        </div>

        <nav
          className="flex items-center gap-6 overflow-x-auto border-b border-border px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="频道"
        >
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={active}
                className={`relative h-12 shrink-0 text-[19px] transition-colors ${
                  active ? "font-bold text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab}
                {tab === "关注" && (
                  <span className="absolute -right-2 top-2 size-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                )}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-foreground" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <ul className="divide-y divide-border">
        {mixed.map((entry) =>
          entry.type === "post" ? (
            <FeedCard
              key={entry.item.id}
              item={entry.item}
              hydrated={hydrated}
              onDismiss={() => setDismissed((ids) => [...ids, entry.item.id])}
            />
          ) : (
            <li key={entry.item.id}>
              <ArticleCard
                article={entry.item}
                onEnter={(id) => void navigate({ to: "/answer/$id", params: { id } })}
              />
            </li>
          ),
        )}
      </ul>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[68px] max-w-[768px] items-stretch border-t border-border bg-background shadow-[0_-6px_18px_var(--footer-shadow)]"
        aria-label="底部导航"
      >
        <TabItem label="首页" active>
          <House className="size-7 fill-foreground" strokeWidth={1.6} />
        </TabItem>
        <TabItem
          label="看山画境"
          onClick={() => {
            // 硬门禁：看山画境需要先登录知乎账号
            void zhihuAuthState()
              .then((s) => (s.authorized ? setHubOpen(true) : setHubGateOpen(true)))
              .catch(() => setHubGateOpen(true));
          }}
        >
          <span className="grid size-7 place-items-center rounded-full bg-kanshan-sky">
            <img
              src={MASCOT_STILL.idle}
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              className="size-5 object-contain"
            />
          </span>
        </TabItem>
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            aria-label="发布"
            className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          >
            <Plus className="size-8" strokeWidth={2.4} />
          </button>
        </div>
        <TabItem label="消息" badge="99+">
          <MessageCircle className="size-7" strokeWidth={1.8} />
        </TabItem>
        <TabItem label="我的" onClick={() => navigate({ to: "/me" })}>
          <span className="relative">
            <ZhihuAvatar
              /* 已登录就只认知乎头像：拿不到时用图标占位，绝不回退成"默认头像照片"
                 （回退成默认头像 = 用户看到的"闪回未认证头像"） */
              src={zhihu.state?.profile?.avatar ?? (zhihu.authorized ? undefined : authorAvatar)}
              alt="我的头像"
              className="size-7 rounded-full object-cover"
              fallbackClassName="grid size-7 place-items-center rounded-full bg-kanshan-sky text-kanshan-blue"
              iconClassName="size-4"
            />
            {/* 已登录时给一个小蓝点，和未登录区分开 */}
            {zhihu.authorized && (
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-[#0084ff]" />
            )}
          </span>
        </TabItem>
      </nav>

      {hubGateOpen && (
        <LoginGateOverlay feature="看山画境" onClose={() => setHubGateOpen(false)} />
      )}

      {hubOpen && (
        <WorldHub
          currentWorldId=""
          onEnterWorld={(id) => {
            setHubOpen(false);
            void navigate({ to: "/world/$storyId", params: { storyId: id } });
          }}
          onClose={() => setHubOpen(false)}
        />
      )}
    </main>
  );
}

function FeedCard({ item, hydrated, onDismiss }: { item: FeedPost; hydrated: boolean; onDismiss: () => void }) {
  return (
    <li className="relative px-5 py-5">
      <Link
        to="/answer/$id"
        params={{ id: item.id }}
        className="block"
        aria-label={`阅读回答：${item.title}`}
        onClick={() => recordClick(item.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[21px] font-bold leading-snug">{item.title}</h2>
          <span
            className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[12px] font-semibold text-rose-500"
            title="世界线热度：由回答数、收藏数和点击量共同决定"
          >
            <Flame className="size-3.5" />
            {heatLabel(heatScore(item, hydrated ? getClicks(item.id) : 0))}
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          {item.avatar ? (
            <img src={item.avatar} alt={`${item.author}头像`} className="size-7 rounded-full object-cover" />
          ) : (
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[13px] font-bold text-white ${item.accent}`}
              aria-hidden="true"
            >
              {item.author.slice(0, 1)}
            </span>
          )}
          <span className="text-[15px] font-medium">{item.author}</span>
          {item.verified && <BadgeCheck className="size-4.5 fill-primary text-background" aria-label="已认证" />}
        </div>
        <p className="mt-2 line-clamp-2 text-[17px] leading-relaxed text-foreground/85">{item.excerpt}</p>
        <p className="mt-2 text-[14px] text-muted-foreground">
          还有 {item.otherAnswers.length} 个回答：
          {item.otherAnswers.map((answer) => answer.author).join("、")}
        </p>
        {item.storyId && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary-soft/50 px-3 py-1 text-[12px] font-semibold text-primary">
            <Sparkles className="size-3.5" />
            检测到可穿越的世界
          </p>
        )}
      </Link>
      <div className="mt-3 flex items-center gap-7 text-muted-foreground">
        <span className="flex items-center gap-1.5 text-[14px]">
          <ArrowBigUp className="size-6" strokeWidth={1.6} />
          {formatCount(item.upvotes)}
        </span>
        <span className="flex items-center gap-1.5 text-[14px]">
          <Star className="size-6" strokeWidth={1.6} />
          {formatCount(item.stars)}
        </span>
        <span className="flex items-center gap-1.5 text-[14px]">
          <MessageCircle className="size-6" strokeWidth={1.6} />
          {formatCount(item.comments)}
        </span>
        <button
          type="button"
          aria-label="不感兴趣"
          onClick={onDismiss}
          className="ml-auto grid size-8 place-items-center rounded-full hover:bg-muted"
        >
          <X className="size-5" />
        </button>
      </div>
    </li>
  );
}


function TabItem({
  label,
  active = false,
  badge,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <span className="relative">
        {children}
        {badge && (
          <span className="absolute -right-4 -top-1.5 rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      <span className={`text-[12px] ${active ? "font-bold" : ""}`}>{label}</span>
    </button>
  );
}

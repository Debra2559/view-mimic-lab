import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  ExternalLink,
  Loader2,
  LogOut,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  zhihuAuthState,
  zhihuContents,
  zhihuFollowees,
  zhihuLogout,
  zhihuLoginUrl,
  type ZhihuUserSummary,
} from "@/lib/zhihu/zhihu.functions";

/**
 * 个人页：上面是用户信息，下面分「创作 / 关注的人」两个页签，
 * 都支持「加载更多」（按接口的 Paging.IsEnd + NextOffset 翻页）。
 */
export const Route = createFileRoute("/me")({
  validateSearch: (search: Record<string, unknown>) => ({
    zhihu: typeof search["zhihu"] === "string" ? (search["zhihu"] as string) : undefined,
  }),
  component: MePage,
});

interface ContentRow {
  ContentType: string;
  Url: string;
  CreatedAt: number;
  LikeCount: number;
  CommentCount: number;
  FavoriteCount: number;
  Title: string;
  Summary: string;
}

interface FolloweeRow {
  Fullname: string;
  Url: string;
  AvatarUrl: string;
  Headline: string;
  FollowerCount: number;
}

interface PagingState {
  isEnd: boolean;
  nextOffset: string | number;
  totals: number;
}

const TYPE_LABEL: Record<string, string> = {
  answer: "回答",
  article: "文章",
  zvideo: "视频",
  pin: "想法",
  question: "问题",
};

function formatDate(seconds: number): string {
  if (!seconds) return "";
  const d = new Date(seconds * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function MePage() {
  const [state, setState] = useState<ZhihuUserSummary | null>(null);
  const [tab, setTab] = useState<"contents" | "followees">("contents");

  const [contents, setContents] = useState<ContentRow[]>([]);
  const [followees, setFollowees] = useState<FolloweeRow[]>([]);
  const [contentsPaging, setContentsPaging] = useState<PagingState | null>(null);
  const [followeesPaging, setFolloweesPaging] = useState<PagingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginHint, setLoginHint] = useState("");

  // 登录态
  useEffect(() => {
    void zhihuAuthState()
      .then((s) => setState(s))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "读取登录态失败"));
  }, []);

  const loadContents = useCallback(async (offset: number) => {
    setLoading(true);
    setError("");
    try {
      const page = await zhihuContents({ data: { offset, limit: 20 } });
      setContents((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
      setContentsPaging({
        isEnd: page.paging.IsEnd,
        nextOffset: page.paging.NextOffset ?? 0,
        totals: page.paging.Totals,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "读取创作失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFollowees = useCallback(async (offset: number) => {
    setLoading(true);
    setError("");
    try {
      const page = await zhihuFollowees({ data: { offset, limit: 20 } });
      setFollowees((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
      setFolloweesPaging({
        isEnd: page.paging.IsEnd,
        nextOffset: page.paging.NextOffset ?? 0,
        totals: page.paging.Totals,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "读取关注失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 有凭证才读数据：未登录时的演示模式，或已登录
  const canRead = Boolean(state && (state.authorized || state.demoMode));

  // 首次进入 / 切换页签时按需加载（凭证没配好就不发请求，避免无意义的报错）
  useEffect(() => {
    if (!canRead) return;
    if (tab === "contents" && contents.length === 0) void loadContents(0);
    if (tab === "followees" && followees.length === 0) void loadFollowees(0);
  }, [canRead, tab, contents.length, followees.length, loadContents, loadFollowees]);

  const startLogin = async () => {
    setLoginHint("");
    try {
      const res = await zhihuLoginUrl();
      if (!res.ok || !res.url) {
        setLoginHint(res.reason || "无法发起登录");
        return;
      }
      window.location.href = res.url;
    } catch (e: unknown) {
      setLoginHint(e instanceof Error ? e.message : "无法发起登录");
    }
  };

  const doLogout = async () => {
    await zhihuLogout();
    setContents([]);
    setFollowees([]);
    setContentsPaging(null);
    setFolloweesPaging(null);
    setState(await zhihuAuthState());
  };

  if (!state) {
    return (
      <main className="mx-auto grid min-h-screen max-w-[768px] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const { credentials, profile } = state;

  return (
    <main className="mx-auto min-h-screen max-w-[768px] bg-background pb-28 text-foreground md:border-x md:border-border">
      <div className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
        <Link to="/" className="grid size-8 place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-[13px] font-medium">我的知乎</span>
        {state.authorized && (
          <button
            type="button"
            onClick={() => void doLogout()}
            className="ml-auto inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            退出登录
          </button>
        )}
      </div>

      {/* 用户信息 */}
      <header className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          {profile?.avatar ? (
            <img src={profile.avatar} alt="" className="size-14 rounded-full object-cover" />
          ) : (
            <span className="grid size-14 place-items-center rounded-full bg-kanshan-sky text-kanshan-blue">
              <UserRound className="size-7" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-bold">
              {profile?.name ?? (state.authorized ? "已授权的知乎用户" : "未登录")}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
              {profile?.headline ??
                (state.authorized
                  ? "知乎接口未返回昵称/头像，所以这里只显示授权状态"
                  : "用知乎账号登录后，可读取你的创作与关注（公开范围）")}
            </p>
          </div>
        </div>

        {/* 状态与说明：如实标注，不假装 */}
        <div className="mt-4 space-y-2 text-[12px]">
          {state.authorized && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-kanshan-sky/50 px-3 py-1 text-kanshan-blue">
              ✅ 已用知乎账号登录
              {state.expiresAt ? ` · 令牌有效至 ${new Date(state.expiresAt).toLocaleString("zh-CN")}` : ""}
            </p>
          )}
          {state.demoMode && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-amber-700">
              <AlertTriangle className="size-3.5" />
              未登录：当前展示的是本应用凭据所属账号的公开数据（演示模式）
            </p>
          )}
          {!credentials.configured && (
            <p className="inline-flex items-start gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                凭证未配置完整，缺少：{credentials.missing.join(" / ")}。
                <br />
                在项目根目录建一个 <code className="rounded bg-muted px-1">zhihu.credentials.local.json</code>
                （不入 git），或设置同名环境变量；OAuth 的 appId / appKey 需要在黑客松活动页登记项目后获取。
              </span>
            </p>
          )}
          {!state.authorized && credentials.configured && (
            <button
              type="button"
              onClick={() => void startLogin()}
              className="inline-flex items-center gap-1.5 rounded-full bg-kanshan-blue px-4 py-1.5 text-[13px] font-semibold text-white"
            >
              用知乎账号登录
            </button>
          )}
          {loginHint && <p className="text-amber-700">{loginHint}</p>}
        </div>
      </header>

      {/* 页签 */}
      <div className="sticky top-12 z-10 flex border-b border-border bg-background/95 backdrop-blur-sm">
        {(
          [
            ["contents", "创作", Bookmark],
            ["followees", "关注的人", Users],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-[14px] font-medium transition-colors ${
              tab === key ? "border-b-2 border-kanshan-blue text-kanshan-blue" : "text-muted-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
            {key === "contents" && contentsPaging ? (
              <span className="text-[11.5px] text-muted-foreground">{contentsPaging.totals}</span>
            ) : null}
            {key === "followees" && followeesPaging ? (
              <span className="text-[11.5px] text-muted-foreground">{followeesPaging.totals}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error && (
        <p className="mx-5 mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-700">
          {error}
        </p>
      )}

      {/* 列表 */}
      <ul className="divide-y divide-border">
        {tab === "contents" &&
          contents.map((item, index) => (
            <li key={`${item.Url}-${index}`} className="px-5 py-4">
              <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">{TYPE_LABEL[item.ContentType] ?? item.ContentType}</span>
                <span>{formatDate(item.CreatedAt)}</span>
              </div>
              <a
                href={item.Url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-[15.5px] font-semibold leading-snug hover:text-kanshan-blue"
              >
                {item.Title}
              </a>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-foreground/70">{item.Summary}</p>
              <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="size-3" />
                  {item.LikeCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="size-3" />
                  {item.CommentCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bookmark className="size-3" />
                  {item.FavoriteCount}
                </span>
                <a
                  href={item.Url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-kanshan-blue"
                >
                  知乎原文
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </li>
          ))}

        {tab === "followees" &&
          followees.map((item, index) => (
            <li key={`${item.UrlToken ?? item.Url}-${index}`} className="flex items-start gap-3 px-5 py-4">
              {item.AvatarUrl ? (
                <img src={item.AvatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <UserRound className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={item.Url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-[15px] font-semibold hover:text-kanshan-blue"
                >
                  {item.Fullname}
                </a>
                <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">{item.Headline}</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">粉丝 {item.FollowerCount}</p>
              </div>
            </li>
          ))}
      </ul>

      {canRead && (
        <div className="px-5 py-6">
          {(() => {
            const paging = tab === "contents" ? contentsPaging : followeesPaging;
            const count = tab === "contents" ? contents.length : followees.length;
            if (!paging) return null;
            if (paging.isEnd) {
              return (
                <p className="text-center text-[12.5px] text-muted-foreground">
                  已经到底了 · 共 {paging.totals} 条
                </p>
              );
            }
            return (
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void (tab === "contents"
                    ? loadContents(Number(paging.nextOffset) || count)
                    : loadFollowees(Number(paging.nextOffset) || count))
                }
                className="mx-auto flex items-center gap-2 rounded-full border border-border px-5 py-2 text-[13.5px] font-medium disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {loading ? "加载中…" : "加载更多"}
              </button>
            );
          })()}
        </div>
      )}

      {!canRead && (
        <p className="px-6 py-10 text-center text-[13px] text-muted-foreground">
          配置好凭证（或在活动页登记 OAuth 应用）后，这里会显示你的创作与关注列表。
        </p>
      )}
    </main>
  );
}

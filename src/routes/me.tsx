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

import { ZhihuAvatar } from "@/components/story/ZhihuAvatar";
import { clearZhihuProfileCache } from "@/components/story/LoginGate";
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
  /** 服务端数据通道还没就绪（属运维配置问题，不给用户看技术细节） */
  const [dataUnavailable, setDataUnavailable] = useState(false);
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
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("ZHIHU_SERVER_NOT_READY") || msg.includes("Access Secret")) {
        setDataUnavailable(true);
      } else {
        setError(msg || "读取创作失败");
      }
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
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("ZHIHU_SERVER_NOT_READY") || msg.includes("Access Secret")) {
        setDataUnavailable(true);
      } else {
        setError(msg || "读取关注失败");
      }
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
    clearZhihuProfileCache();
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
          <ZhihuAvatar
            src={profile?.avatar}
            className="size-14 rounded-full object-cover"
            fallbackClassName="grid size-14 place-items-center rounded-full bg-kanshan-sky text-kanshan-blue"
            iconClassName="size-7"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-bold">
              {profile?.name ?? (state.authorized ? "你的知乎账号" : "未登录")}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
              {profile?.headline ??
                (state.authorized ? "授权成功" : "用知乎账号登录后，可读取你的创作与关注（公开范围）")}
            </p>
          </div>
        </div>

        {/* 资料接口诊断：把"卡在哪一步"如实摊开，便于修，而不是静默失败 */}
        {state.authorized && !profile && (state.profileAttempts?.length ?? 0) > 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-[11.5px] leading-relaxed text-muted-foreground">
            <p className="mb-1 font-medium text-foreground/75">昵称 / 头像没取到，每次尝试的结果：</p>
            {state.profileAttempts?.map((attempt, index) => (
              <div key={index} className="mb-1.5 last:mb-0">
                <p className="break-words">
                  · {attempt.variant} → HTTP {attempt.status}
                  {attempt.code ? ` · code ${attempt.code}` : ""}
                  {attempt.message ? ` · ${attempt.message}` : ""}
                </p>
                {attempt.rawKeys?.length ? (
                  <p className="break-words opacity-90">· 字段: {attempt.rawKeys.join(", ")}</p>
                ) : null}
                {attempt.samples?.length ? (
                  <p className="break-words opacity-90">· 取值: {attempt.samples.join("；")}</p>
                ) : null}
              </div>
            ))}
            <p className="mt-1 opacity-70">（这段是排查信息，接通后会隐藏）</p>
          </div>
        )}

        {/* 数据即身份：拿不到昵称头像，就用真实数量说明"你是谁" */}
        {state.authorized && (contentsPaging || followeesPaging) && (
          <div className="mt-4 flex items-center gap-4 text-[12.5px] text-muted-foreground">
            {contentsPaging && (
              <span>
                创作 <strong className="text-foreground">{contentsPaging.totals}</strong> 篇
              </span>
            )}
            {followeesPaging && (
              <span>
                关注 <strong className="text-foreground">{followeesPaging.totals}</strong> 人
              </span>
            )}
          </div>
        )}

        {/* 状态与说明：如实标注，不假装 */}
        <div className="mt-4 space-y-2 text-[12px]">
          {state.authorized && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-kanshan-sky/50 px-3 py-1 text-kanshan-blue">
              ✅ 已用知乎账号登录（会话已建立）
              {state.expiresAt ? ` · 令牌有效至 ${new Date(state.expiresAt).toLocaleString("zh-CN")}` : ""}
            </p>
          )}
          {state.demoMode && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-amber-700">
              <AlertTriangle className="size-3.5" />
              未登录：当前展示的是本应用凭据所属账号的公开数据（演示模式）
            </p>
          )}
          {!credentials.loginReady && (
            <p className="inline-flex items-start gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                登录还差：{credentials.missing.filter((m) => m !== "accessSecret").join(" / ") || "appId / appKey / redirectUri"}。
                <br />
                配置写在项目根目录的 <code className="rounded bg-muted px-1">zhihu.credentials.local.json</code>
                （不入 git）或同名环境变量；OAuth 的 appId / appKey 来自黑客松活动页。
              </span>
            </p>
          )}
          {!state.authorized && credentials.loginReady && (
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

      {dataUnavailable && (
        <p className="px-8 py-10 text-center text-[13px] leading-relaxed text-muted-foreground">
          已登录成功 ✓
          <br />
          你的创作与关注列表还在接入中，稍后再回来看看。
        </p>
      )}

      {!canRead && !dataUnavailable && (
        <p className="px-8 py-10 text-center text-[13px] leading-relaxed text-muted-foreground">
          登录后这里会显示你的创作与关注。
        </p>
      )}
    </main>
  );
}

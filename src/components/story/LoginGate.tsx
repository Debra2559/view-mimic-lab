import { Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { zhihuAuthState, zhihuLoginUrl, type ZhihuUserSummary } from "@/lib/zhihu/zhihu.functions";

/**
 * 知乎登录门禁。
 *
 * 产品约定：**剧场 / 看山画境 / 金句卡**这些"要动脑子参与"的功能，需要先用知乎账号登录才能体验。
 * 未登录时给一个明确的解锁面板（而不是静默失败或假装能用）。
 *
 * 凭证没配好（本地开发常见）时，面板会如实说明缺什么、去哪里配，而不是弹一个点了没反应的按钮。
 */
/** 登录态本地缓存：让"已登录用户"首帧就渲染自己的头像，不再先闪一下默认头像 */
const PROFILE_CACHE_KEY = "zhihu_profile_cache_v1";

function readProfileCache(): ZhihuUserSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ZhihuUserSummary;
    return parsed?.authorized ? parsed : null;
  } catch {
    return null;
  }
}

function writeProfileCache(state: ZhihuUserSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(state));
  } catch {
    /* 隐私模式等场景写不进去，忽略 */
  }
}

/** 退出登录时清掉缓存（me 页面调用） */
export function clearZhihuProfileCache() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* 忽略 */
  }
}

/**
 * @param initial 服务端（路由 loader）已知的登录态。
 *   传进来后，**连 SSR 首屏 HTML 里都是你的真头像**，不存在"先默认后真头像"的闪烁；
 *   没有它时退回 localStorage 缓存（至少不会等网络请求）。
 */
export function useZhihuAuth(initial?: ZhihuUserSummary | null) {
  const [state, setState] = useState<ZhihuUserSummary | null>(() => initial ?? readProfileCache());
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    let alive = true;
    void zhihuAuthState()
      .then((s) => {
        if (!alive) return;
        setState(s);
        if (s.authorized) writeProfileCache(s);
      })
      .catch(() => {
        if (alive) setHint("读取登录态失败，请刷新页面重试");
      });
    return () => {
      alive = false;
    };
  }, []);

  const startLogin = useCallback(async () => {
    setHint("");
    setBusy(true);
    try {
      const res = await zhihuLoginUrl();
      if (!res.ok || !res.url) {
        setHint(res.reason || "无法发起登录");
        setBusy(false);
        return;
      }
      window.location.href = res.url;
    } catch (e: unknown) {
      setHint(e instanceof Error ? e.message : "无法发起登录");
      setBusy(false);
    }
  }, []);

  return {
    state,
    loading: state === null,
    authorized: state?.authorized ?? false,
    /** 登录流程所需的三项是否齐了（不需要 Access Secret） */
    loginReady: state?.credentials.loginReady ?? false,
    missing: state?.credentials.missing ?? [],
    busy,
    hint,
    startLogin,
  };
}

function GateBody({
  feature,
  loginReady,
  missing,
  busy,
  hint,
  startLogin,
  compact,
}: {
  feature: string;
  loginReady: boolean;
  /** 缺失的凭证字段名（不含值） */
  missing: string[];
  busy: boolean;
  hint: string;
  startLogin: () => void;
  compact?: boolean;
}) {
  // Access Secret 是读数据用的，不影响登录本身
  const loginMissing = missing.filter((m) => m !== "accessSecret");
  return (
    <div className={compact ? "px-2 py-1 text-center" : "px-7 text-center"}>
      <span
        className={`mx-auto grid place-items-center rounded-2xl border border-story-ink/15 bg-story-ink/5 ${
          compact ? "size-10" : "size-14"
        }`}
      >
        <LockKeyhole className={compact ? "size-5 text-story-glow" : "size-7 text-story-glow"} />
      </span>
      <p className={`mt-3 font-semibold text-story-ink ${compact ? "text-[15px]" : "text-[19px]"}`}>
        {feature}需要知乎账号登录
      </p>
      <p className={`mx-auto mt-2 max-w-xs leading-relaxed text-story-ink/60 ${compact ? "text-[12.5px]" : "text-[13.5px]"}`}>
        用知乎账号登录后即可进入——我们会读取你的公开创作与关注，让内容和你有关。
      </p>

      {loginReady ? (
        <button
          type="button"
          onClick={startLogin}
          disabled={busy}
          className={`mt-5 inline-flex items-center gap-2 rounded-full bg-[#0084ff] font-semibold text-white shadow-sm transition-transform hover:scale-[1.03] disabled:opacity-70 ${
            compact ? "px-5 py-2 text-[13.5px]" : "px-7 py-2.5 text-[15px]"
          }`}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {busy ? "正在跳转知乎…" : "用知乎账号登录"}
        </button>
      ) : (
        <p className="mx-auto mt-5 max-w-xs rounded-xl border border-dashed border-story-ink/20 px-3 py-2 text-[12px] leading-relaxed text-story-ink/55">
          这台服务器还没配好知乎 OAuth：缺少{" "}
          <code className="font-mono">{loginMissing.join(" / ") || "appId / appKey / redirectUri"}</code>
          。请把 appId / appKey / 回调地址写进
          <code className="mx-1 font-mono">zhihu.credentials.local.json</code>
          或环境变量后重试。
        </p>
      )}
      {hint && loginReady && <p className="mt-3 text-[12.5px] text-amber-300">{hint}</p>}
    </div>
  );
}

/** 全屏门禁（用于「看山画境」大厅这类整屏功能） */
export function LoginGateOverlay({ feature, onClose }: { feature: string; onClose: () => void }) {
  const auth = useZhihuAuth();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-story-night px-6 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭"
        className="absolute right-4 top-4 rounded-full border border-story-ink/20 px-3 py-1 text-[12.5px] text-story-ink/70"
      >
        返回
      </button>
      {auth.loading ? (
        <Loader2 className="size-6 animate-spin text-story-ink/60" />
      ) : (
        <GateBody
          feature={feature}
          loginReady={auth.loginReady}
          missing={auth.missing}
          busy={auth.busy}
          hint={auth.hint}
          startLogin={() => void auth.startLogin()}
        />
      )}
    </div>
  );
}

/** 内联门禁（包裹式）：已登录渲染 children，未登录渲染整页解锁面板 */
export function LoginGateInline({ feature, children }: { feature: string; children: ReactNode }) {
  const auth = useZhihuAuth();

  if (auth.loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-story-night">
        <Loader2 className="size-6 animate-spin text-story-ink/60" />
      </main>
    );
  }
  if (auth.authorized) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-story-night px-7 py-10">
      <GateBody
        feature={feature}
        loginReady={auth.loginReady}
        missing={auth.missing}
        busy={auth.busy}
        hint={auth.hint}
        startLogin={() => void auth.startLogin()}
      />
    </main>
  );
}

/** 轻量弹层（用于金句卡这类卡片级功能） */
export function LoginPromptSheet({
  feature,
  open,
  onClose,
}: {
  feature: string;
  open: boolean;
  onClose: () => void;
}) {
  const auth = useZhihuAuth();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-story-night p-5 pb-7 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {auth.loading ? (
          <div className="grid h-28 place-items-center">
            <Loader2 className="size-6 animate-spin text-story-ink/60" />
          </div>
        ) : (
          <GateBody
            feature={feature}
            loginReady={auth.loginReady}
            missing={auth.missing}
            busy={auth.busy}
            hint={auth.hint}
            startLogin={() => void auth.startLogin()}
            compact
          />
        )}
        <button
          type="button"
          onClick={onClose}
          className="mx-auto mt-4 block text-[13px] text-story-ink/50 underline-offset-2 hover:underline"
        >
          先不用了
        </button>
      </div>
    </div>
  );
}

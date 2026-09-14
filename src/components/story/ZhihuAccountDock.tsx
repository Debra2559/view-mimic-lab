import { Link, useRouterState } from "@tanstack/react-router";
import { Loader2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { zhihuAuthState, type ZhihuUserSummary } from "@/lib/zhihu/zhihu.functions";

/**
 * 右下角的知乎账号入口。
 *
 * - 未登录：显示一个「用知乎登录」的小胶囊，点击进个人页（那里有登录按钮与凭证状态）
 * - 已登录：显示头像 + 昵称，点击进个人页看创作与关注
 * 个人页自身不显示（避免重复入口）。
 */
export function ZhihuAccountDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [state, setState] = useState<ZhihuUserSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void zhihuAuthState()
      .then((s) => {
        if (alive) setState(s);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (pathname.startsWith("/me") || pathname.startsWith("/api/")) return null;
  if (failed) return null;

  const authorized = state?.authorized ?? false;
  const profile = state?.profile ?? null;
  const label = profile?.name ?? (authorized ? "我的知乎" : "用知乎登录");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-40 mx-auto flex max-w-[768px] justify-end px-4">
      <Link
        to="/me"
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-kanshan-line bg-white/95 py-1 pl-1 pr-3 text-[13px] font-medium text-foreground shadow-[0_4px_16px_rgba(15,23,42,0.12)] backdrop-blur transition-transform duration-200 hover:scale-[1.03]"
        aria-label={authorized ? "打开我的知乎主页" : "用知乎账号登录"}
      >
        {!state ? (
          <span className="grid size-8 place-items-center rounded-full bg-muted">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </span>
        ) : profile?.avatar ? (
          <img src={profile.avatar} alt="" className="size-8 rounded-full object-cover" />
        ) : authorized ? (
          <span className="grid size-8 place-items-center rounded-full bg-kanshan-sky text-kanshan-blue">
            <UserRound className="size-4" />
          </span>
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-[#0084ff] text-[11px] font-bold text-white">
            知
          </span>
        )}
        <span className="max-w-[7.5rem] truncate">{label}</span>
      </Link>
    </div>
  );
}

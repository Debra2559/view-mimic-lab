import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";

import { zhihuCompleteLogin } from "@/lib/zhihu/zhihu.functions";

/**
 * 知乎 OAuth 回调地址。
 *
 * 必须在黑客松活动页把同一个地址登记为回调地址（`redirect_uri` 必须与登记值完全一致）。
 * 官方实测回调参数是 `authorization_code`（这里同时兼容 `code`），且不保证带 `state`。
 *
 * 注意：本文件会进入客户端图，所以**不能**引用任何服务端模块——连 `await import()` 也不行，
 * 生产构建会被 import-protection 判定为"客户端导入了服务端模块"而直接失败。
 * 换 token、写 cookie 都放在服务端函数 `zhihuCompleteLogin` 里（客户端拿到的只是 RPC 桩）。
 */
export const Route = createFileRoute("/api/zhihu/callback")({
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.searchStr ? String(location.searchStr) : "");
    const code = params.get("authorization_code") ?? params.get("code") ?? "";
    const error = params.get("error") ?? "";

    const result = await zhihuCompleteLogin({ data: { code, error } });
    if (!result.ok) return { ok: false as const, message: result.message };

    throw redirect({ to: "/me", search: { zhihu: "ok" } });
  },
  component: ZhihuCallbackPage,
});

function ZhihuCallbackPage() {
  const result = Route.useLoaderData();

  if (result.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
        <CheckCircle2 className="size-10 text-kanshan-blue" />
        <h1 className="text-[20px] font-bold">授权成功</h1>
        <p className="text-[14px] text-muted-foreground">正在进入你的个人页…</p>
        <Link to="/me" className="text-[14px] text-kanshan-blue underline-offset-2 hover:underline">
          没跳转？点这里
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="size-10 text-amber-500" />
      <h1 className="text-[20px] font-bold">授权没有完成</h1>
      <p className="text-[14px] leading-relaxed text-muted-foreground">{result.message}</p>
      <div className="mt-2 flex items-center gap-3 text-[14px]">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          回首页
        </Link>
        <Link to="/me" className="text-kanshan-blue underline-offset-2 hover:underline">
          去个人页
        </Link>
      </div>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { zhihuProfileDebug } from "@/lib/zhihu/zhihu.functions";

/**
 * 排查页：`/api/zhihu/debug`
 *
 * 把知乎 `/user` 接口的返回**脱敏后**打出来，用来判断"昵称/头像为什么没显示"。
 * 隐私字段（phone / phone_no / email / uid / hash_id）在服务端就被剔除，不会出现在这里。
 * 排查完可以删掉这个路由。
 */
export const Route = createFileRoute("/api/zhihu/debug")({
  loader: async () => await zhihuProfileDebug(),
  component: ZhihuDebugPage,
});

function ZhihuDebugPage() {
  const data = Route.useLoaderData();

  return (
    <main className="mx-auto min-h-screen max-w-[760px] bg-background px-4 py-6 text-foreground">
      <h1 className="text-[17px] font-bold">知乎资料接口排查</h1>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        下面是把知乎 <code className="font-mono">/user</code> 接口返回脱敏后的结果（已剔除 phone / email / uid 等隐私字段）。
        把这段 JSON 发给我，就能定位问题。排查完这个页面可以删掉。
      </p>
      <pre className="mt-4 overflow-auto rounded-xl border border-border bg-muted p-3 text-[11.5px] leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}

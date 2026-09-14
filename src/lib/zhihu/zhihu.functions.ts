/**
 * 知乎登录与用户数据的前端可调用入口（服务端函数）。
 *
 * 重要：这里**不在顶层导入服务端模块**（`*.server.ts` 会 import
 * `@tanstack/react-start/server`，被框架的 import-protection 拒绝进入客户端图）。
 * 服务端模块一律在 handler 内部用 `await import(...)` 动态引入——
 * 客户端只会拿到 RPC 桩，不会执行 handler 体。
 *
 * 约定：
 * - 密钥只在服务端使用，前端拿不到 appKey / accessSecret；
 * - `appId` 与 `redirectUri` 是公开信息，可以下发用于拼授权地址；
 * - 未登录时，若配置了 Access Secret，可读「凭据所属账号」自己的公开数据（演示模式，页面会明确标注）。
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ZhihuUserSummary {
  /** 是否已用知乎账号登录（有 OAuth token） */
  authorized: boolean;
  /** 未登录但在演示模式下读取凭据所属账号的数据 */
  demoMode: boolean;
  profile: { name?: string; avatar?: string; headline?: string; urlToken?: string } | null;
  expiresAt: number | null;
  /** 凭证配置状况（只含布尔与字段名，绝不含值） */
  credentials: { configured: boolean; source: string; missing: string[] };
}

/** 登录态 + 凭证配置状况（不含任何密钥） */
export const zhihuAuthState = createServerFn({ method: "GET" }).handler(async (): Promise<ZhihuUserSummary> => {
  const { zhihuCredentialStatus } = await import("@/lib/zhihu/credentials.server");
  const { readSession } = await import("@/lib/zhihu/oauth.server");

  const credentials = zhihuCredentialStatus();
  const session = readSession();
  return {
    authorized: Boolean(session),
    demoMode: !session && credentials.configured,
    profile: session?.profile ?? null,
    expiresAt: session?.expiresAt ?? null,
    credentials: {
      configured: credentials.configured,
      source: credentials.source,
      missing: credentials.missing,
    },
  };
});

/** 生成授权地址；前端拿到后直接跳转 */
export const zhihuLoginUrl = createServerFn({ method: "GET" }).handler(async () => {
  const { zhihuCredentialStatus } = await import("@/lib/zhihu/credentials.server");
  const { buildAuthorizeUrl, resolveRedirectUri } = await import("@/lib/zhihu/oauth.server");

  const credentials = zhihuCredentialStatus();
  if (!credentials.appId) {
    return { ok: false as const, reason: "缺少 OAuth appId（需在黑客松活动页登记项目后获取）", url: "" };
  }
  const redirectUri = resolveRedirectUri();
  if (!redirectUri) {
    return { ok: false as const, reason: "缺少回调地址 redirectUri（需与活动页登记值完全一致）", url: "" };
  }
  const state = Math.random().toString(36).slice(2);
  return { ok: true as const, reason: "", url: buildAuthorizeUrl(redirectUri, state) };
});

/** 退出登录：清掉会话 cookie */
export const zhihuLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSession } = await import("@/lib/zhihu/oauth.server");
  clearSession();
  return { ok: true as const };
});

const CallbackInput = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
});

/**
 * 处理 OAuth 回调：换 token + 写 httpOnly 会话 cookie。
 *
 * 必须放在服务端函数里（而不是路由 loader 里直接引用服务端模块）：
 * 路由模块会进入客户端图，即使 `await import()` 也会被 import-protection 判定为
 * 客户端导入边，生产构建直接失败；服务端函数则会生成 RPC 桩，逻辑只在服务端跑。
 */
export const zhihuCompleteLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CallbackInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    if (data.error) return { ok: false, message: `知乎返回错误：${data.error}` };
    if (!data.code) {
      return {
        ok: false,
        message: "回调里没有授权码（authorization_code）。如果你是从知乎授权页跳回来的，请重试一次登录。",
      };
    }

    const { getZhihuCredentials } = await import("@/lib/zhihu/credentials.server");
    const { exchangeCode, resolveRedirectUri, writeSession } = await import("@/lib/zhihu/oauth.server");

    const credentials = getZhihuCredentials();
    if (!credentials.appId || !credentials.appKey) {
      return {
        ok: false,
        message: "服务器缺少 OAuth appId / appKey，无法换取用户 token。请在 zhihu.credentials.local.json 中补齐。",
      };
    }

    try {
      const session = await exchangeCode(data.code, resolveRedirectUri());
      writeSession(session);
      return { ok: true, message: "" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "换取 token 失败" };
    }
  });

const PageInput = z.object({
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(50).default(20),
});

/** 我的创作 */
export const zhihuContents = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PageInput.parse(data))
  .handler(async ({ data }) => {
    const { readSession } = await import("@/lib/zhihu/oauth.server");
    const { fetchContents } = await import("@/lib/zhihu/api.server");
    const session = readSession();
    const page = await fetchContents(session?.token, data.offset, data.limit);
    return { ...page, authorized: Boolean(session) };
  });

/** 我关注的人 */
export const zhihuFollowees = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PageInput.parse(data))
  .handler(async ({ data }) => {
    const { readSession } = await import("@/lib/zhihu/oauth.server");
    const { fetchFollowees } = await import("@/lib/zhihu/api.server");
    const session = readSession();
    const page = await fetchFollowees(session?.token, data.offset, data.limit);
    return { ...page, authorized: Boolean(session) };
  });

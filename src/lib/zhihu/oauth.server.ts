/**
 * 知乎 OAuth（仅服务端）。
 *
 * 官方流程（见知乎开放平台 OAuth 文档）：
 * ① 跳转授权  GET https://openapi.zhihu.com/authorize?redirect_uri=&app_id=&response_type=code
 * ② 回调      {redirect_uri}?authorization_code=…      （回调不保证带 state）
 * ③ 换 token  POST https://openapi.zhihu.com/access_token
 *             app_id + app_key + grant_type=authorization_code + redirect_uri + code
 * ④ 读数据    Authorization: Bearer <accessSecret> + X-OAuth-Token: <用户 token>
 */
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import { getZhihuCredentials } from "@/lib/zhihu/credentials.server";

export const AUTHORIZE_ENDPOINT = "https://openapi.zhihu.com/authorize";
export const TOKEN_ENDPOINT = "https://openapi.zhihu.com/access_token";

const COOKIE_NAME = "zhihu_oauth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface ZhihuProfile {
  name?: string | undefined;
  avatar?: string | undefined;
  headline?: string | undefined;
  urlToken?: string | undefined;
}

export interface ZhihuSession {
  /** 用户级 OAuth access token */
  token: string;
  /** 到期时间（毫秒时间戳） */
  expiresAt: number;
  /** 交换 token 时若响应里带了用户信息就一并存下（官方文档未定义该 endpoint，拿不到就是 undefined） */
  profile?: ZhihuProfile | undefined;
}

function encode(session: ZhihuSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decode(raw: string | undefined): ZhihuSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as ZhihuSession;
    if (!parsed?.token) return null;
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readSession(): ZhihuSession | null {
  return decode(getCookie(COOKIE_NAME));
}

export function writeSession(session: ZhihuSession): void {
  setCookie(COOKIE_NAME, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSession(): void {
  deleteCookie(COOKIE_NAME, { path: "/" });
}

/** 当前请求对应的回调地址：优先用配置里登记的，其次按请求推断 */
export function resolveRedirectUri(): string {
  const configured = getZhihuCredentials().redirectUri;
  if (configured) return configured;
  return "";
}

/** 拼授权地址（app_id 公开，可安全下发到前端） */
export function buildAuthorizeUrl(redirectUri: string, state?: string): string {
  const { appId } = getZhihuCredentials();
  if (!appId) throw new Error("缺少 OAuth appId：请在 zhihu.credentials.local.json 或环境变量中配置");
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    app_id: appId,
    response_type: "code",
  });
  if (state) params.set("state", state);
  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

/** 用 authorization_code 换 OAuth access token */
export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ token: string; expiresAt: number; profile?: ZhihuProfile }> {
  const { appId, appKey } = getZhihuCredentials();
  if (!appId || !appKey) {
    throw new Error("缺少 OAuth appId / appKey，无法换取用户 token");
  }

  const body = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`知乎 token 接口返回非 JSON（HTTP ${res.status}）`);
  }

  // 成功与否以是否存在 access_token 为准；业务码 20000 也可能表示成功
  const token = typeof payload["access_token"] === "string" ? (payload["access_token"] as string) : "";
  if (!token) {
    const message =
      typeof payload["error_description"] === "string"
        ? (payload["error_description"] as string)
        : typeof payload["Message"] === "string"
          ? (payload["Message"] as string)
          : text.slice(0, 200);
    throw new Error(`换取 token 失败：${message}`);
  }

  const expiresIn = Number(payload["expires_in"]);
  const ttl = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600;
  const profile = extractProfile(payload);
  return { token, expiresAt: Date.now() + ttl * 1000, ...(profile ? { profile } : {}) };
}

/**
 * OAuth 响应里可能附带用户信息（官方文档未给出该 endpoint 与 schema，
 * 因此这里做尽力而为的解析：有就展示，没有就保持 undefined，绝不编造）。
 */
export function extractProfile(payload: Record<string, unknown>) {
  const candidate =
    (payload["user"] as Record<string, unknown> | undefined) ??
    (payload["Data"] as Record<string, unknown> | undefined) ??
    payload;

  const name = ["name", "fullname", "Fullname", "nickname"].map((k) => candidate?.[k]).find((v) => typeof v === "string" && v) as string | undefined;
  const avatar = ["avatar_url", "avatarUrl", "AvatarUrl", "avatar"].map((k) => candidate?.[k]).find((v) => typeof v === "string" && v) as string | undefined;
  const headline = ["headline", "Headline", "description"].map((k) => candidate?.[k]).find((v) => typeof v === "string" && v) as string | undefined;
  const urlToken = ["url_token", "urlToken", "UrlToken"].map((k) => candidate?.[k]).find((v) => typeof v === "string" && v) as string | undefined;

  if (!name && !avatar && !headline && !urlToken) return null;
  return { name, avatar, headline, urlToken };
}

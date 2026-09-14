/**
 * 知乎用户数据接口（仅服务端）。
 *
 * 基础域名 `https://developer.zhihu.com`，全部是 GET：
 * - `/api/v1/user/contents`   创作（回答/文章/视频/想法/问题）
 * - `/api/v1/user/followees`  关注的用户
 *
 * 每个请求都要带：
 *   Authorization: Bearer <Access Secret>     鉴权调用方
 *   X-Request-Timestamp: <秒级时间戳>           防重放
 *   X-OAuth-Token: <用户 access token>          代表已授权用户时必带
 *   Content-Type: application/json             contents / followees 明确要求
 *
 * 分页：请求用 `Offset` / `Limit`（最大 50），响应 `Paging.IsEnd` +
 * `Paging.NextOffset`（**服务端给的是 String，要原样回传**）。
 */
import { getZhihuCredentials } from "@/lib/zhihu/credentials.server";

const API_BASE = "https://developer.zhihu.com";
/** 用户资料接口在 openapi 域名下（官方黑客松 OAuth 模板就是这么调的）；可用环境变量覆盖以便本地联调 */
const USER_ENDPOINT = process.env["ZHIHU_USER_ENDPOINT"] ?? "https://openapi.zhihu.com/user";

export interface ZhihuProfile {
  name?: string;
  avatar?: string;
  headline?: string;
  url?: string;
}

/**
 * 取当前授权用户的公开资料（昵称 / 头像 / 一句话介绍）。
 *
 * 接口：`GET https://openapi.zhihu.com/user`（官方 OAuth 模板的实现，文档未给 schema，故字段做多写法兼容）
 * 鉴权：官方模板是 `Authorization: Bearer <Access Secret>` + `X-OAuth-Token: <用户 token>`。
 * 实测该接口必须有 Authorization 头（缺了会返回 20004 Token type is error），
 * 所以没有 Access Secret 时退一步把用户 token 也放进 Bearer 再试一次。
 */
/**
 * 头像地址归一化。
 * 实测接口给的是 `avatar_path`（可能是 `/v2-xxx.jpg` 这种相对路径），
 * 相对路径统一补知乎图床域名；UI 侧还有 onError 兜底，路径猜错也不会出现裂图。
 */
function normalizeAvatar(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `https://picx.zhimg.com${value}`;
  return `https://picx.zhimg.com/${value}`;
}

export interface ProfileAttempt {
  /** 用了哪种鉴权组合 */
  variant: string;
  status: number;
  code?: number;
  message?: string;
  /** 返回体的字段名（判断"调用成功但字段没解析对"） */
  rawKeys?: string[];
  /** 白名单公开字段的取值摘要（判断"字段名对了但值是空的"；不含 phone/email/uid 等隐私字段） */
  samples?: string[];
}

export interface ProfileResult {
  profile: ZhihuProfile | null;
  attempts: ProfileAttempt[];
  /** 脱敏后的原始返回（只留公开字段；隐私字段永不落库、不下发） */
  rawSanitized?: Record<string, unknown> | null;
}

/** 隐私字段：一律剔除，绝不下发、不落库 */
const PRIVATE_FIELDS = new Set(["phone", "phone_no", "phoneNo", "email", "uid", "hash_id", "hashId", "id"]);

/**
 * 取当前授权用户的公开资料（昵称 / 头像 / 一句话介绍）。
 *
 * 接口：`GET https://openapi.zhihu.com/user`（官方黑客松 OAuth 模板的实现；官方文档未给 schema）
 * 实测两点与文档/模板不同：返回体**没有 `{code, data}` 外层**；头像字段叫 **`avatar_path`**、昵称叫 `fullname`。
 * 鉴权（官方模板）：`Authorization: Bearer <Access Secret>` + `X-OAuth-Token: <用户 token>`
 *
 * 实测该接口**必须有 Authorization 头**（缺了返回 20004 Token type is error），
 * 且 Bearer 必须是有效的 access token（用 app_key 试会返回 20005）。
 * 我们没有 Access Secret，所以这里按可能性依次尝试，并把每次的结果记下来，
 * 便于在页面上如实说明"卡在哪一步"，而不是静默失败。
 */
export async function fetchZhihuProfile(oauthToken: string): Promise<ProfileResult> {
  const { accessSecret } = getZhihuCredentials();
  const variants: Array<{ variant: string; bearer: string }> = [];
  if (accessSecret) variants.push({ variant: "Bearer=AccessSecret（官方模板用法）", bearer: accessSecret });
  variants.push({ variant: "Bearer=用户 OAuth token（无 Access Secret 时的尝试）", bearer: oauthToken });

  const attempts: ProfileAttempt[] = [];

  let sanitizedForDebug: Record<string, unknown> | null = null;

  for (const item of variants) {
    let status = 0;
    try {
      const res = await fetch(USER_ENDPOINT, {
        headers: {
          "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
          "Content-Type": "application/json",
          "X-OAuth-Token": oauthToken,
          Authorization: `Bearer ${item.bearer}`,
        },
      });
      status = res.status;
      const payload = (await res.json()) as Record<string, unknown>;
      const code = typeof payload["code"] === "number" ? (payload["code"] as number) : undefined;
      const message = typeof payload["data"] === "string" ? (payload["data"] as string) : undefined;
      attempts.push({ variant: item.variant, status, code, message });

      // 实测：这个接口的返回体是**平的**（就是用户对象本身，没有 {code, data} 外层包装），
      // 官方模板按有包装写的，所以这里必须兜底到 payload 本身。
      const source = (payload["data"] ?? payload["Data"] ?? payload["user"] ?? payload) as Record<string, unknown> | null;
      const rawKeys = Object.keys((source && typeof source === "object" ? source : payload) ?? {}).slice(0, 14);
      // 只采样公开字段，且只报"有没有值/长度"，避免把隐私信息带到页面上
      const PUBLIC_FIELDS = ["fullname", "Fullname", "name", "avatar_path", "avatar_url", "headline", "url"];
      const samples = source
        ? PUBLIC_FIELDS.map((key) => {
            const value = source[key];
            if (value === undefined) return `${key}=无此字段`;
            if (typeof value !== "string") return `${key}=非字符串(${typeof value})`;
            return `${key}=${value.trim() ? `有值(${value.trim().length}字符)` : "空字符串"}`;
          })
        : [];
      if (attempts.length) {
        const last = attempts[attempts.length - 1]!;
        last.rawKeys = rawKeys;
        last.samples = samples;
      }
      if (source && typeof source === "object") {
        const str = (...keys: string[]) => {
          for (const key of keys) {
            const value = source[key];
            if (typeof value === "string" && value.trim()) return value.trim();
          }
          return undefined;
        };
        // 字段名以**实测返回**为准：avatar_path / fullname / headline / url / description
        // （注意：响应里还有 phone、phone_no、email 等隐私字段，这里一律不取、不入库、不下发）
        const profile: ZhihuProfile = {
          name: str("fullname", "Fullname", "name", "nickname"),
          avatar: normalizeAvatar(str("avatar_path", "avatar_url", "AvatarUrl", "avatarUrl", "avatar")),
          headline: str("headline", "Headline", "description"),
          url: str("url", "Url"),
        };
        const rawSanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(source)) {
          if (PRIVATE_FIELDS.has(key)) continue;
          rawSanitized[key] = typeof value === "string" ? value : typeof value;
        }
        sanitizedForDebug = rawSanitized;
        if (profile.name || profile.avatar || profile.headline) return { profile, attempts, rawSanitized };
      }
    } catch (err) {
      attempts.push({
        variant: item.variant,
        status,
        message: err instanceof Error ? err.message : "请求异常",
      });
    }
  }

  return { profile: null, attempts, rawSanitized: sanitizedForDebug };
}

async function zhihuGet<T>(
  path: string,
  query: Record<string, string | number | undefined>,
  oauthToken?: string,
): Promise<Page<T>> {
  // 鉴权调用方：优先 Access Secret（官方契约）；没有时退一步用用户 token
  // —— 实测 openapi 的 /user 认可"用户 token 当 Bearer"，数据接口也试同一条路
  const { accessSecret } = getZhihuCredentials();
  const bearer = accessSecret || oauthToken;
  if (!bearer) throw new Error("ZHIHU_SERVER_NOT_READY");
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${bearer}`,
    "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
    "Content-Type": "application/json",
  };
  if (oauthToken) headers["X-OAuth-Token"] = oauthToken;

  const res = await fetch(url.toString(), { headers });
  const text = await res.text();

  let payload: RawResponse<T>;
  try {
    payload = JSON.parse(text) as RawResponse<T>;
  } catch {
    throw new Error(`知乎数据接口返回非 JSON（HTTP ${res.status}）`);
  }

  const code = payload.Code ?? 0;
  if (code !== 0) {
    // 20001 鉴权失败 / 30001 频率限制 / 30002 配额限制
    const hint =
      code === 20001
        ? "鉴权失败：检查 Access Secret 是否正确、以及 OAuth token 是否有效"
        : code === 30001
          ? "触发频率限制，请稍后再试"
          : code === 30002
            ? "该接口配额已用尽"
            : payload.Message || "接口返回错误";
    throw new Error(`知乎接口错误（Code ${code}）：${hint}`);
  }

  const items = payload.Data?.Items ?? [];
  const paging = payload.Data?.Paging ?? { IsEnd: true, Totals: items.length };
  return { items, paging };
}

/** 创作内容。ContentType 必填：all / answer / article / zvideo / pin / question */
export async function fetchContents(
  oauthToken: string | undefined,
  offset: number | string,
  limit = 20,
): Promise<Page<ContentItem>> {
  return zhihuGet<ContentItem>(
    "/api/v1/user/contents",
    { Offset: offset, Limit: Math.min(limit, 50), ContentType: "all", SortField: "ts", SortOrder: "desc" },
    oauthToken,
  );
}

/** 关注的用户 */
export async function fetchFollowees(
  oauthToken: string | undefined,
  offset: number | string,
  limit = 20,
): Promise<Page<FolloweeItem>> {
  return zhihuGet<FolloweeItem>("/api/v1/user/followees", { Offset: offset, Limit: Math.min(limit, 50) }, oauthToken);
}

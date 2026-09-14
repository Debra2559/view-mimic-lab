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
import { requireAccessSecret } from "@/lib/zhihu/credentials.server";

const API_BASE = "https://developer.zhihu.com";

export interface Paging {
  IsEnd: boolean;
  NextOffset?: string | number;
  Totals: number;
}

export interface ContentItem {
  ContentType: string;
  Url: string;
  CreatedAt: number;
  LikeCount: number;
  CommentCount: number;
  FavoriteCount: number;
  Title: string;
  Summary: string;
}

export interface FolloweeItem {
  Fullname: string;
  UrlToken: string;
  Url: string;
  AvatarUrl: string;
  Headline: string;
  Gender: number;
  FollowerCount: number;
}

export interface Page<T> {
  items: T[];
  paging: Paging;
}

interface RawResponse<T> {
  Code?: number;
  Message?: string;
  Data?: { Items?: T[]; Paging?: Paging };
}

async function zhihuGet<T>(
  path: string,
  query: Record<string, string | number | undefined>,
  oauthToken?: string,
): Promise<Page<T>> {
  const accessSecret = requireAccessSecret();
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessSecret}`,
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

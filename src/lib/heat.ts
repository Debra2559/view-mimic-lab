/**
 * 世界线热度：由回答数、收藏数与用户真实点击量共同决定。
 * 点击量存在本地，随用户行为实时累积，热度榜会随之变化。
 */

import { FEED_POSTS, getAnswerCount, type FeedPost } from "@/lib/feed";

const CLICKS_KEY = "portal-universe-clicks";
const VISITS_KEY = "portal-universe-feed-visits";

type ClickStore = Record<string, number>;

function readClicks(): ClickStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CLICKS_KEY);
    return raw ? (JSON.parse(raw) as ClickStore) : {};
  } catch {
    return {};
  }
}

/** 记录一次点击（进回答详情 / 进世界线都算） */
export function recordClick(id: string): void {
  if (typeof window === "undefined") return;
  const store = readClicks();
  store[id] = (store[id] ?? 0) + 1;
  try {
    window.localStorage.setItem(CLICKS_KEY, JSON.stringify(store));
  } catch {
    /* 忽略隐私模式下的写入失败 */
  }
}

export function getClicks(id: string): number {
  return readClicks()[id] ?? 0;
}

/** 热度分：回答共创越多、收藏越高、被点得越多，排名越靠前 */
export function heatScore(post: FeedPost, clicks = getClicks(post.id)): number {
  const answers = getAnswerCount(post);
  return (
    post.upvotes +
    post.stars * 4 +
    post.comments * 2 +
    answers * 1800 +
    clicks * 900
  );
}

/** 展示用的热度值，例如「8.4 万」 */
export function heatLabel(score: number): string {
  return score >= 10000 ? `${(score / 10000).toFixed(1)} 万` : String(score);
}

/** 按热度从高到低排序的全部帖子 */
export function getRankedPosts(): FeedPost[] {
  return [...FEED_POSTS].sort((a, b) => heatScore(b) - heatScore(a));
}

/** 某条世界线（storyId = postId）在热度榜上的名次，从 1 开始 */
export function getHeatRank(id: string): number {
  return getRankedPosts().findIndex((post) => post.id === id) + 1;
}

/**
 * 首页推荐流：按热度排序后做轮换。
 * 每次进首页把头部的热门世界线轮转一位，让热榜常看常新，
 * 但整体仍保持「越热越靠前」的大顺序。
 */
export function getRotatedFeed(): FeedPost[] {
  const ranked = getRankedPosts();
  if (typeof window === "undefined" || ranked.length < 2) return ranked;
  let visits = 0;
  try {
    visits = Number(window.sessionStorage.getItem(VISITS_KEY) ?? "0") + 1;
    window.sessionStorage.setItem(VISITS_KEY, String(visits));
  } catch {
    /* 忽略 */
  }
  const offset = (visits - 1) % ranked.length;
  return [...ranked.slice(offset), ...ranked.slice(0, offset)];
}

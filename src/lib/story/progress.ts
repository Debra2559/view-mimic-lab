/** 结局图鉴：把玩家解锁过的结局存在本地，用于收集感与大厅进度标记。 */

const KEY = "portal-universe-endings";

type Store = Record<string, string[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

export function getUnlocked(storyId: string): string[] {
  return read()[storyId] ?? [];
}

export function unlockEnding(storyId: string, endingKey: string): string[] {
  const store = read();
  const current = store[storyId] ?? [];
  if (current.includes(endingKey)) return current;
  const next = [...current, endingKey];
  store[storyId] = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* 忽略隐私模式下的写入失败 */
  }
  return next;
}

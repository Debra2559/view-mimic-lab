/**
 * 观众席：这条世界线上，多少人走到了同一个结局。
 *
 * 数据 = 演示基线（真实产品里来自服务端统计）
 *      + 本机玩家自己的真实选择次数。
 * 目的只有一个：让用户感到"我的选择不是孤立的"。
 */

const CHOICE_KEY = "portal-universe-choices";

/** 演示基线：每条世界线各结局的累计人数 */
const BASELINE: Record<string, Record<string, number>> = {
  corridor: { A: 1284, B: 876 },
  spin: { A: 942, B: 1310 },
  mind: { A: 1653, B: 1102 },
  mosquito: { A: 738, B: 621 },
  money: { A: 1456, B: 1893 },
  rewind: { A: 2103, B: 1544 },
  birth: { A: 1120, B: 1320 },
  pangdonglai: { A: 863, B: 1042 },
  hyrox: { A: 1276, B: 812 },
  yuqing: { A: 934, B: 1105 },
};

type Store = Record<string, string[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHOICE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

/** 记下玩家自己走过的这条路 */
export function recordChoice(storyId: string, endingKey: string): void {
  const store = read();
  const list = store[storyId] ?? [];
  store[storyId] = [...list, endingKey].slice(-20);
  try {
    window.localStorage.setItem(CHOICE_KEY, JSON.stringify(store));
  } catch {
    /* 忽略隐私模式下的写入失败 */
  }
}

export interface AudienceStat {
  /** 和你走到同一个结局的人占比（整数百分比） */
  percent: number;
  /** 这条世界线累计走过的人数 */
  total: number;
}

/** 观众席统计 */
export function getAudience(storyId: string, endingKey: string): AudienceStat {
  const base: Record<string, number> = { ...(BASELINE[storyId] ?? { A: 800, B: 600 }) };

  // 叠加本机真实选择
  for (const key of read()[storyId] ?? []) {
    base[key] = (base[key] ?? 0) + 1;
  }

  const total = Object.values(base).reduce((sum, n) => sum + n, 0);
  const here = base[endingKey] ?? 0;
  return {
    percent: total > 0 ? Math.max(1, Math.round((here / total) * 100)) : 50,
    total,
  };
}

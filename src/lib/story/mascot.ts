/**
 * 刘看山素材库（本地打包）。
 *
 * 说明：素材已从平台远程路径本地化，任何环境（含独立部署）都能直接加载。
 * 动图用于需要"看山在动"的少数场景；静态图用于卡片这类数量多、
 * 需要避免大量 GIF 同时解码的场景。
 */
// 转场引座与生成等待用的是高清 WebP：288/256px + 完整 alpha 通道。
// （早期用 176px 的 GIF，在 Retina 屏上等于放大显示，且 GIF 只有 1-bit 透明会糊边。）
import mascotComputer from "@/assets/mascot/mascot-computer.webp";
import mascotComputerStill from "@/assets/mascot/mascot-computer.png";
import mascotDribble from "@/assets/mascot/mascot-dribble.gif";
import mascotDribbleStill from "@/assets/mascot/mascot-dribble.png";
import mascotGreeting from "@/assets/mascot/mascot-greeting.webp";
import mascotGreetingStill from "@/assets/mascot/mascot-greeting.png";
import mascotIdle from "@/assets/mascot/mascot-idle.gif";
import mascotIdleStill from "@/assets/mascot/mascot-idle.png";
import mascotSleepy from "@/assets/mascot/mascot-sleepy.gif";
import mascotSleepyStill from "@/assets/mascot/mascot-sleepy.png";
import mascotWander from "@/assets/mascot/mascot-wander.gif";
import mascotWanderStill from "@/assets/mascot/mascot-wander.png";

export type MascotKey = "greeting" | "idle" | "sleepy" | "wander" | "computer" | "dribble";

/** 动图：每处只用一个，避免同时解码过多 */
export const MASCOT: Record<MascotKey, string> = {
  greeting: mascotGreeting,
  idle: mascotIdle,
  sleepy: mascotSleepy,
  wander: mascotWander,
  computer: mascotComputer,
  dribble: mascotDribble,
};

/** 静态图：卡片等小尺寸、多数量场景使用 */
export const MASCOT_STILL: Record<MascotKey, string> = {
  greeting: mascotGreetingStill,
  idle: mascotIdleStill,
  sleepy: mascotSleepyStill,
  wander: mascotWanderStill,
  computer: mascotComputerStill,
  dribble: mascotDribbleStill,
};

/**
 * 按世界线 id 稳定地挑一张静态看山图——
 * 同一条世界线每次都拿到同一只看山，看起来像"它是这条线的画师"。
 */
const STILL_ORDER: MascotKey[] = ["idle", "greeting", "wander", "sleepy", "computer", "dribble"];

export function mascotFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return MASCOT_STILL[STILL_ORDER[hash % STILL_ORDER.length]!];
}

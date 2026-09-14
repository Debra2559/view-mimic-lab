import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * 知乎头像。
 *
 * 三个真实会遇到的问题，都在这里处理掉：
 * 1. 相对路径需要补图床域名（服务端已归一化，但域名可能变）；
 * 2. **防盗链**：带着我们域名的 Referer 去打知乎图床可能被拒 → 加 `referrerPolicy="no-referrer"`；
 * 3. **偶发失败**：网络抖动/CDN 边缘节点未命中 → **重试一次**（带 cache-buster），仍失败才降级成占位图标。
 *    以前"一失败就永久降级"会导致头像在真头像与占位图之间来回闪。
 */
export function ZhihuAvatar({
  src,
  className = "size-8 rounded-full object-cover",
  fallbackClassName = "grid size-8 place-items-center rounded-full bg-kanshan-sky text-kanshan-blue",
  iconClassName = "size-4",
  alt = "",
}: {
  src?: string | undefined;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // 换了地址就重置失败与重试状态（比如重新登录后）
  useEffect(() => {
    setFailed(false);
    setAttempt(0);
  }, [src]);

  if (!src || failed) {
    return (
      <span className={fallbackClassName} aria-hidden={alt ? undefined : true}>
        <UserRound className={iconClassName} />
      </span>
    );
  }

  // 重试时加一个无意义的 query，避开"失败结果被缓存"导致的重试无效
  const effectiveSrc = attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`;

  return (
    <img
      key={attempt}
      src={effectiveSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => (attempt < 1 ? setAttempt(attempt + 1) : setFailed(true))}
    />
  );
}

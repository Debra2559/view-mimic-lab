import { ArrowUpRight, Quote, ThumbsUp } from "lucide-react";

import { mascotFor } from "@/lib/story/mascot";
import type { ImportedArticle } from "@/lib/articles";

/**
 * 导入的真文章卡片（主页信息流）。
 *
 * 这些文章来自知乎开放平台抓取：主页原本没有它们的宿主文章，
 * 所以把文章本身显示出来，并提供进入入口——
 * 进去之后，金句卡挂在正文对应的那一段上，点一下就生成分享海报。
 */
export function ArticleCard({
  article,
  onEnter,
}: {
  article: ImportedArticle;
  onEnter: (id: string) => void;
}) {
  return (
    <div
      className="relative cursor-pointer px-4 py-4 transition-colors hover:bg-muted/30"
      onClick={() => onEnter(article.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEnter(article.id);
      }}
    >
      {/* 来源行：真人真文，标明出处 */}
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <img
          src={mascotFor(article.id)}
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="size-4 object-contain"
        />
        <span>{article.author}</span>
        {article.badge && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="truncate">{article.badge}</span>
          </>
        )}
        <span className="ml-auto inline-flex items-center gap-1 tabular-nums">
          <ThumbsUp className="size-3" />
          {article.voteup}
        </span>
      </div>

      {/* 标题 */}
      <h3 className="mt-2 text-[17px] font-bold leading-snug text-foreground">{article.title}</h3>

      {/* 摘要 */}
      <p className="mt-2 line-clamp-3 text-[14px] leading-[1.75] text-foreground/70">{article.excerpt}</p>

      {/* 进入入口 */}
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-kanshan-blue px-2.5 py-1 text-[11.5px] font-semibold text-white">
          读全文
          <ArrowUpRight className="size-3" />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-kanshan-line bg-kanshan-sky/40 px-2.5 py-1 text-[11.5px] text-kanshan-blue">
          <Quote className="size-3" />
          内嵌 1 张金句卡
        </span>
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto text-[11.5px] text-muted-foreground underline-offset-2 hover:underline"
        >
          知乎原文
        </a>
      </div>
    </div>
  );
}

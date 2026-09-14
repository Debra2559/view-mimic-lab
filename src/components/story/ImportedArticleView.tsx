import { ArrowLeft, Quote, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { QuoteCardSheet } from "@/components/story/QuoteCardSheet";
import { LoginPromptSheet, useZhihuAuth } from "@/components/story/LoginGate";
import type { ImportedArticle } from "@/lib/articles";
import { buildFlashShareText, flashToQuote } from "@/lib/flash-card";
import { FLASH_CARDS } from "@/lib/story/flash";
import { mascotFor } from "@/lib/story/mascot";

/**
 * 导入的真文章阅读页。
 *
 * 金句闪卡不单独占模块——它挂在正文对应的那一段上：
 * 那一段旁边有「生成金句卡」标记，点一下就出分享海报（与分享出去的卡片同一套视觉）。
 * 扫码回流（?flash=xxx）会直接滚到那一段，高亮，并自动把卡片弹出来。
 */
export function ImportedArticleView({ article }: { article: ImportedArticle }) {
  const flash = FLASH_CARDS.find((card) => card.id === article.flashId);
  const [open, setOpen] = useState(false);

  // 产品约定：金句卡需要先登录知乎账号
  const gate = useZhihuAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [highlight, setHighlight] = useState(false);

  // 扫码 / 分享链接回流：滚到金句段 → 高亮 → 自动弹出金句卡
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("flash");
    if (!id || id !== article.flashId) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`para-${article.flashParaIndex}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(true);
      window.setTimeout(() => setOpen(true), 900);
      window.setTimeout(() => setHighlight(false), 4600);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [article.flashId, article.flashParaIndex]);

  return (
    <article className="mx-auto min-h-screen max-w-[768px] bg-background pb-28 text-foreground md:border-x md:border-border">
      {/* 顶栏 */}
      <div className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
        <Link to="/" className="grid size-8 place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        <span className="truncate text-[13px] text-muted-foreground">知乎 · 导入的真文章</span>
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-[12px] text-kanshan-blue"
        >
          看原文
        </a>
      </div>

      <div className="px-5 py-5">
        {/* 标题与作者 */}
        <h1 className="text-[21px] font-bold leading-snug">{article.title}</h1>
        <div className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
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

        {/* 正文：金句挂在指定段落上 */}
        <div className="answer-copy mt-5 space-y-4">
          {article.paragraphs.map((text, index) => {
            const isFlash = index === article.flashParaIndex && flash;
            return (
              <p
                key={index}
                id={`para-${index}`}
                className={`text-[17px] leading-[1.86] text-foreground/85 ${
                  isFlash
                    ? "relative -mx-2 rounded-xl px-2 py-2 transition-shadow duration-500 " +
                      (highlight
                        ? "bg-kanshan-sky/40 ring-2 ring-kanshan-blue/60"
                        : "bg-kanshan-sky/20")
                    : ""
                }`}
              >
                {text}
                {isFlash && (
                  <button
                    type="button"
                    onClick={() => (gate.authorized ? setOpen(true) : setGateOpen(true))}
                    className="ml-1 inline-flex items-center gap-1 rounded-full bg-kanshan-blue px-2 py-0.5 align-middle text-[11px] font-semibold text-white transition-transform hover:scale-105"
                  >
                    <Quote className="size-2.5" />
                    金句卡
                  </button>
                )}
              </p>
            );
          })}
        </div>

        {/* 底部：出处与入口 */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-[12.5px] text-muted-foreground">
          <span>内容来自知乎开放平台，仅作展示</span>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-kanshan-blue"
          >
            前往知乎原文
          </a>
        </div>
      </div>

      {gateOpen && <LoginPromptSheet feature="金句卡" open onClose={() => setGateOpen(false)} />}

      {open && flash && (
        <QuoteCardSheet
          input={flashToQuote(flash)}
          shareUrl={`${window.location.origin}/answer/${article.id}?flash=${flash.id}`}
          shareText={buildFlashShareText(flash)}
          onClose={() => setOpen(false)}
        />
      )}
    </article>
  );
}

import { Check, Copy, Download, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { CARD_QR_TARGET } from "@/lib/share-target";
import { toast } from "sonner";

import { buildShareText, downloadDataUrl, generateEndingCard } from "@/lib/share-card";
import type { Ending, Story } from "@/lib/story";
import { Button } from "@/components/ui/button";

export function ShareSheet({ story, ending, onClose }: { story: Story; ending: Ending; onClose: () => void }) {
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"weibo" | "wechat" | null>(null);

  const shareText = buildShareText(story, ending);
  const pageUrl = window.location.href;

  useEffect(() => {
    let cancelled = false;
    generateEndingCard(story, ending)
      .then((url) => {
        if (!cancelled) setCardUrl(url);
      })
      .catch(() => toast.error("结局卡片生成失败"));
    QRCode.toDataURL(CARD_QR_TARGET, { width: 220, margin: 1, color: { dark: "#0b1020", light: "#ffffff" } })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [story, ending]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${pageUrl}`);
      setCopied(true);
      toast.success("分享文案已复制");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请长按手动复制");
    }
  };

  const saveImage = () => {
    if (!cardUrl) return;
    downloadDataUrl(cardUrl, `结局-${ending.title}.png`);
    toast.success("结局卡片已保存");
  };

  const shareToWeibo = () => {
    saveImage();
    const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("已打开微博，记得把刚保存的结局卡片贴上去");
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-story-night/80 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-label="分享结局"
      onClick={onClose}
    >
      <div
        className="choice-in w-full max-w-md rounded-t-3xl border border-story-ink/12 bg-story-panel p-5 backdrop-blur-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-story-ink">分享我的结局</h3>
          <Button
            variant="ghost"
            size="icon"
            aria-label="关闭分享"
            onClick={onClose}
            className="size-9 rounded-full text-story-ink/70 hover:text-story-ink"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="w-[108px] shrink-0 overflow-hidden rounded-xl border border-story-ink/15 bg-story-night">
            {cardUrl ? (
              <img src={cardUrl} alt={`结局卡片：${ending.title}`} className="block h-full w-full object-cover" />
            ) : (
              <div className="grid h-[172px] place-items-center">
                <Loader2 className="size-5 animate-spin text-story-ink/50" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-story-ink">「{ending.title}」</p>
            <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-story-ink/70">{shareText}</p>
            <button
              type="button"
              onClick={copyText}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-story-ink/15 px-3 py-1.5 text-[12.5px] text-story-ink/80 transition-colors hover:border-story-glow/50 hover:text-story-ink"
            >
              {copied ? <Check className="size-3.5 text-story-glow" /> : <Copy className="size-3.5" />}
              {copied ? "已复制" : "复制文案"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTab(tab === "weibo" ? null : "weibo")}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[15px] font-medium transition-colors ${
              tab === "weibo"
                ? "border-story-glow/60 text-story-ink"
                : "border-story-ink/15 text-story-ink/85 hover:border-story-glow/40"
            }`}
          >
            <Send className="size-4" />
            发到微博
          </button>
          <button
            type="button"
            onClick={() => setTab(tab === "wechat" ? null : "wechat")}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[15px] font-medium transition-colors ${
              tab === "wechat"
                ? "border-story-glow/60 text-story-ink"
                : "border-story-ink/15 text-story-ink/85 hover:border-story-glow/40"
            }`}
          >
            <MessageCircle className="size-4" />
            发给微信好友
          </button>
        </div>

        {tab === "weibo" && (
          <div className="mt-4 rounded-2xl border border-story-ink/10 bg-story-night/50 p-4">
            <p className="text-[13.5px] leading-relaxed text-story-ink/75">
              会自动保存结局卡片并打开微博发文页，发文时把卡片图片贴上，朋友一眼就能看到你的结局。
            </p>
            <Button
              onClick={shareToWeibo}
              className="mt-3 h-11 w-full rounded-full bg-story-glow text-[15px] font-semibold text-story-night hover:bg-story-glow/90"
            >
              <Send className="size-4" />
              保存卡片并打开微博
            </Button>
          </div>
        )}

        {tab === "wechat" && (
          <div className="mt-4 rounded-2xl border border-story-ink/10 bg-story-night/50 p-4 text-center">
            <p className="text-[13.5px] leading-relaxed text-story-ink/75">
              保存卡片后发给好友，或让朋友扫码打开《看山画境》的作品页：
            </p>
            <div className="mx-auto mt-3 w-fit rounded-xl bg-white p-2">
              {qrUrl ? (
                <img src={qrUrl} alt="微信扫码进入故事" className="size-[132px]" />
              ) : (
                <div className="grid size-[132px] place-items-center">
                  <Loader2 className="size-5 animate-spin text-story-ink/50" />
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => {
                  saveImage();
                  void copyText();
                }}
                className="h-11 flex-1 rounded-full bg-story-glow text-[14.5px] font-semibold text-story-night hover:bg-story-glow/90"
              >
                <Download className="size-4" />
                保存卡片+复制文案
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { Check, Copy, Download, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { CARD_QR_TARGET } from "@/lib/share-target";
import { toast } from "sonner";

import { generateQuoteCard, type QuoteCardInput } from "@/lib/flash-card";
import { downloadDataUrl } from "@/lib/share-card";
import { Button } from "@/components/ui/button";

/**
 * 金句卡分享面板（白色知乎风）——闪卡与"划线金句"共用。
 * 卡片自带二维码：朋友扫码打开，会直接落在这句金句所在的位置。
 */
export function QuoteCardSheet({
  input,
  shareUrl,
  shareText,
  onClose,
}: {
  input: QuoteCardInput;
  shareUrl: string;
  shareText: string;
  onClose: () => void;
}) {
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputKey = JSON.stringify(input);

  useEffect(() => {
    let cancelled = false;
    // 二维码落到知乎黑客松作品页（统一常量，见 lib/share-target.ts）
    QRCode.toDataURL(CARD_QR_TARGET, {
      width: 240,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    })
      .then((qr) => {
        if (cancelled) return;
        return generateQuoteCard(JSON.parse(inputKey) as QuoteCardInput, qr);
      })
      .then((url) => {
        if (!cancelled && url) setCardUrl(url);
      })
      .catch(() => toast.error("金句卡生成失败"));
    return () => {
      cancelled = true;
    };
  }, [inputKey]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      toast.success("分享文案已复制");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请长按手动复制");
    }
  };

  const saveImage = () => {
    if (!cardUrl) return;
    downloadDataUrl(cardUrl, "金句卡.png");
    toast.success("金句卡已保存");
  };

  const shareToWeibo = () => {
    saveImage();
    const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("已打开微博，记得把刚保存的金句卡贴上去");
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-label="分享这张金句卡"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-foreground">分享这张金句卡</h3>
          <Button
            variant="ghost"
            size="icon"
            aria-label="关闭分享"
            onClick={onClose}
            className="size-9 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          {cardUrl ? (
            <img src={cardUrl} alt={`金句卡：${input.quote}`} className="block w-full" />
          ) : (
            <div className="grid h-[280px] place-items-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
          卡片自带二维码——朋友扫码可打开《看山画境》的作品页。
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={saveImage}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-kanshan-line py-3.5 text-[13px] font-medium text-kanshan-blue transition-colors hover:border-kanshan-blue/40 hover:bg-kanshan-sky/40"
          >
            <Download className="size-4.5" />
            保存图片
          </button>
          <button
            type="button"
            onClick={copyText}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-kanshan-line py-3.5 text-[13px] font-medium text-kanshan-blue transition-colors hover:border-kanshan-blue/40 hover:bg-kanshan-sky/40"
          >
            {copied ? <Check className="size-4.5" /> : <Copy className="size-4.5" />}
            {copied ? "已复制" : "复制文案"}
          </button>
          <button
            type="button"
            onClick={shareToWeibo}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-kanshan-line py-3.5 text-[13px] font-medium text-kanshan-blue transition-colors hover:border-kanshan-blue/40 hover:bg-kanshan-sky/40"
          >
            <Send className="size-4.5" />
            发到微博
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            saveImage();
            void copyText();
          }}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-kanshan-blue text-[14.5px] font-semibold text-white transition-colors hover:bg-kanshan-deep"
        >
          <MessageCircle className="size-4.5" />
          保存卡片 + 复制文案（发给微信好友）
        </button>
      </div>
    </div>
  );
}

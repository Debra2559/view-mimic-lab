/**
 * 分享卡二维码的统一落点。
 *
 * 现在指向**知乎黑客松作品页**——卡片被保存/转发出去后，扫码落到作品页（而不是回到站内原文）。
 * 想改回落点，只改这一个常量即可（两处二维码都从这里取）。
 */
export const CARD_QR_TARGET =
  "https://www.zhihu.com/hackathon/project/120106?activity_code=zhihu_hackathon_2026_p2";

/** 二维码旁的引导语：**必须跟着落点一起改**，否则文案会误导扫码的人 */
export const CARD_QR_HINT = "扫码看《看山画境》作品页";

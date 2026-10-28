export const STARTORCH_COUPON = Object.freeze({
  src: "/assets/ui/startorch-coupon.webp",
  width: 827,
  height: 746,
  label: "星炬券"
});

// Normalize only currency display copy; persisted economy fields keep their names.
export function normalizeCouponText(value) {
  return String(value ?? "")
    .replace(/\b(?:not enough|insufficient) coins\b/gi, `${STARTORCH_COUPON.label}不足`)
    .replace(/金币|\bcoins?\b/gi, STARTORCH_COUPON.label);
}

export function isCouponInsufficientNotice(message) {
  return normalizeCouponText(message) === `${STARTORCH_COUPON.label}不足`;
}

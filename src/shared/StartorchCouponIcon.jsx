import { STARTORCH_COUPON, normalizeCouponText } from "./startorchCoupon.js";

export default function StartorchCouponIcon({ size = 24, decorative = false }) {
  return (
    <span className="startorch-coupon-icon" style={{ width: size }}>
      <img
        className="startorch-coupon-art"
        src={STARTORCH_COUPON.src}
        width={STARTORCH_COUPON.width}
        height={STARTORCH_COUPON.height}
        alt={decorative ? "" : STARTORCH_COUPON.label}
        aria-hidden={decorative || undefined}
        draggable="false"
        decoding="async"
      />
    </span>
  );
}

export function CouponText({ children }) {
  return normalizeCouponText(children).split(/(星炬券)/).map((part, index) => (
    part === "星炬券"
      ? <StartorchCouponIcon key={index} size="1.4em" />
      : part
  ));
}

export function couponNotice(message) {
  return normalizeCouponText(message).includes(STARTORCH_COUPON.label) ? <CouponText>{message}</CouponText> : message;
}

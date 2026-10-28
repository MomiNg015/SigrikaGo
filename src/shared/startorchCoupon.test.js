import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STARTORCH_COUPON, isCouponInsufficientNotice, normalizeCouponText } from "./startorchCoupon.js";

describe("currency display compatibility", () => {
  it.each(["金币不足", "Not enough coins", "not enough coins", "Insufficient coins", "星炬券不足"])("recognizes %s without changing the purchase feedback branch", (message) => {
    expect(isCouponInsufficientNotice(message)).toBe(true);
    expect(normalizeCouponText(message)).toBe("星炬券不足");
  });

  it("normalizes legacy reward labels without rewriting internal identifiers or other currencies", () => {
    expect(normalizeCouponText("100 金币 / 20 Coins")).toBe("100 星炬券 / 20 星炬券");
    expect(normalizeCouponText("blueGems / coinCost / priceCoins / coinsBonus")).toBe("blueGems / coinCost / priceCoins / coinsBonus");
    expect(isCouponInsufficientNotice("网络异常")).toBe(false);
  });
});

describe("authored coupon asset", () => {
  it("only trims transparent margins and preserves all visible source pixels in both runtime formats", async () => {
    const sourcePath = new URL("../../docs/design-samples/startorch-coupon-2026-10-27/authored-source.png", import.meta.url);
    const { data, info } = await sharp(fileURLToPath(sourcePath)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let left = info.width, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        if (!data[(y * info.width + x) * 4 + 3]) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    expect({ left, top, width: right - left + 1, height: bottom - top + 1 })
      .toEqual({ left: 111, top: 162, width: STARTORCH_COUPON.width, height: STARTORCH_COUPON.height });
    for (const format of ["png", "webp"]) {
      const asset = new URL(`../../public/assets/ui/startorch-coupon.${format}`, import.meta.url);
      const output = await sharp(fileURLToPath(asset)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect([output.info.width, output.info.height]).toEqual([827, 746]);
      let changedPixels = 0;
      for (let y = 0; y < output.info.height; y += 1) {
        for (let x = 0; x < output.info.width; x += 1) {
          const original = ((top + y) * info.width + left + x) * 4;
          const cropped = (y * output.info.width + x) * 4;
          if (output.data[cropped + 3] !== data[original + 3]
            || (data[original + 3] && !output.data.subarray(cropped, cropped + 3).equals(data.subarray(original, original + 3)))) {
            changedPixels += 1;
          }
        }
      }
      expect(changedPixels, format).toBe(0);
    }
  });
});

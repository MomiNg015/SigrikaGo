import { describe, expect, it } from "vitest";
import { normalizeShopItemIllustName, normalizeShopItemIllustUrl } from "./shopItemIllust.js";

describe("shop item illustration credit helpers", () => {
  it("trims illustration names", () => {
    expect(normalizeShopItemIllustName("  画师  ")).toBe("画师");
    expect(normalizeShopItemIllustName(null)).toBe("");
  });

  it("accepts http(s) and root-relative illustration links only", () => {
    expect(normalizeShopItemIllustUrl(" https://example.com/illust ")).toBe("https://example.com/illust");
    expect(normalizeShopItemIllustUrl("http://example.com/illust")).toBe("http://example.com/illust");
    expect(normalizeShopItemIllustUrl("/credits/illust")).toBe("/credits/illust");
    expect(normalizeShopItemIllustUrl("")).toBe("");
    expect(normalizeShopItemIllustUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeShopItemIllustUrl("//example.com/illust")).toBeNull();
    expect(normalizeShopItemIllustUrl("/bad path")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHOP_MASCOT_DIALOGUES,
  MAX_MASCOT_DIALOGUE_LENGTH,
  MAX_MASCOT_DIALOGUE_POOL_SIZE,
  normalizeShopMascotDialogues,
  shopMascotDialoguesFromSettings,
  shopMascotDialoguesSettingJson
} from "./shopMascotDialogues.js";

describe("shop mascot dialogue settings", () => {
  it("round-trips the default dialogue contract", () => {
    const serialized = shopMascotDialoguesSettingJson(DEFAULT_SHOP_MASCOT_DIALOGUES);

    expect(shopMascotDialoguesFromSettings({ shopMascotDialogues: serialized })).toEqual(
      DEFAULT_SHOP_MASCOT_DIALOGUES
    );
  });

  it("normalizes whitespace, lengths, pool sizes, and missing fields", () => {
    const normalized = normalizeShopMascotDialogues({
      zahira: {
        greetingLines: [
          "  自定义\n欢迎语  ",
          ...Array.from({ length: MAX_MASCOT_DIALOGUE_POOL_SIZE + 4 }, (_, index) => `台词 ${index}`)
        ],
        refreshLines: [],
        loadingLine: "很长".repeat(MAX_MASCOT_DIALOGUE_LENGTH)
      },
      nabomo: {
        greetingLines: ["娜波摩欢迎。"],
        insufficientLine: "   "
      }
    });

    expect(normalized.zahira.greetingLines[0]).toBe("自定义 欢迎语");
    expect(normalized.zahira.greetingLines).toHaveLength(MAX_MASCOT_DIALOGUE_POOL_SIZE);
    expect(normalized.zahira.refreshLines).toEqual(DEFAULT_SHOP_MASCOT_DIALOGUES.zahira.refreshLines);
    expect(normalized.zahira.loadingLine).toHaveLength(MAX_MASCOT_DIALOGUE_LENGTH);
    expect(normalized.nabomo.greetingLines).toEqual(["娜波摩欢迎。"]);
    expect(normalized.nabomo.insufficientLine).toBe(
      DEFAULT_SHOP_MASCOT_DIALOGUES.nabomo.insufficientLine
    );
  });

  it("falls back safely for malformed stored JSON", () => {
    expect(normalizeShopMascotDialogues("{invalid")).toEqual(DEFAULT_SHOP_MASCOT_DIALOGUES);
    expect(normalizeShopMascotDialogues("[]")).toEqual(DEFAULT_SHOP_MASCOT_DIALOGUES);
  });
});

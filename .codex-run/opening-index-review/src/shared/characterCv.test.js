import { describe, expect, it } from "vitest";
import { normalizeCharacterCvName, normalizeCharacterCvUrl } from "./characterCv.js";

describe("character CV helpers", () => {
  it("trims CV names", () => {
    expect(normalizeCharacterCvName("  配音者  ")).toBe("配音者");
    expect(normalizeCharacterCvName(null)).toBe("");
  });

  it("accepts http(s) and root-relative CV links only", () => {
    expect(normalizeCharacterCvUrl(" https://example.com/cv ")).toBe("https://example.com/cv");
    expect(normalizeCharacterCvUrl("http://example.com/cv")).toBe("http://example.com/cv");
    expect(normalizeCharacterCvUrl("/credits/cv")).toBe("/credits/cv");
    expect(normalizeCharacterCvUrl("")).toBe("");
    expect(normalizeCharacterCvUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeCharacterCvUrl("//example.com/cv")).toBeNull();
    expect(normalizeCharacterCvUrl("/bad path")).toBeNull();
  });
});

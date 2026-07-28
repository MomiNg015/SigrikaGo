import { describe, expect, it } from "vitest";
import {
  DEFAULT_IRIS_GREETING,
  MAX_IRIS_GREETING_LENGTH,
  normalizeIrisGreeting
} from "./irisGreeting.js";

describe("IRIS greeting normalization", () => {
  it("normalizes whitespace and preserves configured text", () => {
    expect(normalizeIrisGreeting("  今天\n也要认真复盘。  ")).toBe("今天 也要认真复盘。");
  });

  it("uses the default for blank input and limits stored length", () => {
    expect(normalizeIrisGreeting("   ")).toBe(DEFAULT_IRIS_GREETING);
    expect(normalizeIrisGreeting("问".repeat(120))).toHaveLength(MAX_IRIS_GREETING_LENGTH);
  });
});

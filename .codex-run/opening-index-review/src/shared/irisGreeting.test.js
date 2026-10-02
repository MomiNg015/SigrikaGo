import { describe, expect, it } from "vitest";
import {
  DEFAULT_IRIS_GREETING,
  DEFAULT_IRIS_GREETINGS,
  MAX_IRIS_GREETING_LENGTH,
  MAX_IRIS_GREETING_POOL_SIZE,
  irisGreetingsSettingJson,
  normalizeIrisGreeting,
  normalizeIrisGreetings,
  pickIrisGreeting
} from "./irisGreeting.js";

describe("IRIS greeting normalization", () => {
  it("normalizes whitespace and preserves configured text", () => {
    expect(normalizeIrisGreeting("  今天\n也要认真复盘。  ")).toBe("今天 也要认真复盘。");
  });

  it("uses the default for blank input and limits stored length", () => {
    expect(normalizeIrisGreeting("   ")).toBe(DEFAULT_IRIS_GREETING);
    expect(normalizeIrisGreeting("问".repeat(120))).toHaveLength(MAX_IRIS_GREETING_LENGTH);
  });

  it("accepts legacy plain text and normalizes bounded JSON pools", () => {
    expect(normalizeIrisGreetings("旧环境问候语")).toEqual(["旧环境问候语"]);
    expect(normalizeIrisGreetings(JSON.stringify([
      "  第一句  ",
      "第二\n句",
      "",
      ..."问".repeat(MAX_IRIS_GREETING_POOL_SIZE + 2)
    ]))).toHaveLength(MAX_IRIS_GREETING_POOL_SIZE);
    expect(normalizeIrisGreetings("   ")).toEqual(DEFAULT_IRIS_GREETINGS);
    expect(JSON.parse(irisGreetingsSettingJson([" 第一句 ", "第二句"]))).toEqual([
      "第一句",
      "第二句"
    ]);
  });

  it("picks one normalized greeting from the configured pool", () => {
    expect(pickIrisGreeting(["第一句", "第二句"], () => 0)).toBe("第一句");
    expect(pickIrisGreeting(["第一句", "第二句"], () => 0.999)).toBe("第二句");
  });
});

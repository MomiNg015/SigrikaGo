import { describe, expect, it } from "vitest";
import {
  extractSkillTraitReferences,
  formatSkillOverclock,
  skillTraitMap
} from "./skillTraits.js";

describe("skill trait shared helpers", () => {
  it("extracts references in authored order without requiring a leading block", () => {
    expect(extractSkillTraitReferences("正文【疾走】中段【禁先】结尾")).toEqual(["疾走", "禁先"]);
  });

  it("formats structured base values including dynamic-skill zero", () => {
    expect(formatSkillOverclock({ costType: "numeric", costValue: "0" })).toBe("超频：0");
    expect(formatSkillOverclock({ costType: "special", costValue: "弃一子" })).toBe("超频：弃一子");
  });

  it("ignores incomplete glossary rows", () => {
    expect([...skillTraitMap([
      { name: "疾走", definition: "释义" },
      { name: "未知", definition: "" }
    ]).keys()]).toEqual(["疾走"]);
  });
});

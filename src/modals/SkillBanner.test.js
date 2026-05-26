import { describe, expect, it } from "vitest";
import { shouldPlaySkillBannerVoice } from "./SkillBanner.jsx";

describe("SkillBanner helpers", () => {
  it("plays only when a new banner has voice content", () => {
    expect(shouldPlaySkillBannerVoice({ id: "a" }, "", { type: "audio" })).toBe(true);
    expect(shouldPlaySkillBannerVoice({ id: "a" }, "a", { type: "audio" })).toBe(false);
    expect(shouldPlaySkillBannerVoice({ id: "b" }, "", { text: "发动技能" })).toBe(true);
    expect(shouldPlaySkillBannerVoice({ id: "c" }, "", {})).toBe(false);
    expect(shouldPlaySkillBannerVoice(null, "", { type: "audio" })).toBe(false);
  });
});

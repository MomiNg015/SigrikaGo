import { describe, expect, test } from "vitest";
import {
  ACTIVE_SKILL_EFFECT_TYPES,
  SKILL_EFFECT_OPTIONS,
  skillEffectSoundCues,
  skillEffectTargetRule,
  skillEffectTypeList,
  skillEffectTypeMessage
} from "./skillEffectCatalog.js";

describe("skillEffectCatalog", () => {
  test("owns active and passive skill effect type ordering", () => {
    expect(skillEffectTypeList()).toEqual([
      "erase-point",
      "flip-stone",
      "hidden-hand",
      "random-blast",
      "spray-stone",
      "color-illusion-passive"
    ]);
    expect(ACTIVE_SKILL_EFFECT_TYPES).toEqual([
      "erase-point",
      "flip-stone",
      "hidden-hand",
      "random-blast",
      "spray-stone"
    ]);
  });

  test("provides default target rules for each effect", () => {
    expect(skillEffectTargetRule("erase-point")).toBe("empty-point");
    expect(skillEffectTargetRule("flip-stone")).toBe("stone");
    expect(skillEffectTargetRule("hidden-hand")).toBe("empty-point");
    expect(skillEffectTargetRule("random-blast")).toBe("none");
    expect(skillEffectTargetRule("spray-stone")).toBe("stone");
    expect(skillEffectTargetRule("color-illusion-passive")).toBe("none");
    expect(skillEffectTargetRule("unknown")).toBe("none");
  });

  test("keeps admin option labels and validation message derived from one list", () => {
    expect(SKILL_EFFECT_OPTIONS.map((option) => option.value)).toEqual(skillEffectTypeList());
    expect(SKILL_EFFECT_OPTIONS.find((option) => option.value === "spray-stone")).toEqual({
      value: "spray-stone",
      label: "流光溢彩"
    });
    expect(skillEffectTypeMessage()).toBe("erase-point, flip-stone, hidden-hand, random-blast, spray-stone, or color-illusion-passive");
  });

  test("provides sound cue timing for animated board effects", () => {
    expect(skillEffectSoundCues("erase-point")).toEqual({ startAt: 0.08, impactAt: 0.48 });
    expect(skillEffectSoundCues("flip-stone")).toEqual({ startAt: 0.04, impactAt: 0.6 });
    expect(skillEffectSoundCues("random-blast")).toEqual({ startAt: 0.06, impactAt: 0.56 });
    expect(skillEffectSoundCues("spray-stone")).toEqual({ startAt: 0.04, impactAt: 0.58 });
    expect(skillEffectSoundCues("hidden-hand")).toEqual({ startAt: 0.04, impactAt: 0.52 });
    expect(skillEffectSoundCues("color-illusion-passive")).toEqual({ startAt: 0, impactAt: 0 });
  });
});

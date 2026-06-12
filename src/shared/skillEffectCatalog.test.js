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
      "color-illusion-passive"
    ]);
    expect(ACTIVE_SKILL_EFFECT_TYPES).toEqual([
      "erase-point",
      "flip-stone",
      "hidden-hand",
      "random-blast"
    ]);
  });

  test("provides default target rules for each effect", () => {
    expect(skillEffectTargetRule("erase-point")).toBe("empty-point");
    expect(skillEffectTargetRule("flip-stone")).toBe("stone");
    expect(skillEffectTargetRule("hidden-hand")).toBe("empty-point");
    expect(skillEffectTargetRule("random-blast")).toBe("none");
    expect(skillEffectTargetRule("color-illusion-passive")).toBe("none");
    expect(skillEffectTargetRule("unknown")).toBe("none");
  });

  test("keeps admin option labels and validation message derived from one list", () => {
    expect(SKILL_EFFECT_OPTIONS).toEqual([
      { value: "erase-point", label: "抹除交叉点" },
      { value: "flip-stone", label: "棋子反色" },
      { value: "hidden-hand", label: "隐藏手" },
      { value: "random-blast", label: "随机爆炸" },
      { value: "color-illusion-passive", label: "被动伪装" }
    ]);
    expect(skillEffectTypeMessage()).toBe("erase-point, flip-stone, hidden-hand, random-blast, or color-illusion-passive");
  });

  test("provides sound cue timing for animated board effects", () => {
    expect(skillEffectSoundCues("erase-point")).toEqual({ startAt: 0.08, impactAt: 0.48 });
    expect(skillEffectSoundCues("flip-stone")).toEqual({ startAt: 0.04, impactAt: 0.6 });
    expect(skillEffectSoundCues("random-blast")).toEqual({ startAt: 0.06, impactAt: 0.56 });
    expect(skillEffectSoundCues("hidden-hand")).toEqual({ startAt: 0.04, impactAt: 0.52 });
    expect(skillEffectSoundCues("color-illusion-passive")).toEqual({ startAt: 0, impactAt: 0 });
  });
});

import { describe, expect, test } from "vitest";
import {
  ACTIVE_SKILL_EFFECT_TYPES,
  SKILL_EFFECT_CATALOG,
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
      "voyage-star",
      "protocol-takeover",
      "random-blast",
      "row-slash",
      "spray-stone",
      "liberty-purge",
      "double-move",
      "color-illusion-passive"
    ]);
    expect(ACTIVE_SKILL_EFFECT_TYPES).toEqual([
      "erase-point",
      "flip-stone",
      "hidden-hand",
      "voyage-star",
      "protocol-takeover",
      "random-blast",
      "row-slash",
      "spray-stone",
      "liberty-purge",
      "double-move"
    ]);
  });

  test("provides default target rules for each effect", () => {
    expect(skillEffectTargetRule("erase-point")).toBe("empty-point");
    expect(skillEffectTargetRule("flip-stone")).toBe("stone");
    expect(skillEffectTargetRule("hidden-hand")).toBe("empty-point");
    expect(skillEffectTargetRule("voyage-star")).toBe("none");
    expect(skillEffectTargetRule("protocol-takeover")).toBe("empty-point");
    expect(skillEffectTargetRule("random-blast")).toBe("none");
    expect(skillEffectTargetRule("row-slash")).toBe("any-point");
    expect(skillEffectTargetRule("spray-stone")).toBe("stone");
    expect(skillEffectTargetRule("liberty-purge")).toBe("legal-move-point");
    expect(skillEffectTargetRule("double-move")).toBe("none");
    expect(skillEffectTargetRule("color-illusion-passive")).toBe("none");
    expect(skillEffectTargetRule("unknown")).toBe("none");
  });

  test("keeps admin option labels and validation message derived from one list", () => {
    expect(SKILL_EFFECT_OPTIONS.map((option) => option.value)).toEqual(skillEffectTypeList());
    expect(SKILL_EFFECT_OPTIONS.find((option) => option.value === "spray-stone")).toEqual({
      value: "spray-stone",
      label: "流光溢彩"
    });
    expect(skillEffectTypeMessage()).toBe("erase-point, flip-stone, hidden-hand, voyage-star, protocol-takeover, random-blast, row-slash, spray-stone, liberty-purge, double-move, or color-illusion-passive");
  });

  test("provides sound cue timing for animated board effects", () => {
    expect(skillEffectSoundCues("erase-point")).toEqual({ startAt: 0.08, impactAt: 0.48 });
    expect(skillEffectSoundCues("flip-stone")).toEqual({ startAt: 0.04, impactAt: 0.6 });
    expect(skillEffectSoundCues("random-blast")).toEqual({ startAt: 0.06, impactAt: 0.56 });
    expect(skillEffectSoundCues("protocol-takeover")).toEqual({ startAt: 0.05, impactAt: 0.5 });
    expect(skillEffectSoundCues("voyage-star")).toEqual({ startAt: 0.05, impactAt: 0.42 });
    expect(skillEffectSoundCues("row-slash")).toEqual({ startAt: 0.04, impactAt: 0.46 });
    expect(skillEffectSoundCues("spray-stone")).toEqual({ startAt: 0.04, impactAt: 0.58 });
    expect(skillEffectSoundCues("liberty-purge")).toEqual({ startAt: 0.04, impactAt: 0.5 });
    expect(skillEffectSoundCues("double-move")).toEqual({ startAt: 0.05, impactAt: 0.44 });
    expect(skillEffectSoundCues("hidden-hand")).toEqual({ startAt: 0.04, impactAt: 0.52 });
    expect(skillEffectSoundCues("color-illusion-passive")).toEqual({ startAt: 0, impactAt: 0 });
  });

  test("marks ChangLi double-move as a full-board cast effect", () => {
    expect(SKILL_EFFECT_CATALOG["double-move"].boardEffect).toBe(true);
  });

  test("marks Mornye protocol takeover as a targeted board cast effect", () => {
    expect(SKILL_EFFECT_CATALOG["protocol-takeover"].boardEffect).toBe(true);
  });

  test("marks Chisa liberty-purge as a targeted board cast effect", () => {
    expect(SKILL_EFFECT_CATALOG["liberty-purge"].boardEffect).toBe(true);
  });

  test("marks QiuYuan row-slash as a Pixi cast plus DOM row scar effect", () => {
    expect(SKILL_EFFECT_CATALOG["row-slash"].boardEffect).toBe(true);
  });
});

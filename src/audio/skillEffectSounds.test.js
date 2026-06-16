import { afterEach, describe, expect, it, vi } from "vitest";
import { playSkillEffectSound, skillEffectSoundCues } from "./skillEffectSounds.js";

describe("skill effect sounds", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps stable cue points for skill animation timelines", () => {
    expect(skillEffectSoundCues("erase-point")).toEqual({ startAt: 0.08, impactAt: 0.48 });
    expect(skillEffectSoundCues("flip-stone")).toEqual({ startAt: 0.04, impactAt: 0.6 });
    expect(skillEffectSoundCues("random-blast")).toEqual({ startAt: 0.06, impactAt: 0.56 });
    expect(skillEffectSoundCues("row-slash")).toEqual({ startAt: 0.04, impactAt: 0.46 });
    expect(skillEffectSoundCues("hidden-hand")).toEqual({ startAt: 0.04, impactAt: 0.52 });
  });

  it("does not create an audio context when sfx is muted", () => {
    const AudioContext = vi.fn();
    vi.stubGlobal("window", { AudioContext });

    playSkillEffectSound("erase-point", "start", { master: 100, sfx: 0 });

    expect(AudioContext).not.toHaveBeenCalled();
  });

  it("does nothing when browser audio APIs are unavailable", () => {
    vi.stubGlobal("window", {});

    expect(() => playSkillEffectSound("flip-stone", "impact", { master: 100, sfx: 100 })).not.toThrow();
  });
});

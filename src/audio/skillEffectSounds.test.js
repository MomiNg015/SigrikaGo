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
    expect(skillEffectSoundCues("protocol-takeover")).toEqual({ startAt: 0.05, impactAt: 0.5 });
    expect(skillEffectSoundCues("double-move")).toEqual({ startAt: 0.05, impactAt: 0.44 });
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

  it("plays Mornye protocol takeover start and impact sounds through WebAudio", () => {
    const events = [];
    class FakeAudioContext {
      constructor() {
        this.currentTime = 1;
        this.destination = {};
        this.sampleRate = 8000;
        this.state = "running";
      }

      createOscillator() {
        const oscillator = {
          type: "sine",
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn(),
          start: vi.fn((time) => events.push(["oscillator:start", oscillator.type, time])),
          stop: vi.fn()
        };
        return oscillator;
      }

      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn()
        };
      }

      createBuffer(_channels, length) {
        return {
          getChannelData: vi.fn(() => new Float32Array(length))
        };
      }

      createBufferSource() {
        return {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn((time) => events.push(["noise:start", time])),
          stop: vi.fn()
        };
      }

      createBiquadFilter() {
        return {
          type: "highpass",
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn()
        };
      }
    }
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });

    playSkillEffectSound("protocol-takeover", "start", { master: 100, sfx: 100 });
    playSkillEffectSound("protocol-takeover", "impact", { master: 100, sfx: 100 });

    expect(events.filter(([type]) => type === "oscillator:start")).toHaveLength(5);
    expect(events.filter(([type]) => type === "noise:start")).toHaveLength(2);
    expect(events.map((event) => event[0])).toContain("noise:start");
  });
});

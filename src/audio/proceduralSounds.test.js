import { afterEach, describe, expect, it, vi } from "vitest";
import { playCountdownBeep, playDoorbellSound } from "./proceduralSounds.js";

describe("procedural sounds", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing when browser audio APIs are unavailable", () => {
    expect(() => playCountdownBeep(3)).not.toThrow();
    expect(() => playDoorbellSound()).not.toThrow();
  });

  it("does not create an audio context when sfx volume is muted", () => {
    const AudioContext = vi.fn();
    vi.stubGlobal("window", { AudioContext });

    playCountdownBeep(3, { master: 100, sfx: 0 });
    playDoorbellSound({ master: 100, sfx: 0 });

    expect(AudioContext).not.toHaveBeenCalled();
  });
});

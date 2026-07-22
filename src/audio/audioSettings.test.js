import { describe, expect, it, vi } from "vitest";
import { DEFAULT_AUDIO_SETTINGS, audioVolume, loadAudioSettings } from "./audioSettings.js";

describe("audio settings", () => {
  it("uses the new-user 100 / 60 / 100 / 100 volume defaults", () => {
    expect(DEFAULT_AUDIO_SETTINGS).toEqual({
      master: 100,
      bgm: 60,
      sfx: 100,
      voice: 100,
      muted: {}
    });
  });

  it("preserves existing persisted percentages over the new-user defaults", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ master: 75, bgm: 45, sfx: 65, voice: 85 }))
    });

    expect(loadAudioSettings()).toMatchObject({ master: 75, bgm: 45, sfx: 65, voice: 85 });

    vi.unstubAllGlobals();
  });

  it("uses default settings for invalid persisted JSON", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "{broken")
    });

    expect(loadAudioSettings()).toBe(DEFAULT_AUDIO_SETTINGS);

    vi.unstubAllGlobals();
  });

  it("keeps volume finite when persisted settings contain invalid values", () => {
    expect(audioVolume({ master: "loud", bgm: "quiet" }, "bgm")).toBe(0.6);
    expect(audioVolume({ master: 80, sfx: Number.NaN }, "sfx")).toBe(0.8);
  });

  it("clamps numeric volume percentages into the playable range", () => {
    expect(audioVolume({ master: 200, voice: 200 }, "voice")).toBe(1);
    expect(audioVolume({ master: -10, voice: 80 }, "voice")).toBe(0);
  });

  it("returns zero volume when master or a channel is muted without changing percentages", () => {
    expect(audioVolume({ master: 80, bgm: 50, muted: { bgm: true } }, "bgm")).toBe(0);
    expect(audioVolume({ master: 80, bgm: 50, muted: { sfx: true } }, "bgm")).toBe(0.4);
    expect(audioVolume({ master: 80, voice: 80, muted: { master: true } }, "voice")).toBe(0);
  });
});

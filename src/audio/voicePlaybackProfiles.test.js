import { describe, expect, it } from "vitest";
import { VOICE_PLAYBACK_PROFILES, voicePlaybackOptions } from "./voicePlaybackProfiles.js";

describe("voice playback profiles", () => {
  it("keeps ordinary voices on the shared reverb path", () => {
    expect(voicePlaybackOptions()).toEqual({
      reverb: true
    });
  });

  it("keeps countdown clips dry", () => {
    expect(voicePlaybackOptions(VOICE_PLAYBACK_PROFILES.countdown)).toEqual({
      reverb: false
    });
  });
});

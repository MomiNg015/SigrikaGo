import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYSTEM_VOICE_EVENTS } from "../shared/systemVoices.js";
import { VOICE_PLAYBACK_PROFILES } from "./voicePlaybackProfiles.js";

const playbackMocks = vi.hoisted(() => ({
  playPreloadedVoiceSound: vi.fn(),
  speakText: vi.fn()
}));

vi.mock("./playback.jsx", () => playbackMocks);

import { playSystemVoice } from "./systemVoicePlayback.js";

describe("system voice playback", () => {
  beforeEach(() => {
    playbackMocks.playPreloadedVoiceSound.mockClear();
    playbackMocks.speakText.mockClear();
  });

  it("forwards the countdown playback profile to character audio", () => {
    const audioSettings = { master: 80, voice: 80 };
    playSystemVoice(SYSTEM_VOICE_EVENTS.countdown(5), {
      character: {
        id: "custom",
        systemVoices: { [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/custom-countdown-5.ogg" }
      },
      audioSettings,
      playbackProfile: VOICE_PLAYBACK_PROFILES.countdown
    });

    expect(playbackMocks.playPreloadedVoiceSound).toHaveBeenCalledWith(
      "/assets/voice/custom-countdown-5.ogg",
      audioSettings,
      { reverb: false }
    );
  });

  it("plays countdown TTS without profile-specific background handling", () => {
    const audioSettings = { master: 80, voice: 80 };
    playSystemVoice(SYSTEM_VOICE_EVENTS.countdown(4), {
      audioSettings,
      playbackProfile: VOICE_PLAYBACK_PROFILES.countdown
    });

    expect(playbackMocks.speakText).toHaveBeenCalledWith("4", audioSettings);
  });
});

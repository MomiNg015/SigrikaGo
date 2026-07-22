import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const playbackSource = readFileSync(new URL("./playback.jsx", import.meta.url), "utf8");
const duckingSource = readFileSync(new URL("./backgroundDucking.js", import.meta.url), "utf8");
const roomAudioSource = readFileSync(new URL("../room/audio/useRoomAudioEffects.js", import.meta.url), "utf8");

describe("voice and background-music independence", () => {
  it("keeps voice playback and countdown announcements out of BGM ducking", () => {
    expect(playbackSource).not.toContain("backgroundDucking");
    expect(playbackSource).not.toContain("beginVoicePlayback");
    expect(playbackSource).not.toContain("endVoicePlaybackSoon");
    expect(roomAudioSource).not.toContain("requestBackgroundMusicDuck");
    expect(roomAudioSource).not.toContain("COUNTDOWN_BACKGROUND_DUCK");
    expect(duckingSource).not.toContain("activeVoiceCount");
  });
});

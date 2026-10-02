import { describe, expect, it } from "vitest";
import { shouldSuppressRoomVoices } from "./useRoomAudioEffects.js";

describe("room voice suppression", () => {
  it("suppresses all character and TTS voices in the corrupted Sigrika duel only", () => {
    expect(shouldSuppressRoomVoices({ sigrikaCandyDuel: { botColor: "white" } })).toBe(true);
    expect(shouldSuppressRoomVoices({ sigrikaCandyDuel: null })).toBe(false);
    expect(shouldSuppressRoomVoices({})).toBe(false);
  });
});

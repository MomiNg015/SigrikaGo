import { describe, expect, it } from "vitest";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "./systemVoices.js";

describe("system voices", () => {
  it("falls back to TTS for game start before character voice assets are configured", () => {
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.gameStart)).toEqual({
      type: "tts",
      text: "对局开始"
    });
  });

  it("allows character-specific system voice assets to override TTS", () => {
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.gameStart, {
      character: {
        systemVoices: {
          [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/sigrika-game-start.ogg"
        }
      }
    })).toEqual({
      type: "audio",
      src: "/assets/voice/sigrika-game-start.ogg"
    });
  });

  it("formats byo-yomi period and countdown announcements", () => {
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriods, { params: { periods: 2 } })).toEqual({
      type: "tts",
      text: "还剩2次读秒"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiCountdown, { params: { seconds: 5 } })).toEqual({
      type: "tts",
      text: "5"
    });
  });
});

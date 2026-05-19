import { describe, expect, it } from "vitest";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "./systemVoices.js";

describe("system voices", () => {
  it("exposes explicit system voice event keys for character voice maps", () => {
    expect(SYSTEM_VOICE_EVENTS.skillCast).toBe("skill-cast");
    expect(SYSTEM_VOICE_EVENTS.byoYomiPeriod2).toBe("byo-yomi-period-2");
    expect(SYSTEM_VOICE_EVENTS.byoYomiPeriod1).toBe("byo-yomi-period-1");
    expect(SYSTEM_VOICE_EVENTS.houseDetail).toBe("house-detail");
    expect(SYSTEM_VOICE_EVENTS.countdown(10)).toBe("countdown-10");
    expect(SYSTEM_VOICE_EVENTS.countdown(1)).toBe("countdown-1");
  });

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

  it("resolves explicit countdown events as TTS seconds", () => {
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(7))).toEqual({
      type: "tts",
      text: "7"
    });
  });

  it("delegates final byo-yomi periods to explicit period events", () => {
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriods, { params: { periods: 2 } })).toEqual({
      type: "tts",
      text: "还剩2次读秒"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriods, { params: { periods: 1 } })).toEqual({
      type: "tts",
      text: "还剩1次读秒"
    });
  });
});

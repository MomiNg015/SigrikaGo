import { describe, expect, it } from "vitest";
import {
  SYSTEM_VOICE_EVENTS,
  SYSTEM_VOICE_MODE_EVENTS,
  SYSTEM_VOICE_SKILL_EVENTS,
  contraryLynaeVoiceEvent,
  resolveSystemVoice,
  resolveVoiceSource,
  voiceSourceCandidates
} from "./systemVoices.js";

describe("system voices", () => {
  it("exposes explicit system voice event keys for character voice maps", () => {
    expect(SYSTEM_VOICE_EVENTS.skillCast).toBe("skill-cast");
    expect(SYSTEM_VOICE_EVENTS.sortie).toBe("sortie");
    expect(SYSTEM_VOICE_EVENTS.byoYomiPeriod2).toBe("byo-yomi-period-2");
    expect(SYSTEM_VOICE_EVENTS.byoYomiPeriod1).toBe("byo-yomi-period-1");
    expect(SYSTEM_VOICE_EVENTS.houseDetail).toBe("house-detail");
    expect(SYSTEM_VOICE_EVENTS.countdown(10)).toBe("countdown-10");
    expect(SYSTEM_VOICE_EVENTS.countdown(1)).toBe("countdown-1");
    expect(SYSTEM_VOICE_MODE_EVENTS.gomokuGameStart).toBe("game-start:gomoku");
    expect(SYSTEM_VOICE_SKILL_EVENTS.voyageStarSkillCast).toBe("skill-cast:voyage-star");
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

  it("uses a Gomoku-specific game-start asset before the normal game-start asset", () => {
    const character = {
      systemVoices: {
        [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/changli_match_start.ogg",
        [SYSTEM_VOICE_MODE_EVENTS.gomokuGameStart]: "/assets/voice/changli_wuzi_match_start.ogg"
      }
    };

    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.gameStart, {
      character,
      params: { mode: "gomoku" }
    })).toEqual({
      type: "audio",
      src: "/assets/voice/changli_wuzi_match_start.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.gameStart, {
      character,
      params: { mode: "spark" }
    })).toEqual({
      type: "audio",
      src: "/assets/voice/changli_match_start.ogg"
    });
  });

  it("uses an effect-specific skill-cast asset before the normal skill-cast asset", () => {
    const character = {
      systemVoices: {
        [SYSTEM_VOICE_EVENTS.skillCast]: "/assets/voice/aemeath_skill_cast.ogg",
        [SYSTEM_VOICE_SKILL_EVENTS.voyageStarSkillCast]: "/assets/voice/aemeath_skill_cast_voyage.ogg"
      }
    };

    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, {
      character,
      params: { effectType: "voyage-star" }
    })).toEqual({
      type: "audio",
      src: "/assets/voice/aemeath_skill_cast_voyage.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, {
      character,
      params: { effectType: "hidden-hand" }
    })).toEqual({
      type: "audio",
      src: "/assets/voice/aemeath_skill_cast.ogg"
    });
  });

  it("normalizes and randomly resolves character voice source candidates", () => {
    expect(voiceSourceCandidates(["/assets/voice/a.ogg", "", null, " /assets/voice/b.ogg "])).toEqual([
      "/assets/voice/a.ogg",
      "/assets/voice/b.ogg"
    ]);
    expect(resolveVoiceSource(["/assets/voice/a.ogg", "/assets/voice/b.ogg"], () => 0)).toBe("/assets/voice/a.ogg");
    expect(resolveVoiceSource(["/assets/voice/a.ogg", "/assets/voice/b.ogg"], () => 0.99)).toBe("/assets/voice/b.ogg");
  });

  it("randomly resolves character-specific system voice asset candidates", () => {
    const character = {
      systemVoices: {
        [SYSTEM_VOICE_EVENTS.skillCast]: [
          "/assets/voice/qiuyuan_skill_cast.ogg",
          "/assets/voice/qiuyuan_skill_cast_1.ogg"
        ]
      }
    };
    const originalRandom = Math.random;
    Math.random = () => 0.99;
    try {
      expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character })).toEqual({
        type: "audio",
        src: "/assets/voice/qiuyuan_skill_cast_1.ogg"
      });
    } finally {
      Math.random = originalRandom;
    }
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

  it("does not resolve timeout to a character audio asset or TTS text", () => {
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.timeout, {
      character: {
        systemVoices: {
          [SYSTEM_VOICE_EVENTS.timeout]: "/assets/voice/timeout.ogg"
        }
      }
    })).toEqual({
      type: "tts",
      text: ""
    });
  });

  it("resolves explicit countdown events as TTS seconds", () => {
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(7))).toEqual({
      type: "tts",
      text: "7"
    });
  });

  it("returns empty TTS text for malformed countdown announcements", () => {
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiCountdown)).toEqual({
      type: "tts",
      text: ""
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiCountdown, { params: { seconds: "5" } })).toEqual({
      type: "tts",
      text: ""
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(0))).toEqual({
      type: "tts",
      text: ""
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(11))).toEqual({
      type: "tts",
      text: ""
    });
  });

  it("rejects character audio overrides for invalid countdown announcements", () => {
    const character = {
      systemVoices: {
        [SYSTEM_VOICE_EVENTS.byoYomiCountdown]: "/assets/voice/bad-countdown.ogg",
        [SYSTEM_VOICE_EVENTS.countdown(11)]: "/assets/voice/countdown-11.ogg",
        "countdown-01": "/assets/voice/countdown-01.ogg",
        "countdown-0001": "/assets/voice/countdown-0001.ogg"
      }
    };

    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiCountdown, { character })).toEqual({
      type: "tts",
      text: ""
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(11), { character })).toEqual({
      type: "tts",
      text: ""
    });
    expect(resolveSystemVoice("countdown-01", { character })).toEqual({
      type: "tts",
      text: ""
    });
    expect(resolveSystemVoice("countdown-0001", { character })).toEqual({
      type: "tts",
      text: ""
    });
  });

  it("keeps character audio overrides for valid countdown announcements", () => {
    const character = {
      systemVoices: {
        [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/countdown-10.ogg",
        [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/countdown-1.ogg"
      }
    };

    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(10), { character })).toEqual({
      type: "audio",
      src: "/assets/voice/countdown-10.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(1), { character })).toEqual({
      type: "audio",
      src: "/assets/voice/countdown-1.ogg"
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

  it("deterministically swaps Lynae's voice lines while the contrary effect is active", () => {
    const character = {
      id: "lynae",
      itemEffects: { lynaeContraryVoice: true },
      systemVoices: {
        [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/lynae_match_start.ogg",
        [SYSTEM_VOICE_EVENTS.skillCast]: "/assets/voice/lynae_skill_cast.ogg",
        [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/lynae_sortie.ogg",
        [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/lynae_byoyomi_start.ogg",
        [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/lynae_byoyomi_remaining_2.ogg",
        [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/lynae_byoyomi_remaining_1.ogg",
        [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/lynae_countdown_10.ogg",
        [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/lynae_countdown_1.ogg",
        [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/lynae_result_win.ogg",
        [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/lynae_result_loss.ogg",
        [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/lynae_result_draw.ogg"
      }
    };

    for (const [left, right] of [
      [SYSTEM_VOICE_EVENTS.gameStart, SYSTEM_VOICE_EVENTS.byoYomiStart],
      [SYSTEM_VOICE_EVENTS.sortie, SYSTEM_VOICE_EVENTS.skillCast],
      [SYSTEM_VOICE_EVENTS.byoYomiPeriod2, SYSTEM_VOICE_EVENTS.byoYomiPeriod1],
      [SYSTEM_VOICE_EVENTS.resultVictory, SYSTEM_VOICE_EVENTS.resultDefeat]
    ]) {
      expect(contraryLynaeVoiceEvent(left, { character })).toBe(right);
      expect(contraryLynaeVoiceEvent(right, { character })).toBe(left);
    }
    for (let seconds = 1; seconds <= 10; seconds += 1) {
      expect(contraryLynaeVoiceEvent(SYSTEM_VOICE_EVENTS.countdown(seconds), { character }))
        .toBe(SYSTEM_VOICE_EVENTS.countdown(11 - seconds));
    }
    expect(contraryLynaeVoiceEvent(SYSTEM_VOICE_EVENTS.resultDraw, { character }))
      .toBe(SYSTEM_VOICE_EVENTS.resultDraw);

    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.gameStart, { character })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_byoyomi_start.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.sortie, { character })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_skill_cast.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_sortie.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriods, {
      character,
      params: { periods: 2 }
    })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_byoyomi_remaining_1.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(10), { character })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_countdown_1.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(1), { character })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_countdown_10.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.resultVictory, { character })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_result_loss.ogg"
    });
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.resultDraw, { character })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_result_draw.ogg"
    });
  });

  it("keeps Lynae's ordinary voice mapping when the contrary effect is absent", () => {
    const character = {
      id: "lynae",
      itemEffects: {},
      systemVoices: {
        [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/lynae_countdown_10.ogg"
      }
    };

    expect(contraryLynaeVoiceEvent(SYSTEM_VOICE_EVENTS.countdown(10), { character }))
      .toBe(SYSTEM_VOICE_EVENTS.countdown(10));
    expect(resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(10), { character })).toEqual({
      type: "audio",
      src: "/assets/voice/lynae_countdown_10.ogg"
    });
  });
});

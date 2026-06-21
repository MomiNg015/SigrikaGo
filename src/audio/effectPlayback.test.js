import { afterEach, describe, expect, it, vi } from "vitest";
import { BOARD_SOUND_TYPES } from "../shared/boardAudio.js";
import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  playBoardSound,
  playEffectSound,
  playRecruitmentResultSound,
  playUiRecruitmentOpenSound,
  RECRUITMENT_MISS_SOUND,
  RECRUITMENT_SUCCESS_SOUND,
  STONE_SOUND,
  UI_CLOSE_WINDOW_SOUND,
  UI_CONFIRM_SOUND,
  UI_DETAIL_OPEN_SOUND,
  UI_HOUSE_OPEN_SOUND,
  UI_MATCH_OPEN_SOUND,
  UI_RECRUITMENT_OPEN_SOUND,
  UI_SHOP_OPEN_SOUND,
  UI_UNAVAILABLE_SHAKE_MS,
  UI_UNAVAILABLE_SOUND
} from "./effectPlayback.js";

describe("effect playback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no-ops when browser audio APIs are unavailable", () => {
    expect(() => playEffectSound("/assets/music/missing.ogg")).not.toThrow();
  });

  it("routes board sound actions to their effect assets", () => {
    const played = [];
    class FakeAudio {
      constructor(src) {
        this.src = src;
        this.play = vi.fn(() => Promise.resolve());
        played.push(this);
      }
    }
    vi.stubGlobal("Audio", FakeAudio);

    playBoardSound({ sound: BOARD_SOUND_TYPES.stone });
    playBoardSound({ sound: BOARD_SOUND_TYPES.capture });
    playBoardSound({ sound: BOARD_SOUND_TYPES.hiddenReveal });

    expect(played.map((audio) => audio.src)).toEqual([
      STONE_SOUND,
      CAPTURE_SOUND,
      HIDDEN_HAND_REVEAL_SOUND
    ]);
  });

  it("exposes stable UI interaction effect assets", () => {
    expect(UI_CONFIRM_SOUND).toBe("/assets/music/ui_confirm.ogg");
    expect(UI_CLOSE_WINDOW_SOUND).toBe("/assets/music/ui_close_window.ogg");
    expect(UI_DETAIL_OPEN_SOUND).toBe("/assets/music/ui_detail_open.ogg");
    expect(UI_HOUSE_OPEN_SOUND).toBe("/assets/music/ui_house_open.ogg");
    expect(UI_MATCH_OPEN_SOUND).toBe("/assets/music/ui_match_open.ogg");
    expect(UI_RECRUITMENT_OPEN_SOUND).toBe("/assets/music/recruitment-open.ogg");
    expect(UI_SHOP_OPEN_SOUND).toBe("/assets/music/ui_shop_open.ogg");
    expect(UI_UNAVAILABLE_SOUND).toBe("/assets/music/ui_unavailable.ogg");
    expect(UI_UNAVAILABLE_SHAKE_MS).toBe(1063);
  });

  it("routes recruitment interaction sounds to converted effect assets", () => {
    const played = [];
    class FakeAudio {
      constructor(src) {
        this.src = src;
        this.play = vi.fn(() => Promise.resolve());
        played.push(this);
      }
    }
    vi.stubGlobal("Audio", FakeAudio);

    expect(RECRUITMENT_SUCCESS_SOUND).toBe("/assets/music/recruitment-success.ogg");
    expect(RECRUITMENT_MISS_SOUND).toBe("/assets/music/recruitment-miss.ogg");

    playUiRecruitmentOpenSound();
    playRecruitmentResultSound("success");
    playRecruitmentResultSound("miss");

    expect(played.map((audio) => audio.src)).toEqual([
      UI_RECRUITMENT_OPEN_SOUND,
      RECRUITMENT_SUCCESS_SOUND,
      RECRUITMENT_MISS_SOUND
    ]);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { BOARD_SOUND_TYPES } from "../shared/boardAudio.js";
import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  playBoardSound,
  playEffectSound,
  STONE_SOUND
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
});

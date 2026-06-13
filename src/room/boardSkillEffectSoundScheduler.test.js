import { describe, expect, test, vi } from "vitest";
import {
  clearBoardSkillEffectSoundTimers,
  scheduleBoardSkillEffectSounds
} from "./boardSkillEffectSoundScheduler.js";

describe("boardSkillEffectSoundScheduler", () => {
  test("schedules start and impact cues from the catalog timeline", () => {
    const timerIds = [11, 12];
    const setTimeoutFn = vi.fn((callback) => {
      callback();
      return timerIds[setTimeoutFn.mock.calls.length - 1];
    });
    const playSound = vi.fn();
    const audioSettings = { master: 80, sfx: 60 };

    const scheduled = scheduleBoardSkillEffectSounds({
      pendingSkill: { effectType: "erase-point" },
      durationMs: 2000,
      reducedMotion: false,
      audioSettings,
      setTimeoutFn,
      playSound
    });

    expect(scheduled).toEqual(timerIds);
    expect(setTimeoutFn).toHaveBeenNthCalledWith(1, expect.any(Function), 160);
    expect(setTimeoutFn).toHaveBeenNthCalledWith(2, expect.any(Function), 960);
    expect(playSound).toHaveBeenNthCalledWith(1, "erase-point", "start", audioSettings);
    expect(playSound).toHaveBeenNthCalledWith(2, "erase-point", "impact", audioSettings);
  });

  test("does not schedule SFX for reduced-motion board effects", () => {
    const setTimeoutFn = vi.fn();
    const playSound = vi.fn();

    const scheduled = scheduleBoardSkillEffectSounds({
      pendingSkill: { effectType: "random-blast" },
      durationMs: 1800,
      reducedMotion: true,
      setTimeoutFn,
      playSound
    });

    expect(scheduled).toEqual([]);
    expect(setTimeoutFn).not.toHaveBeenCalled();
    expect(playSound).not.toHaveBeenCalled();
  });

  test("clears scheduled SFX timers", () => {
    const clearTimeoutFn = vi.fn();

    clearBoardSkillEffectSoundTimers([21, 22], clearTimeoutFn);

    expect(clearTimeoutFn).toHaveBeenNthCalledWith(1, 21);
    expect(clearTimeoutFn).toHaveBeenNthCalledWith(2, 22);
  });
});

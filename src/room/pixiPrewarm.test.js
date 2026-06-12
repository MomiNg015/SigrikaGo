import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  loadPixiModule,
  resetPixiPrewarmForTests,
  schedulePixiPrewarm
} from "./pixiPrewarm.js";

describe("pixiPrewarm", () => {
  beforeEach(() => {
    resetPixiPrewarmForTests();
  });

  test("does not schedule Pixi loading when disabled", () => {
    const scheduleIdle = vi.fn();
    const importPixi = vi.fn();

    schedulePixiPrewarm({ enabled: false, scheduleIdle, importPixi });

    expect(scheduleIdle).not.toHaveBeenCalled();
    expect(importPixi).not.toHaveBeenCalled();
  });

  test("schedules idle Pixi loading and can cancel before the idle callback runs", () => {
    let idleCallback = null;
    const scheduleIdle = vi.fn((callback) => {
      idleCallback = callback;
      return vi.fn();
    });
    const importPixi = vi.fn(() => Promise.resolve({ Application: function Application() {} }));

    const cancel = schedulePixiPrewarm({ enabled: true, scheduleIdle, importPixi });
    cancel();
    idleCallback();

    expect(scheduleIdle).toHaveBeenCalledOnce();
    expect(importPixi).not.toHaveBeenCalled();
  });

  test("shares one Pixi import between idle prewarm and effect playback", async () => {
    let idleCallback = null;
    const pixiModule = { Application: function Application() {} };
    const importPixi = vi.fn(() => Promise.resolve(pixiModule));
    const scheduleIdle = vi.fn((callback) => {
      idleCallback = callback;
      return () => {};
    });

    schedulePixiPrewarm({ enabled: true, scheduleIdle, importPixi });
    idleCallback();
    const loaded = await loadPixiModule(importPixi);

    expect(loaded).toBe(pixiModule);
    expect(importPixi).toHaveBeenCalledOnce();
  });

  test("swallows idle prewarm failures and allows live playback to retry", async () => {
    let idleCallback = null;
    const pixiModule = { Application: function Application() {} };
    const importPixi = vi
      .fn()
      .mockRejectedValueOnce(new Error("load failed"))
      .mockResolvedValueOnce(pixiModule);
    const scheduleIdle = vi.fn((callback) => {
      idleCallback = callback;
      return () => {};
    });

    schedulePixiPrewarm({ enabled: true, scheduleIdle, importPixi });
    idleCallback();
    await Promise.resolve();

    await expect(loadPixiModule(importPixi)).resolves.toBe(pixiModule);
    expect(importPixi).toHaveBeenCalledTimes(2);
  });
});

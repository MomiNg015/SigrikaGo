import { expect, it, vi } from "vitest";
import { unlockAudioContextOnInteraction } from "./audioRuntime.js";
it("unlocks a preloaded context on user input and removes listeners once ready", async () => {
  const target = new EventTarget();
  const remove = vi.spyOn(target, "removeEventListener");
  const context = { state: "suspended", resume: vi.fn(async () => { context.state = "running"; }) };
  unlockAudioContextOnInteraction(context, target);
  target.dispatchEvent(new Event("pointerdown"));
  await Promise.resolve();
  expect(context.resume).toHaveBeenCalledOnce();
  expect(remove).toHaveBeenCalledTimes(3);
  target.dispatchEvent(new Event("keydown"));
  expect(context.resume).toHaveBeenCalledOnce();
});

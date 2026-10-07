import { describe, expect, it, vi } from "vitest";
import { backgroundFocusDestination, backgroundWindowFocused, requestBackgroundFocus, setBackgroundFocus, subscribeBackgroundFocus } from "./backgroundFocus.js";

function param(value) {
  return { value, cancelAndHoldAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
}

describe("window BGM focus", () => {
  it("keeps focus until the last window closes and releases each owner once", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeBackgroundFocus(callback);
    const closeOuter = requestBackgroundFocus();
    const closeInner = requestBackgroundFocus();
    closeInner();
    closeInner();
    expect(backgroundWindowFocused()).toBe(true);
    closeOuter();
    expect(backgroundWindowFocused()).toBe(false);
    expect(callback.mock.calls.map(([value]) => value)).toEqual([false, true, true, true, false]);
    unsubscribe();
  });

  it("shares the BGM filter bus across tracks and smoothly restores clarity", () => {
    const filter = { frequency: param(20000), Q: { value: 1 }, connect: vi.fn() };
    const gain = { gain: param(1), connect: vi.fn() };
    const context = { sampleRate: 48000, currentTime: 4, destination: {}, createBiquadFilter: vi.fn(() => filter), createGain: vi.fn(() => gain) };
    const state = { context };
    setBackgroundFocus(state, true);
    expect(backgroundFocusDestination(state, context)).toBe(filter);
    expect(filter.frequency.value).toBe(900);
    expect(gain.gain.value).toBe(0.72);
    expect(filter.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(context.destination);
    setBackgroundFocus(state, false);
    expect(filter.frequency.exponentialRampToValueAtTime).toHaveBeenLastCalledWith(20000, 4.5);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenLastCalledWith(1, 4.5);
    setBackgroundFocus(state, true);
    expect(filter.frequency.exponentialRampToValueAtTime).toHaveBeenLastCalledWith(900, 4.5);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenLastCalledWith(0.72, 4.5);
    backgroundFocusDestination(state, context);
    expect(context.createBiquadFilter).toHaveBeenCalledOnce();
  });
});

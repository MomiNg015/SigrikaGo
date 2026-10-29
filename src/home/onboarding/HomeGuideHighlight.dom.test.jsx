// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HomeGuideHighlight from "./HomeGuideHighlight.jsx";
import { copyGuidePaint } from "./copyGuidePaint.js";

vi.mock("./copyGuidePaint.js", () => ({ copyGuidePaint: vi.fn(target => ({
  clone: target.cloneNode(true), styles: document.createElement('style'), syncScroll: vi.fn()
})) }));
let frames, observers, sequence;
beforeEach(() => {
  frames = new Map(); observers = []; sequence = 0;
  const Observer = class { constructor(callback) { this.callback = callback; this.disconnect = vi.fn(); observers.push(this); } observe() {} };
  vi.stubGlobal('MutationObserver', Observer); vi.stubGlobal('ResizeObserver', Observer);
  vi.stubGlobal('requestAnimationFrame', callback => { frames.set(++sequence, callback); return sequence; });
  vi.stubGlobal('cancelAnimationFrame', id => frames.delete(id));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 20, top: 30, width: 100, height: 80 });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const tick = () => act(() => { const current = [...frames.values()]; frames.clear(); current.forEach(callback => callback()); });
it('reuses paint on position-only frames and disposes observers and frames on unmount', () => {
  const target = document.createElement('section'); document.body.append(target);
  const { container, unmount } = render(<HomeGuideHighlight target={target} selector=".target"/>);
  const paint = container.querySelector('[aria-hidden="true"]');
  expect(paint.hasAttribute('inert')).toBe(true);
  expect(copyGuidePaint).toHaveBeenCalledTimes(1);
  tick(); tick();
  expect(copyGuidePaint).toHaveBeenCalledTimes(1);
  act(() => observers[1].callback()); tick();
  expect(copyGuidePaint).toHaveBeenCalledTimes(1);
  Object.defineProperty(target, 'offsetWidth', { value: 120, configurable: true });
  act(() => observers[1].callback()); tick();
  expect(copyGuidePaint).toHaveBeenCalledTimes(2);
  act(() => observers[0].callback()); tick();
  expect(copyGuidePaint).toHaveBeenCalledTimes(3);
  unmount();
  expect(frames.size).toBe(0);
  expect(observers.every(observer => observer.disconnect.mock.calls.length === 1)).toBe(true);
  target.remove();
});
it('replaces paint when the source changes and clears removed targets', () => {
  const first = document.createElement('section'), second = document.createElement('section');
  first.textContent = 'first'; second.textContent = 'second'; document.body.append(first, second);
  const { container, rerender } = render(<HomeGuideHighlight target={first} selector=".first"/>);
  rerender(<HomeGuideHighlight target={second} selector=".second"/>);
  expect(container.textContent).toBe('second');
  second.remove(); tick();
  expect(container.textContent).toBe('');
  first.remove();
});

it('does not recopy a window when its tracked root entry animation finishes', async () => {
  const target = document.createElement('section'); document.body.append(target);
  let finish;
  const finished = new Promise(resolve => { finish = resolve; });
  target.getAnimations = () => [{ playState: 'running', finished, effect: {
    target, getComputedTiming: () => ({ endTime: 260 }), getKeyframes: () => [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }]
  } }];
  const { unmount } = render(<HomeGuideHighlight target={target} selector=".target"/>);
  await act(async () => finish()); tick();
  expect(copyGuidePaint).toHaveBeenCalledTimes(1);
  unmount(); target.remove();
});

it('refreshes descendant entry paint once, even if content changed during entry', async () => {
  const target = document.createElement('section'), child = document.createElement('div'); target.append(child); document.body.append(target);
  let finish;
  const animation = { playState: 'running', finished: new Promise(resolve => { finish = resolve; }), effect: {
    target: child, getComputedTiming: () => ({ endTime: 260 })
  } };
  target.getAnimations = () => [animation];
  const { unmount } = render(<HomeGuideHighlight target={target} selector=".target"/>);
  act(() => observers[0].callback()); tick();
  expect(copyGuidePaint).toHaveBeenCalledTimes(2);
  animation.playState = 'finished';
  await act(async () => finish()); tick(); tick();
  expect(copyGuidePaint).toHaveBeenCalledTimes(3);
  unmount(); target.remove();
});

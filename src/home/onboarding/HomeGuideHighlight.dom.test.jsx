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
  act(() => observers[0].callback()); tick();
  expect(copyGuidePaint).toHaveBeenCalledTimes(2);
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

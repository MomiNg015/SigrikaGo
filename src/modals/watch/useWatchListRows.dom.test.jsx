// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useWatchListRows } from "./useWatchListRows.js";

let resize, mutate, frames, frameId;
const disconnectResize = vi.fn(), disconnectMutation = vi.fn();
beforeEach(() => {
  frames = new Map(); frameId = 0;
  vi.stubGlobal("requestAnimationFrame", vi.fn(callback => { frames.set(++frameId, callback); return frameId; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn(id => frames.delete(id)));
  vi.stubGlobal("ResizeObserver", class { constructor(callback) { resize = callback; } observe() {} disconnect = disconnectResize; });
  vi.stubGlobal("MutationObserver", class { constructor(callback) { mutate = callback; } observe() {} disconnect = disconnectMutation; });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); });
function flush() { const work = [...frames.values()]; frames.clear(); work.forEach(callback => callback()); }
function List({ empty = false, enabled = true }) {
  const ref = useWatchListRows();
  return <div ref={ref} data-testid="list" style={{ padding: "3px 8px 10px 4px", "--wl-row-min": enabled ? "100px" : undefined }}>
    {!empty && <table><thead/><tbody style={{ rowGap:"10px", paddingTop:"0px" }}><tr className="wl-row"><td>玩家</td></tr></tbody></table>}
  </div>;
}
function dimensions(list, height, naturalHeight = 100) {
  Object.defineProperty(list, "clientHeight", { value:height, configurable:true });
  vi.spyOn(list.querySelector("thead"), "getBoundingClientRect").mockReturnValue({ height:30 });
  vi.spyOn(list.querySelector(".wl-row"), "getBoundingClientRect").mockReturnValue({ height:naturalHeight });
}

it("refits after resize and wrapped content changes, clears empty geometry and disconnects", () => {
  const { getByTestId, rerender, unmount } = render(<List/>);
  const list = getByTestId("list");
  flush();
  expect(list.style.getPropertyValue("--wl-row-height")).toBe("");
  dimensions(list, 393);
  resize(); flush();
  expect(list.style.getPropertyValue("--wl-row-height")).toBe("110px");
  expect(list.style.getPropertyValue("--wl-scroll-start")).toBe("33px");
  dimensions(list, 393, 180);
  mutate(); flush();
  expect(list.style.getPropertyValue("--wl-row-height")).toBe("350px");
  dimensions(list, 593, 180);
  resize(); flush();
  expect(parseFloat(list.style.getPropertyValue("--wl-row-height"))).toBeGreaterThanOrEqual(180);
  rerender(<List empty/>); mutate(); flush();
  expect(list.style.getPropertyValue("--wl-row-height")).toBe("");
  expect(list.style.getPropertyValue("--wl-scroll-start")).toBe("");
  resize(); unmount();
  expect(disconnectResize).toHaveBeenCalledOnce();
  expect(disconnectMutation).toHaveBeenCalledOnce();
  expect(frames.size).toBe(0);
});

it("supports window resize without ResizeObserver and ignores themes without row tokens", () => {
  vi.stubGlobal("ResizeObserver", undefined);
  const { getByTestId, rerender } = render(<List enabled={false}/>);
  const list = getByTestId("list");
  dimensions(list, 393);
  flush();
  expect(list.style.getPropertyValue("--wl-row-height")).toBe("");
  rerender(<List/>);
  window.dispatchEvent(new Event("resize")); flush();
  expect(list.style.getPropertyValue("--wl-row-height")).toBe("110px");
});

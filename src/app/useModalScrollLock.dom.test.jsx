// @vitest-environment jsdom
import { StrictMode, useRef } from "react";
import { createPortal } from "react-dom";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useModalScrollLock } from "./useModalScrollLock.js";

let media;
let changeMedia;
beforeEach(() => {
  media = { matches: true, addEventListener: vi.fn((_, listener) => { changeMedia = listener; }), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
});
afterEach(() => {
  cleanup();
  document.body.removeAttribute("style");
  document.documentElement.removeAttribute("style");
  vi.unstubAllGlobals();
});

function Harness({ open = true, nested = false, portal = false }) {
  const shellRef = useRef(null);
  useModalScrollLock(shellRef);
  const dialog = <div className="nested-modal-backdrop" data-testid="nested"><h2>详情</h2></div>;
  return <div ref={shellRef} data-testid="shell">
    <main data-testid="home" style={{ overflowY: "auto" }}>
      <p>背景</p>
      {open && <div className="modal-backdrop" data-testid="backdrop">
        <h2>窗口</h2>
        <div data-testid="list" style={{ overflowY: "auto" }}><p data-testid="content">内容</p>{nested && !portal && dialog}</div>
        <div data-testid="tabs" style={{ overflowX: "auto" }}>标签</div>
        <input type="range" aria-label="音量" />
      </div>}
    </main>
    {nested && portal && shellRef.current && createPortal(dialog, shellRef.current)}
  </div>;
}
const flush = () => act(async () => {});
function size(element, { height = 300, viewport = 100, top = 0, width = 100, clientWidth = 100 } = {}) {
  Object.defineProperties(element, {
    scrollHeight: { configurable: true, value: height }, clientHeight: { configurable: true, value: viewport },
    scrollWidth: { configurable: true, value: width }, clientWidth: { configurable: true, value: clientWidth }
  });
  element.scrollTop = top;
}
function touch(target, x, y, type = "touchmove", count = 1) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", { value: Array.from({ length: count }, (_, identifier) => ({ identifier, clientX: x, clientY: y })) });
  target.dispatchEvent(event);
  return event;
}
function swipe(target, deltaY, deltaX = 0) {
  touch(target, 100, 100, "touchstart");
  return touch(target, 100 - deltaX, 100 - deltaY);
}

describe("mobile modal scroll ownership", () => {
  it("locks document and actual ancestor scrollers, restores inline priorities and scroll position", async () => {
    document.body.style.setProperty("overflow-y", "scroll", "important");
    const { rerender } = render(<Harness open={false} />);
    const home = screen.getByTestId("home");
    home.scrollTop = 123;
    rerender(<Harness />);
    await flush();
    for (const element of [document.body, document.documentElement, screen.getByTestId("shell"), home]) {
      expect(element.style.overflowY).toBe("hidden");
    }
    expect(home.scrollTop).toBe(123);
    rerender(<Harness open={false} />);
    await flush();
    expect(home.style.overflowY).toBe("auto");
    expect(home.scrollTop).toBe(123);
    expect(document.body.style.overflowY).toBe("scroll");
    expect(document.body.style.getPropertyPriority("overflow-y")).toBe("important");
    expect(document.documentElement.style.overflowY).toBe("");
    expect(swipe(home, 30).defaultPrevented).toBe(false);
  });

  it("allows internal movement but blocks empty surfaces, background, and both list boundaries", () => {
    render(<Harness />);
    const list = screen.getByTestId("list");
    const content = screen.getByTestId("content");
    size(list);
    expect(swipe(content, 40).defaultPrevented).toBe(false);
    expect(swipe(content, -40).defaultPrevented).toBe(true);
    list.scrollTop = 200;
    expect(swipe(content, 40).defaultPrevented).toBe(true);
    expect(swipe(content, -40).defaultPrevented).toBe(false);
    expect(swipe(screen.getByText("窗口"), 40).defaultPrevented).toBe(true);
    expect(swipe(screen.getByTestId("backdrop"), -40).defaultPrevented).toBe(true);
    expect(swipe(screen.getByText("背景"), 40).defaultPrevented).toBe(true);
    size(list, { height: 100 });
    expect(swipe(content, 40).defaultPrevented).toBe(true);
  });

  it.each([false, true])("keeps the background locked while nested windows remain (portal=%s)", async (portal) => {
    const { rerender } = render(<Harness />);
    size(screen.getByTestId("list"));
    rerender(<Harness nested portal={portal} />);
    await flush();
    expect(swipe(screen.getByText("详情"), 50).defaultPrevented).toBe(true);
    if (!portal) expect(screen.getByTestId("list").style.overflowY).toBe("hidden");
    rerender(<Harness />);
    await flush();
    expect(document.body.style.overflowY).toBe("hidden");
    expect(screen.getByTestId("list").style.overflowY).toBe("auto");
    expect(swipe(screen.getByTestId("content"), 50).defaultPrevented).toBe(false);
    rerender(<Harness open={false} nested portal />);
    await flush();
    expect(document.body.style.overflowY).toBe("hidden");
    rerender(<Harness open={false} />);
    await flush();
    expect(document.body.style.overflowY).toBe("");
  });

  it("allows horizontal lists, range dragging and pinch zoom", () => {
    render(<Harness />);
    const tabs = screen.getByTestId("tabs");
    size(tabs, { width: 400 });
    expect(swipe(tabs, 0, 40).defaultPrevented).toBe(false);
    expect(swipe(screen.getByRole("slider"), 0, 40).defaultPrevented).toBe(false);
    touch(tabs, 100, 100, "touchstart");
    expect(touch(tabs, 100, 80, "touchmove", 2).defaultPrevented).toBe(false);
  });

  it("allows an over-height backdrop to scroll without escaping its boundary", () => {
    render(<Harness />);
    const backdrop = screen.getByTestId("backdrop");
    backdrop.style.overflowY = "auto";
    size(backdrop);
    expect(swipe(screen.getByText("窗口"), 40).defaultPrevented).toBe(false);
    backdrop.scrollTop = 200;
    expect(swipe(screen.getByText("窗口"), 40).defaultPrevented).toBe(true);
    expect(swipe(screen.getByText("窗口"), -40).defaultPrevented).toBe(false);
  });

  it("blocks wheel chaining without consuming pinch-wheel zoom", () => {
    render(<Harness />);
    const dispatch = (ctrlKey) => {
      const event = new WheelEvent("wheel", { deltaY: 40, ctrlKey, bubbles: true, cancelable: true });
      screen.getByTestId("backdrop").dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(dispatch(false)).toBe(true);
    expect(dispatch(true)).toBe(false);
  });

  it("responds to mobile media changes and cleans up under Strict Mode", () => {
    media.matches = false;
    const { unmount } = render(<StrictMode><Harness /></StrictMode>);
    expect(document.body.style.overflowY).toBe("");
    expect(swipe(screen.getByText("窗口"), 40).defaultPrevented).toBe(false);
    act(() => { media.matches = true; changeMedia(); });
    expect(document.body.style.overflowY).toBe("hidden");
    act(() => { media.matches = false; changeMedia(); });
    expect(document.body.style.overflowY).toBe("");
    act(() => { media.matches = true; changeMedia(); });
    unmount();
    expect(document.body.style.overflowY).toBe("");
    expect(media.removeEventListener).toHaveBeenCalled();
  });
});

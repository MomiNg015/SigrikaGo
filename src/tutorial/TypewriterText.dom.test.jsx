// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TypewriterText } from "./TypewriterText.jsx";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("TypewriterText", () => {
  it("reveals the full current line immediately when requested", () => {
    const view = render(<TypewriterText text="还在打字的教学台词" />);
    expect(view.container.textContent).not.toBe("还在打字的教学台词");

    view.rerender(<TypewriterText revealAll text="还在打字的教学台词" />);
    expect(view.container.textContent).toBe("还在打字的教学台词");
  });

  it("reports completion only after the entire current text is rendered", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const view = render(<TypewriterText text="继续" onComplete={onComplete} />);
    await act(async () => vi.advanceTimersByTime(80));
    expect(view.container.textContent).toBe("继");
    expect(onComplete).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(28));
    expect(view.container.textContent).toBe("继续");
    expect(onComplete).toHaveBeenCalledTimes(1);
    view.rerender(<TypewriterText text="继续" onComplete={() => onComplete()} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
    view.rerender(<TypewriterText text="新的对话" onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
    await act(async () => vi.runAllTimers());
    expect(view.container.textContent).toBe("新的对话");
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("reports a manually revealed line once and cancels unfinished lines on unmount", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const view = render(<TypewriterText text="还在打字" onComplete={onComplete} />);
    view.rerender(<TypewriterText text="还在打字" revealAll onComplete={onComplete} />);
    expect(view.container.textContent).toBe("还在打字");
    expect(onComplete).toHaveBeenCalledTimes(1);
    await act(async () => vi.runAllTimers());
    expect(onComplete).toHaveBeenCalledTimes(1);
    view.rerender(<TypewriterText text="下一句不能提前完成" onComplete={onComplete} />);
    view.unmount();
    await act(async () => vi.runAllTimers());
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("reports reduced-motion text on its first complete render", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const onComplete = vi.fn();
    const view = render(<TypewriterText text="完整出现" onComplete={onComplete} />);
    expect(view.container.textContent).toBe("完整出现");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

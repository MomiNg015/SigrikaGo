// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import LoginAssetPreloadScreen from "./LoginAssetPreloadScreen.jsx";

afterEach(() => { cleanup(); vi.useRealTimers(); });

test("shows Sigrika reading above the progress bar and brush tip", () => {
  const props = { tipsText: "Tip：保留文字" };
  const { container, rerender } = render(<LoginAssetPreloadScreen {...props} progress={0.65} />);
  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("65");
  expect(container.querySelector(".preload-illustration").getAttribute("src")).toBe("/assets/preload/sigrika-page-turn.webp");
  expect(container.querySelector(".preload-character")).toBeNull();
  expect(container.querySelector(".preload-title")).toBeNull();
  expect(container.querySelector(".preload-progress-track")).not.toBeNull();
  const tip = container.querySelector(".login-loading-tip");
  const note = screen.getByText("（第一次加载需要2-3分钟，请耐心等待）");
  expect(bar.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(note.compareDocumentPosition(tip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(bar.compareDocumentPosition(tip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(tip.textContent).toBe("Tip：保留文字");
  expect(container.querySelector(".login-loading-art")).toBeNull();
  rerender(<LoginAssetPreloadScreen {...props} progress={1.5} />);
  expect(bar.getAttribute("aria-valuenow")).toBe("100");
  rerender(<LoginAssetPreloadScreen {...props} progress={NaN} />);
  expect(bar.getAttribute("aria-valuenow")).toBe("0");
});

test("rotates tips without replacing the playing illustration", () => {
  vi.useFakeTimers();
  const { container } = render(<LoginAssetPreloadScreen progress={0.5} tipsText={"第一条\n第二条"} />);
  const illustration = container.querySelector(".preload-illustration");
  const firstTip = container.querySelector(".login-loading-tip-copy").textContent;
  act(() => vi.advanceTimersByTime(10000));
  expect(container.querySelector(".preload-illustration")).toBe(illustration);
  expect(container.querySelector(".login-loading-tip-copy").textContent).not.toBe(firstTip);
});

// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import LoginAssetPreloadScreen from "./LoginAssetPreloadScreen.jsx";

afterEach(() => { cleanup(); vi.useRealTimers(); });

test("restores the character and progress bar with brush tips below it", () => {
  const characters = { custom: { id: "custom", name: "测试角色", portrait: "/custom.png" } };
  const props = { characters, loadingLinesText: "custom=测试角色正在加载", tipsText: "Tip：保留文字" };
  const { container, rerender } = render(<LoginAssetPreloadScreen {...props} progress={0.65} />);
  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("65");
  expect(screen.getByAltText("测试角色").getAttribute("src")).toBe("/custom.png");
  expect(screen.getByText("测试角色正在加载")).toBeTruthy();
  expect(container.querySelector(".preload-progress-track")).not.toBeNull();
  const tip = container.querySelector(".login-loading-tip");
  expect(bar.compareDocumentPosition(tip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(tip.textContent).toBe("Tip：保留文字");
  expect(container.querySelector(".login-loading-art")).toBeNull();
  rerender(<LoginAssetPreloadScreen {...props} progress={1.5} />);
  expect(bar.getAttribute("aria-valuenow")).toBe("100");
  rerender(<LoginAssetPreloadScreen {...props} progress={NaN} />);
  expect(bar.getAttribute("aria-valuenow")).toBe("0");
});

test("rotates both random characters and tips through the shared loader", () => {
  vi.useFakeTimers();
  const characters = {
    first: { id: "first", name: "甲", portrait: "/first.png" },
    second: { id: "second", name: "乙", portrait: "/second.png" }
  };
  const { container } = render(<LoginAssetPreloadScreen characters={characters} progress={0.5} tipsText={"第一条\n第二条"} />);
  const firstPortrait = container.querySelector(".preload-character img").getAttribute("src");
  const firstTip = container.querySelector(".login-loading-tip-copy").textContent;
  act(() => vi.advanceTimersByTime(10000));
  expect(container.querySelector(".preload-character img").getAttribute("src")).not.toBe(firstPortrait);
  expect(container.querySelector(".login-loading-tip-copy").textContent).not.toBe(firstTip);
});

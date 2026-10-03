// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import LoginAssetPreloadScreen from "./LoginAssetPreloadScreen.jsx";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("real progress fills the chamber, completes only at one, and resets artwork", () => {
  const { container, rerender } = render(<LoginAssetPreloadScreen progress={0} tipsText="Tip：保留文字" />);
  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("0");
  expect(container.querySelector("polygon").getAttribute("points")).toBe("0,100 100,100 100,100 0,100");
  rerender(<LoginAssetPreloadScreen progress={0.999} tipsText="Tip：保留文字" />);
  expect(bar.getAttribute("aria-valuenow")).toBe("99");
  expect(container.querySelector("main").classList.contains("is-complete")).toBe(false);
  rerender(<LoginAssetPreloadScreen progress={1} tipsText="Tip：保留文字" />);
  expect(bar.getAttribute("aria-valuenow")).toBe("100");
  expect(screen.getByAltText("角色恍然大悟").src).toContain("character-complete.png");
  expect(container.querySelector("main").classList.contains("asset-preload-screen")).toBe(true);
  rerender(<LoginAssetPreloadScreen progress={0.1} tipsText="Tip：保留文字" />);
  expect(screen.getByAltText("角色正在思考").src).toContain("loading-blink-fast.webp");
  expect(container.querySelector(".login-loading-tip-copy").textContent).toBe("保留文字");
  expect(container.querySelector(".login-loading-tip-label").textContent).toBe("Tip：");
});

test("completion freezes tip rotation and reduced motion chooses a still sprite", () => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const { container, rerender } = render(<LoginAssetPreloadScreen progress={0.5} tipsText={"第一条\n第二条"} />);
  expect(screen.getByAltText("角色正在思考").src).toContain("character-open.png");
  const first = container.querySelector(".login-loading-tip-copy").textContent;
  act(() => vi.advanceTimersByTime(10000));
  expect(container.querySelector(".login-loading-tip-copy").textContent).not.toBe(first);
  rerender(<LoginAssetPreloadScreen progress={1} tipsText={"第一条\n第二条"} />);
  const final = container.querySelector(".login-loading-tip-copy").textContent;
  act(() => vi.advanceTimersByTime(20000));
  expect(container.querySelector(".login-loading-tip-copy").textContent).toBe(final);
});

// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeOnboarding from "./HomeOnboarding.jsx";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 30, top: 50, right: 180, bottom: 150, width: 150, height: 100 });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const character = { portrait: "/portrait.webp" };

describe("home guide interaction boundary", () => {
  it("blocks unrelated and direct underlying actions, only activating the instructed target once", () => {
    const open = vi.fn();
    const purchase = vi.fn();
    const finish = vi.fn();
    const { container } = render(<>
      <button data-home-guide="handbook" onClick={open}>真实手册</button>
      <button onClick={purchase}>购买</button>
      <HomeOnboarding character={character} overlaySetters={{}} onFinish={finish} />
    </>);
    fireEvent.click(screen.getByText("购买"));
    expect(purchase).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("点击任意位置继续"));
    fireEvent.click(container.querySelector(".home-guide-advance-plane"));
    expect(container.querySelector(".home-guide-target")).not.toBeNull();
    fireEvent.click(screen.getByText("真实手册"));
    expect(open).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(finish).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector(".home-guide-target"));
    expect(open).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("跳过引导"));
    expect(finish).toHaveBeenCalledWith("skipped");
  });

  it("clicking dialogue first reveals the current line, then advances", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { container } = render(<HomeOnboarding character={character} overlaySetters={{}} onFinish={vi.fn()} />);
    const dialogue = container.querySelector(".tutorial-battle-dialogue");
    fireEvent.click(dialogue);
    expect(container.querySelector("p").textContent).toBe("对了，之前光聊围棋了，还没向你介绍我们围棋部呢。");
    expect(screen.getByText("点击任意位置继续")).toBeTruthy();
    fireEvent.click(dialogue);
    expect(screen.getByText("正在准备介绍的窗口…")).toBeTruthy();
    // Missing target never advances or consumes the tour, but skip is always available.
    fireEvent.click(container.querySelector(".home-guide-advance-plane"));
    expect(screen.getByText("正在准备介绍的窗口…")).toBeTruthy();
  });
});

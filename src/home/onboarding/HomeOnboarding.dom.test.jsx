// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_ONBOARDING_STEPS } from "./homeOnboardingScript.js";
import HomeOnboarding, { revealGuideTarget } from "./HomeOnboarding.jsx";

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
    fireEvent.click(container.querySelector(".home-guide-advance-plane"));
    fireEvent.click(container.querySelector(".home-guide-advance-plane"));
    expect(container.querySelector(".home-guide-target")).not.toBeNull();
    fireEvent.click(screen.getByText("真实手册"));
    expect(open).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(finish).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector(".home-guide-target"));
    expect(open).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "跳过引导" }));
    expect(finish).toHaveBeenCalledWith("skipped");
  });

  it("clicking dialogue first reveals the current line, then advances", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { container } = render(<HomeOnboarding character={character} overlaySetters={{}} onFinish={vi.fn()} />);
    const dialogue = container.querySelector(".tutorial-battle-dialogue");
    fireEvent.click(dialogue);
    expect(container.querySelector("p").textContent).toBe("对了，之前光聊围棋了，还没向你介绍我们围棋部呢。");
    expect(screen.queryByRole("button", { name: "点击任意位置继续" })).toBeNull();
    fireEvent.click(dialogue);
    expect(screen.getByText("正在准备介绍的窗口…")).toBeTruthy();
    // Missing target never advances or consumes the tour, but skip is always available.
    fireEvent.click(container.querySelector(".home-guide-advance-plane"));
    expect(screen.getByText("正在准备介绍的窗口…")).toBeTruthy();
  });
});

it("centers the reply without the NPC dialogue and keeps only an icon skip control", () => {
  const { container } = render(<>
    <button data-home-guide="handbook">handbook</button><button data-home-guide="sigrika-card">sigrika</button>
    <button data-home-guide="match">match</button><button data-home-guide="practice">practice</button><button data-home-guide="resume">resume</button>
    <div className="house-modal character-details-modal match-mode-modal resume-modal" />
    <HomeOnboarding character={character} overlaySetters={{}} onFinish={vi.fn()} />
  </>);
  expect(container.querySelector(".home-guide-panel").style.top).toBe("66px");
  const skip = screen.getByRole("button", { name: "跳过引导" });
  expect(skip.textContent).toBe("");
  expect(skip.querySelector("svg")).not.toBeNull();
  for (const step of HOME_ONBOARDING_STEPS) {
    if (step.choice) break;
    if (step.id === "practice") expect(container.querySelector(".home-guide-panel").style.top).toBe("171px");
    fireEvent.click(container.querySelector(step.action ? ".home-guide-target" : ".home-guide-advance-plane"));
  }
  expect(container.querySelector(".tutorial-battle-dialogue")).toBeNull();
  expect(container.querySelector(".home-guide-choice-panel button").textContent).toContain("其它部员呢");
  fireEvent.click(container.querySelector(".home-guide-choice"));
  expect(container.querySelector(".tutorial-battle-dialogue")).not.toBeNull();
});

it("does not scroll visible targets and only reveals clipped targets with nearest alignment", () => {
  const target = document.createElement("button");
  target.scrollIntoView = vi.fn();
  revealGuideTarget(target);
  expect(target.scrollIntoView).not.toHaveBeenCalled();
  target.getBoundingClientRect = () => ({ top: -80, bottom: -30, left: 30, right: 80 });
  revealGuideTarget(target);
  expect(target.scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest", behavior: "instant" });
});

it("blocks wheel and touch scrolling on the guide plane", () => {
  const { container } = render(<HomeOnboarding character={character} overlaySetters={{}} onFinish={vi.fn()} />);
  const plane = container.querySelector(".home-guide-advance-plane");
  expect(fireEvent.wheel(plane, { deltaY: 300 })).toBe(false);
  expect(fireEvent.touchMove(plane)).toBe(false);
});

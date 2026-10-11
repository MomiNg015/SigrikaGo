// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SkillBanner from "./SkillBanner.jsx";
import PlayerInfo from "../room/PlayerInfo.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { AEMEATH_SKILL_FORM_ASSET, AEMEATH_SKILL_FORM } from "../shared/aemeathSkillForm.js";
import { createGameState } from "../shared/game.js";

vi.mock("../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));
const player = { color: "black", characterId: "aemeath", character: CHARACTERS.aemeath,
  user: { username: "Aemeath" }, time: { main: 100, periods: 3, byoYomi: 30, periodRemaining: 30 } };
const game = createGameState([player]);
const banner = { id: "voyage-1", characterId: "aemeath", color: "black", effectType: "voyage-star", skillName: "远航星" };
const history = [{ type: "skill", color: "black", effectType: "voyage-star" }];
function Scene({ pending = banner, actions = [] }) {
  return <><PlayerInfo player={player} game={{ ...game, pendingSkill: pending, history: actions }} characters={CHARACTERS} />
    {pending && <SkillBanner banner={pending} characters={CHARACTERS} />}</>;
}
const advance = ms => act(() => vi.advanceTimersByTime(ms));
function expectForm(container, transformed, withBanner = true) {
  for (const selector of withBanner ? [".skill-cutin-art", ".character-bust-image"] : [".character-bust-image"]) {
    expect(container.querySelector(selector)?.getAttribute("src") === AEMEATH_SKILL_FORM_ASSET).toBe(transformed);
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Aemeath Voyage Star reveal", () => {
  it("holds for 1s, swaps together inside the burst, then clears without snapshot restarts", () => {
    const { container, rerender } = render(<Scene />);
    advance(999);
    expect(document.querySelector(".aemeath-data-glitch")).toBeNull();
    expectForm(container, false);
    advance(1);
    expect(document.querySelectorAll(".aemeath-signal-picture")).toHaveLength(1);
    expect(document.querySelectorAll("feDisplacementMap")).toHaveLength(3);
    expect(document.querySelector(".aemeath-data-glitch").textContent).toBe("");
    rerender(<Scene pending={{ ...banner }} />);
    advance(399);
    expectForm(container, false);
    advance(1);
    expectForm(container, true);
    expect(document.querySelector(".aemeath-data-glitch")).not.toBeNull();
    advance(399);
    expect(document.querySelector(".aemeath-data-glitch")).not.toBeNull();
    advance(1);
    expect(document.querySelector(".aemeath-data-glitch")).toBeNull();
    rerender(<Scene pending={null} actions={history} />);
    expectForm(container, true, false);
    rerender(<Scene pending={null} />);
    expectForm(container, false, false);
  });
  it("never transforms for hidden-hand and carries the form into later non-voyage banners", () => {
    const { container, rerender } = render(<Scene pending={{ ...banner, effectType: "hidden-hand" }} />);
    advance(1500);
    expectForm(container, false);
    expect(document.querySelector(".aemeath-data-glitch")).toBeNull();
    rerender(<Scene actions={history} pending={{ ...banner, id: "later", effectType: "hidden-hand", battleFormBeforeCast: AEMEATH_SKILL_FORM }} />);
    expectForm(container, true);
  });
  it("cancels stale casts and fully restores when a revealed preview is cancelled", () => {
    const timers = vi.spyOn(globalThis, "setTimeout");
    const clear = vi.spyOn(globalThis, "clearTimeout");
    const { container, rerender, unmount } = render(<Scene />);
    advance(1000);
    rerender(<Scene pending={{ ...banner, id: "replacement" }} />);
    advance(400);
    expectForm(container, false);
    expect(document.querySelector(".aemeath-data-glitch")).toBeNull();
    advance(1000);
    expectForm(container, true);
    rerender(<Scene pending={null} />);
    expectForm(container, false, false);
    unmount();
    timers.mock.calls.forEach((args, index) => {
      if ([1000, 1400, 1800].includes(args[1])) expect(clear).toHaveBeenCalledWith(timers.mock.results[index].value);
    });
  });
  it.each(["reduced", "disabled"])("preserves reveal without the burst when %s", mode => {
    vi.stubGlobal("matchMedia", () => ({ matches: mode === "reduced", addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { container } = render(<Scene pending={{ ...banner, effectsEnabled: mode !== "disabled" }} />);
    advance(1400);
    expectForm(container, true);
    expect(document.querySelector(".aemeath-data-glitch")).toBeNull();
  });
  it("removes the live backdrop and SVG filters when reduced motion is enabled mid-burst", () => {
    let change;
    const media = { matches: false, addEventListener: vi.fn((type, listener) => { change = listener; }), removeEventListener: vi.fn() };
    vi.stubGlobal("matchMedia", () => media);
    const { container, unmount } = render(<Scene />);
    advance(1100);
    expect(document.querySelector(".aemeath-data-glitch")?.parentElement).toBe(document.body);
    act(() => { media.matches = true; change(); });
    expect(document.querySelector(".aemeath-signal-defs")).toBeNull();
    advance(300);
    expectForm(container, true);
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", change);
  });
});

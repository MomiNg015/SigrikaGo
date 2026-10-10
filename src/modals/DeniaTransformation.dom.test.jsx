// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SkillBanner from "./SkillBanner.jsx";
import PlayerInfo from "../room/PlayerInfo.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { DENIA_SKILL_FORM_ASSET, DENIA_SKILL_FORM_PALETTE } from "../shared/deniaSkillForm.js";
import { createGameState } from "../shared/game.js";

vi.mock("../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));
const player = { color: "black", characterId: "denia", character: CHARACTERS.denia,
  user: { username: "Denia" }, time: { main: 100, periods: 3, byoYomi: 30, periodRemaining: 30 } };
const game = createGameState([player]);
const banner = { id: "cast-1", characterId: "denia", color: "black", effectsEnabled: false };
function Scene({ pending = banner, history = [] }) {
  return <><PlayerInfo player={player} game={{ ...game, pendingSkill: pending, history }} characters={CHARACTERS} />
    {pending && <SkillBanner banner={pending} characters={CHARACTERS} />}</>;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const advance = (ms) => act(() => vi.advanceTimersByTime(ms));
const art = (container, selector) => container.querySelector(selector)?.getAttribute("src");
const palette = (container, selector, property) => container.querySelector(selector)?.style.getPropertyValue(property);
function expectPalette(container, color, withBanner = true) {
  expect(palette(container, ".player-info", "--player-accent")).toBe(color);
  expect(palette(container, ".skill-chip", "--skill-chip-accent")).toBe(color);
  if (withBanner) expect(palette(container, ".skill-cutin-scene", "--cutin-accent")).toBe(color);
  for (const selector of withBanner ? [".player-info", ".skill-cutin-scene"] : [".player-info"]) {
    const surface = container.querySelector(selector);
    expect(surface.getAttribute("data-battle-form")).toBe(color === DENIA_SKILL_FORM_PALETTE ? "denia-awakened" : null);
    expect(surface.style.getPropertyValue("--denia-runes").includes("denia-awakened-runes.svg")).toBe(color === DENIA_SKILL_FORM_PALETTE);
  }
}

describe("synchronized Denia reveal", () => {
  it("swaps both surfaces at cover peak without restarting on equivalent snapshots", () => {
    const { container, rerender } = render(<Scene />);
    advance(1000);
    rerender(<Scene pending={{ ...banner }} />);
    advance(749);
    expect(art(container, ".skill-cutin-art")).not.toBe(DENIA_SKILL_FORM_ASSET);
    expect(art(container, ".character-bust-image")).not.toBe(DENIA_SKILL_FORM_ASSET);
    expectPalette(container, CHARACTERS.denia.palette);
    advance(1);
    expect(art(container, ".skill-cutin-art")).toBe(DENIA_SKILL_FORM_ASSET);
    expect(art(container, ".character-bust-image")).toBe(DENIA_SKILL_FORM_ASSET);
    expectPalette(container, DENIA_SKILL_FORM_PALETTE);
    rerender(<Scene pending={null} history={[{ type: "skill", color: "black" }]} />);
    expect(art(container, ".character-bust-image")).toBe(DENIA_SKILL_FORM_ASSET);
    expectPalette(container, DENIA_SKILL_FORM_PALETTE, false);
    rerender(<Scene pending={null} />);
    expect(art(container, ".character-bust-image")).not.toBe(DENIA_SKILL_FORM_ASSET);
    expectPalette(container, CHARACTERS.denia.palette, false);
    expect(CHARACTERS.denia.palette).not.toBe(DENIA_SKILL_FORM_PALETTE);
  });
  it("cancels old cast timers, restores after cancellation, and cleans up on unmount", () => {
    const timers = vi.spyOn(globalThis, "setTimeout");
    const clear = vi.spyOn(globalThis, "clearTimeout");
    const { container, rerender, unmount } = render(<Scene />);
    advance(1000);
    rerender(<Scene pending={{ ...banner, id: "cast-2" }} />);
    advance(750);
    expect(art(container, ".skill-cutin-art")).not.toBe(DENIA_SKILL_FORM_ASSET);
    advance(1000);
    expect(art(container, ".character-bust-image")).toBe(DENIA_SKILL_FORM_ASSET);
    rerender(<Scene pending={null} />);
    expect(art(container, ".character-bust-image")).not.toBe(DENIA_SKILL_FORM_ASSET);
    expectPalette(container, CHARACTERS.denia.palette, false);
    unmount();
    timers.mock.calls.forEach((args, index) => {
      if (args[1] === 1750) expect(clear).toHaveBeenCalledWith(timers.mock.results[index].value);
    });
  });
  it("keeps a second cast transformed from its first frame", () => {
    const { container } = render(<Scene pending={{ ...banner, battleFormBeforeCast: "denia-awakened" }} />);
    expect(art(container, ".skill-cutin-art")).toBe(DENIA_SKILL_FORM_ASSET);
    expectPalette(container, DENIA_SKILL_FORM_PALETTE);
  });
  it("skips canvas work for reduced motion while retaining the form change", () => {
    vi.stubGlobal("matchMedia", (query) => ({ matches: query.includes("prefers-reduced-motion"), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    const { container } = render(<Scene pending={{ ...banner, effectsEnabled: true }} />);
    expect(context).not.toHaveBeenCalled();
    advance(1750);
    expect(art(container, ".skill-cutin-art")).toBe(DENIA_SKILL_FORM_ASSET);
    expect(art(container, ".character-bust-image")).toBe(DENIA_SKILL_FORM_ASSET);
  });
});

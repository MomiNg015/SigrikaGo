import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { areBoardPropsEqual, stoneOffsetForPoint } from "./Board.jsx";

describe("areBoardPropsEqual", () => {
  test("keeps the board memoized when only handler references change", () => {
    const game = { phase: "playing", points: [], history: [] };
    const previous = boardProps({ game, onPoint: () => "before" });
    const next = boardProps({ game, onPoint: () => "after" });

    expect(areBoardPropsEqual(previous, next)).toBe(true);
  });

  test("keeps the board memoized when timer ticks replace the same preview player", () => {
    const game = { phase: "playing", points: [], history: [] };
    const previous = boardProps({
      game,
      previewPlayer: { color: "black", characterId: "sigrika", character: null, time: { main: 300 } }
    });
    const next = boardProps({
      game,
      previewPlayer: { color: "black", characterId: "sigrika", character: null, time: { main: 299 } }
    });

    expect(areBoardPropsEqual(previous, next)).toBe(true);
  });

  test("rerenders when board state or decorations change", () => {
    const game = { phase: "playing", points: [], history: [] };

    expect(areBoardPropsEqual(
      boardProps({ game }),
      boardProps({ game: { ...game } })
    )).toBe(false);
    expect(areBoardPropsEqual(
      boardProps({ game, stoneDecorations: { black: "plain", white: "" } }),
      boardProps({ game, stoneDecorations: { black: "paw", white: "" } })
    )).toBe(false);
  });

  test("uses strong skill-effect halos on affected stones", () => {
    const css = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8");
    const exposedBlock = css.match(/\.exposed-hidden-hand \.stone\s*\{[^}]+\}/)?.[0] ?? "";
    const flippedBlock = css.match(/\.flipped-stone \.stone\s*\{[^}]+\}/)?.[0] ?? "";

    expect(exposedBlock).toContain("rgba(8, 174, 84, 0.95)");
    expect(exposedBlock).toContain("rgba(0, 142, 72, 0.96)");
    expect(flippedBlock).toContain("rgba(126, 30, 255, 0.95)");
    expect(flippedBlock).toContain("rgba(112, 24, 214, 0.96)");
  });

  test("marks the latest move with a circular red stone outline instead of a center dot", () => {
    const css = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8");
    const latestMoveBlock = css.match(/\.stone i\s*\{[^}]+\}/)?.[0] ?? "";

    expect(latestMoveBlock).toContain("left: 50%");
    expect(latestMoveBlock).toContain("top: 50%");
    expect(latestMoveBlock).toContain("width: calc(100% + 6px)");
    expect(latestMoveBlock).toContain("aspect-ratio: 1 / 1");
    expect(latestMoveBlock).toContain("transform: translate(-50%, -50%)");
    expect(latestMoveBlock).toContain("border: 3px solid #e13b4f");
    expect(latestMoveBlock).toContain("background: transparent");
    expect(latestMoveBlock).not.toContain("width: 9px");
    expect(latestMoveBlock).not.toContain("height: 9px");
  });

  test("uses stable one-pixel directional stone offsets for a hand-placed board feel", () => {
    const point = { id: "3,10", x: 3, y: 10, stone: "black" };
    const first = stoneOffsetForPoint(point);
    const second = stoneOffsetForPoint({ ...point });
    const differentStone = stoneOffsetForPoint({ ...point, stone: "white" });

    expect(first).toEqual(second);
    expect(first).not.toEqual({ x: 0, y: 0 });
    expect(Math.abs(first.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(first.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(first.x) || Math.abs(first.y)).toBeGreaterThanOrEqual(1);
    expect(differentStone).not.toEqual(first);
  });

  test("keeps board grid strokes uniform with first-line strokes at 2.5x across themes", () => {
    const roomCss = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8");
    const brightSchoolCss = readFileSync(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url), "utf8");

    expect(readStrokeWidth(roomCss, ".board-lines line")).toBe(0.64);
    expect(readStrokeWidth(roomCss, ".board-lines line.edge-line")).toBe(1.6);
    expect(readStrokeWidth(brightSchoolCss, ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .board-lines line")).toBe(0.8);
    expect(readStrokeWidth(brightSchoolCss, ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .board-lines line.edge-line")).toBe(2);
    expect(roomCss.match(/\.board-lines line\s*\{[^}]+\}/)?.[0] ?? "").toContain("stroke-linecap: square");
    expect(roomCss.match(/\.board-lines line\s*\{[^}]+\}/)?.[0] ?? "").toContain("shape-rendering: geometricPrecision");
  });

  test("bright school keeps board stones square and centered on intersections", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const boardPointBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board \.point\s*\{[^}]+\}/)?.[0] ?? "";
    const boardStoneBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board \.stone\s*\{[^}]+\}/)?.[0] ?? "";

    expect(css).not.toMatch(/\.theme-bright-school\.theme-bright-school \.white\s*\{/);
    expect(boardPointBlock).toContain("min-width: 0");
    expect(boardPointBlock).toContain("min-height: 0");
    expect(boardPointBlock).toContain("aspect-ratio: 1 / 1");
    expect(boardStoneBlock).toContain("aspect-ratio: 1 / 1");
    expect(boardStoneBlock).toContain("left: 50%");
    expect(boardStoneBlock).toContain("top: 50%");
    expect(boardStoneBlock).toContain("var(--stone-offset-x, 0px)");
    expect(boardStoneBlock).toContain("var(--stone-offset-y, 0px)");
  });

  test("bright school keeps skill targeting glow separate from star-point dots", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const targetingBlock = css.slice(css.indexOf("Bright School skill targeting repair."));

    expect(targetingBlock).toContain(".board-wrap.targeting");
    expect(targetingBlock).toContain("--bright-school-board-targeting-shadow-0");
    expect(targetingBlock).toContain("--bright-school-board-targeting-shadow-50");
    expect(targetingBlock).toContain("--bright-school-board-targeting-shadow-100");
    expect(targetingBlock).toContain("box-shadow:");
    expect(targetingBlock).toContain("animation: bright-school-board-targeting-glow 1.15s linear infinite !important");
    expect(targetingBlock).toContain("animation: bright-school-board-targeting-aura 1.15s linear infinite !important");
    expect(targetingBlock).toContain("@keyframes bright-school-board-targeting-glow");
    expect(targetingBlock).toContain("@keyframes bright-school-board-targeting-aura");
    expect(targetingBlock).toContain(".board .point.star:not(.black):not(.white):not(.erased)::after");
    expect(targetingBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(targetingBlock).toContain(".board-wrap.targeting .point.previewable::before");
    expect(targetingBlock).toContain(".board .point.star:not(.black):not(.white):not(.erased)::before");
    expect(targetingBlock).toContain("content: none !important");
  });

  test("bright school keeps scoring markers centered on board intersections", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const scoringBlock = css.slice(css.indexOf("Bright School board scoring mark repair."));

    expect(scoringBlock).toContain(".board :is(.territory-mark, .dead-mark, .neutral-mark)");
    expect(scoringBlock).toContain("left: 50% !important");
    expect(scoringBlock).toContain("top: 50% !important");
    expect(scoringBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(scoringBlock).toContain(".board :is(.territory-mark.black, .dead-mark.black)");
    expect(scoringBlock).toContain(".board :is(.territory-mark.white, .dead-mark.white)");
  });

  test("uses owner-colored crosses for territory and owner-colored circles for dead stones", () => {
    const css = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8");
    const crossBaseBlock = css.match(/\.territory-mark::before,[\s\S]*?\.neutral-mark::after\s*\{[^}]+\}/)?.[0] ?? "";
    const deadCircleBlock = css.match(/\.dead-mark\.black,[\s\S]*?\.dead-mark\.white\s*\{[^}]+\}/)?.[0] ?? "";
    const deadBarsBlock = css.match(/\.dead-mark::before,[\s\S]*?\.dead-mark::after\s*\{[^}]+\}/)?.[0] ?? "";

    expect(crossBaseBlock).toContain(".territory-mark::before");
    expect(crossBaseBlock).toContain(".territory-mark::after");
    expect(crossBaseBlock).not.toContain(".dead-mark::before");
    expect(crossBaseBlock).not.toContain(".dead-mark::after");
    expect(css).toContain(".territory-mark.black");
    expect(css).toContain(".territory-mark.white");
    expect(deadCircleBlock).toContain(".dead-mark.black");
    expect(deadCircleBlock).toContain(".dead-mark.white");
    expect(deadCircleBlock).toContain("border: 2px solid currentColor");
    expect(deadBarsBlock).toContain("content: none");
  });
});

function boardProps(overrides = {}) {
  return {
    game: { phase: "playing", points: [], history: [] },
    showCoords: true,
    showMoves: false,
    pendingSkill: false,
    previewPlayer: null,
    stoneDecorations: { black: "", white: "" },
    onPoint: () => {},
    onScoringPoint: null,
    onNeutral: () => {},
    ...overrides
  };
}

function readStrokeWidth(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = css.match(new RegExp(`${escapedSelector}\\s*\\{[^}]+\\}`))?.[0] ?? "";
  const value = block.match(/stroke-width:\s*([0-9.]+)/)?.[1];

  expect(value).toBeTruthy();
  return Number(value);
}

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readFileSync(url, "utf8");
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) => {
    return readCssWithImports(new URL(importPath, url), seen);
  });
}

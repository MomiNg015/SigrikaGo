import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createPoints } from "../shared/game.js";
import Board from "./Board.jsx";
import { areBoardPropsEqual, arePointButtonPropsEqual, stoneOffsetForPoint } from "./Board.jsx";

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
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const exposedBlock = css.match(/\.exposed-hidden-hand \.stone\s*\{[^}]+\}/)?.[0] ?? "";
    const flippedBlock = css.match(/\.flipped-stone \.stone\s*\{[^}]+\}/)?.[0] ?? "";
    const doubleMoveBlock = css.match(/\.double-move-stone \.stone\s*\{[^}]+\}/)?.[0] ?? "";

    expect(exposedBlock).toContain("rgba(8, 174, 84, 0.95)");
    expect(exposedBlock).toContain("rgba(0, 142, 72, 0.96)");
    expect(flippedBlock).toContain("rgba(126, 30, 255, 0.95)");
    expect(flippedBlock).toContain("rgba(112, 24, 214, 0.96)");
    expect(doubleMoveBlock).toContain("rgba(255, 65, 32, 0.96)");
    expect(doubleMoveBlock).toContain("double-move-stone-glow");
    expect(css).toContain("@keyframes double-move-stone-glow");
  });

  test("marks the latest move with a circular red stone outline instead of a center dot", () => {
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
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

  test("keeps ordinary placement hints centered on board intersections", () => {
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const pointBlock = css.match(/\.point\s*\{[^}]+\}/)?.[0] ?? "";
    const previewBlock = css.match(/\.point::before\s*\{[^}]+\}/)?.[0] ?? "";
    const pointConfirmBlock = css.match(/\.point\.touch-confirming::before\s*\{[^}]+\}/)?.[0] ?? "";
    const confirmBlock = css.match(/\.touch-confirm-marker\s*\{[^}]+\}/)?.[0] ?? "";

    expect(pointBlock).toContain("display: grid");
    expect(pointBlock).toContain("place-items: center");
    expect(previewBlock).not.toContain("left: 50%");
    expect(previewBlock).not.toContain("top: 50%");
    expect(previewBlock).not.toContain("translate(-50%, -50%)");
    expect(pointConfirmBlock).toContain("display: none");
    expect(pointConfirmBlock).toContain("opacity: 0");
    expect(confirmBlock).not.toContain("left: 50%");
    expect(confirmBlock).not.toContain("top: 50%");
    expect(confirmBlock).not.toContain("translate(-50%, -50%)");
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

  test("uses the shared warm wood texture for the board surface across theme guards", () => {
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const boardWrapBlock = roomCss.match(/\.board-wrap\s*\{[^}]+\}/)?.[0] ?? "";
    const themeBoardWrapBlock = brightSchoolCss.match(/\.theme-bright-school\.theme-bright-school \.board-wrap\s*\{[^}]+\}/)?.[0] ?? "";

    expect(boardWrapBlock).toContain("--board-wood-texture");
    expect(boardWrapBlock).toContain('url("/assets/boards/go-board-background-reference-color-vertical-2048.webp")');
    expect(boardWrapBlock).toContain("#e4aa2f");
    expect(boardWrapBlock).toContain("background: var(--board-wood-texture)");
    expect(themeBoardWrapBlock).toContain("background: var(--board-wood-texture) !important");
    expect(() => readFileSync(new URL("../../public/assets/boards/go-board-background-reference-color-vertical-2048.webp", import.meta.url))).not.toThrow();
  });

  test("renders spray stones with an independent non-decorated visual contract", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: [{ id: "3,3", x: 3, y: 3, valid: true, stone: "spray" }],
        history: []
      },
      stoneDecorations: { black: "paw", white: "paw", spray: "paw" }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain('class="point  spray');
    expect(markup).not.toContain("decorated-stone");
    expect(css).toContain(".spray .stone");
    expect(css).toContain("--spray-stone-fallback");
  });

  test("renders protocol ban markers as pointer-transparent point overlays", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: [{
          id: "3,3",
          x: 3,
          y: 3,
          valid: true,
          stone: "black",
          protocolBan: { owner: "black", bannedColor: "white", effect: "protocol-takeover" }
        }],
        history: []
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain("protocol-ban-mark white");
    expect(markup).toContain('aria-label="white protocol ban"');
    expect(css).toContain(".protocol-ban-mark");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("rotate(45deg)");
    expect(css).toContain("protocol-ban-bluewhite-glow");
    expect(css).toContain("@keyframes protocol-ban-bluewhite-glow");
  });

  test("renders Chisa removal marks as independent red cross overlays", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: [{
          id: "3,3",
          x: 3,
          y: 3,
          valid: true,
          stone: null,
          protocolBan: { owner: "black", bannedColor: "white", effect: "protocol-takeover" }
        }],
        history: [],
        libertyPurgeMarks: [{
          effectType: "liberty-purge",
          owner: "black",
          clearAfterColor: "white",
          pointIds: ["3,3"]
        }]
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain("protocol-ban-mark white");
    expect(markup).toContain("liberty-purge-removal-mark");
    expect(markup).toContain('aria-label="liberty purge removal"');
    expect(css).toContain(".liberty-purge-removal-mark");
    const removalBlock = css.match(/\.liberty-purge-removal-mark\s*\{[^}]+\}/)?.[0] ?? "";

    expect(removalBlock).toContain("left: 50%");
    expect(removalBlock).toContain("top: 50%");
    expect(removalBlock).toContain("transform: translate(-50%, -50%)");
    expect(removalBlock).not.toContain("rotate(45deg)");
    expect(removalBlock).toContain("#ff1733");
    expect(css).toContain("pointer-events: none");
  });

  test("caps standard mode stone offsets at half a pixel", () => {
    const point = { id: "3,10", x: 3, y: 10, stone: "black" };
    const first = stoneOffsetForPoint(point, "standard");
    const second = stoneOffsetForPoint({ ...point }, "standard");
    const spark = stoneOffsetForPoint(point, "spark");
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        mode: "standard",
        size: 19,
        points: [{ ...point, valid: true }],
        history: []
      }
    })));

    expect(first).toEqual(second);
    expect(Math.abs(first.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(first.y)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(first.x) || Math.abs(first.y)).toBeGreaterThanOrEqual(0.5);
    expect(first).toEqual({ x: spark.x * 0.5, y: spark.y * 0.5 });
    expect(markup).toContain("--stone-offset-x:");
    expect(markup).toContain("0.5px");
  });

  test("uses the game board size for coordinate grids", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: { phase: "playing", size: 19, points: createPoints(19), history: [] }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain('data-board-size="19"');
    expect(markup).toContain("--size:19");
    expect(markup).toContain("T");
    expect(css).toContain("grid-template-columns: repeat(var(--size), minmax(0, 1fr));");
    expect(css).toContain("grid-template-rows: repeat(var(--size), minmax(0, 1fr));");
    expect(css).toContain('.board-wrap[data-board-size="19"] .coord-row');
  });

  test("renders a non-interactive board effects layer without replacing point buttons", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "skill-preview",
        size: 13,
        points: createPoints(13),
        history: [],
        pendingSkill: {
          id: "skill-1",
          effectType: "erase-point",
          targetId: "6,6",
          affectedPointIds: ["6,6"]
        }
      }
    })));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-type="erase-point"');
    expect(markup).toContain("<button");
    expect(markup).toContain('class="point');
  });

  test("renders QiuYuan row slash as a continuous board overlay", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: createPoints(13),
        history: [],
        rowEffects: [{ effectType: "row-slash", owner: "black", y: 6, id: "4,6" }]
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain("board-row-effects");
    expect(markup).toContain("board-row-slash");
    expect(markup).toContain("--row-y:");
    expect(markup).toContain("<button");
    expect(css).toContain(".board-row-slash");
    expect(css).toContain("left: -8%");
    expect(css).toContain("right: -8%");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("radial-gradient(ellipse at 16% 34%");
    expect(css).toContain("clip-path: none");
    expect(css).toContain(".board-row-slash::before");
    expect(css).toContain("animation: row-slash-strike 620ms");
    expect(css).toContain("@keyframes row-slash-strike");
  });

  test("keeps board point buttons transparent so they cannot cover grid lines", () => {
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const pointBlock = css.match(/\.board \.point\s*\{[^}]+\}/)?.[0] ?? "";

    expect(pointBlock).toContain("appearance: none !important");
    expect(pointBlock).toContain("background: transparent !important");
    expect(pointBlock).toContain("background-image: none !important");
    expect(pointBlock).toContain("min-height: 0 !important");
    expect(pointBlock).toContain("box-shadow: none !important");
  });

  test("keeps the board grid svg stretched over the playable board", () => {
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const gridSvgBlock = css.match(/\.board-lines\s*\{[^}]+\}/)?.[0] ?? "";

    expect(gridSvgBlock).toContain("display: block");
    expect(gridSvgBlock).toContain("width: 100%");
    expect(gridSvgBlock).toContain("height: 100%");
    expect(gridSvgBlock).toContain("max-width: none");
    expect(gridSvgBlock).toContain("max-height: none");
  });

  test("renders QiuYuan pending skill row preview from target metadata", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "skill-preview",
        size: 13,
        points: createPoints(13),
        history: [],
        pendingSkill: {
          id: "slash-preview",
          effectType: "row-slash",
          targetId: "3,5",
          row: 5
        }
      }
    })));

    expect(markup).toContain("board-row-slash preview");
    expect(markup).not.toContain("board-effects-layer");
    expect(markup).not.toContain('data-effect-type="row-slash"');
  });

  test("prewarms Pixi only for skill-enabled boards", () => {
    const source = readFileSync(new URL("./Board.jsx", import.meta.url), "utf8");

    expect(source).toContain("prewarm={game.skillEnabled !== false}");
  });

  test("renders Nabomo passive fog as a board ambient layer without replacing points", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: createPoints(13),
        history: [],
        passives: {
          black: { colorIllusion: { active: true, triggered: true, probability: 0.8 } }
        }
      }
    })));

    expect(markup).toContain("board-ambient-layer");
    expect(markup).toContain('data-ambient-effect="color-illusion-fog"');
    expect(markup).toContain("<button");
    expect(markup).toContain('class="point');
  });

  test("keeps board grid strokes uniform with first-line strokes at 2.5x across themes", () => {
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));

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
    expect(boardPointBlock).toContain("background: transparent");
    expect(boardPointBlock).toContain("background-image: none");
    expect(boardPointBlock).toContain("aspect-ratio: 1 / 1");
    expect(boardStoneBlock).toContain("aspect-ratio: 1 / 1");
    expect(boardStoneBlock).toContain("left: 50%");
    expect(boardStoneBlock).toContain("top: 50%");
    expect(boardStoneBlock).toContain("var(--stone-offset-x, 0px)");
    expect(boardStoneBlock).toContain("var(--stone-offset-y, 0px)");
  });

  test("Bright School guard prevents global svg media rules from collapsing board lines", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const boardBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board\s*\{[^}]+\}/)?.[0] ?? "";
    const gridSvgBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board-lines\s*\{[^}]+\}/)?.[0] ?? "";
    const gridLineBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board-lines line\s*\{[^}]+\}/)?.[0] ?? "";

    expect(boardBlock).toContain("background: transparent !important");
    expect(boardBlock).toContain("background-image: none !important");
    expect(boardBlock).toContain("overflow: visible !important");
    expect(gridSvgBlock).toContain("width: 100% !important");
    expect(gridSvgBlock).toContain("height: 100% !important");
    expect(gridSvgBlock).toContain("max-width: none !important");
    expect(gridSvgBlock).toContain("max-height: none !important");
    expect(gridSvgBlock).toContain("background: transparent !important");
    expect(gridLineBlock).toContain("stroke: #4a3736 !important");
    expect(gridLineBlock).toContain("opacity: 1 !important");
  });

  test("Bright School guard keeps row slash containers from becoming paper panels", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const rowEffectsBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board \.board-row-effects\.board-row-effects\s*\{[^}]+\}/)?.[0] ?? "";
    const rowSlashBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board \.board-row-slash\.board-row-slash\s*\{[^}]+\}/)?.[0] ?? "";
    const rowSlashBeforeAfterBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board \.board-row-slash\.board-row-slash::before,[\s\S]*?\.theme-bright-school\.theme-bright-school \.board \.board-row-slash\.board-row-slash::after\s*\{[^}]+\}/)?.[0] ?? "";
    const rowSlashAfterBlockStart = css.lastIndexOf(".theme-bright-school.theme-bright-school .board .board-row-slash.board-row-slash::after");
    const rowSlashAfterBlock = rowSlashAfterBlockStart >= 0 ? css.slice(rowSlashAfterBlockStart, css.indexOf("}", rowSlashAfterBlockStart) + 1) : "";

    expect(rowEffectsBlock).toContain(".board .board-row-effects.board-row-effects");
    expect(rowEffectsBlock).toContain("background: transparent !important");
    expect(rowEffectsBlock).toContain("background-color: transparent !important");
    expect(rowEffectsBlock).toContain("background-image: none !important");
    expect(rowEffectsBlock).toContain("border: 0 !important");
    expect(rowEffectsBlock).toContain("box-shadow: none !important");
    expect(rowEffectsBlock).toContain("overflow: visible !important");
    expect(rowEffectsBlock).toContain("clip-path: none !important");
    expect(rowSlashBlock).toContain(".board .board-row-slash.board-row-slash");
    expect(rowSlashBlock).toContain("background:");
    expect(rowSlashBlock).toContain("radial-gradient(ellipse at 16% 34%");
    expect(rowSlashBlock).toContain("clip-path: none !important");
    expect(rowSlashBlock).toContain("drop-shadow(0 0 11px rgba(221, 255, 248, 0.64))");
    expect(rowSlashBlock).not.toContain("background-color: var(--bright-sheet)");
    expect(rowSlashBeforeAfterBlock).toContain('content: "" !important');
    expect(rowSlashBeforeAfterBlock).toContain("display: block !important");
    expect(rowSlashBeforeAfterBlock).toContain("pointer-events: none !important");
    expect(rowSlashAfterBlock).toContain("rgba(13, 17, 19, 0.84)");
    expect(rowSlashAfterBlock).toContain("transform: translateY(12%) skewX(-18deg) !important");
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

  test("bright school keeps protocol markers centered and rotated on board intersections", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const protocolBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board \.protocol-ban-mark\s*\{[^}]+\}/)?.[0] ?? "";

    expect(protocolBlock).toContain("left: 50% !important");
    expect(protocolBlock).toContain("top: 50% !important");
    expect(protocolBlock).toContain("transform: translate(-50%, -50%) rotate(45deg) !important");
    expect(protocolBlock).toContain("pointer-events: none !important");
  });

  test("bright school keeps Chisa removal crosses centered and saturated red", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const removalBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board \.liberty-purge-removal-mark\s*\{[^}]+\}/)?.[0] ?? "";
    const removalBarsBlock = css.match(/\.theme-bright-school\.theme-bright-school \.board \.liberty-purge-removal-mark::before,[\s\S]*?\.theme-bright-school\.theme-bright-school \.board \.liberty-purge-removal-mark::after\s*\{[^}]+\}/)?.[0] ?? "";

    expect(removalBlock).toContain("left: 50% !important");
    expect(removalBlock).toContain("top: 50% !important");
    expect(removalBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(removalBlock).toContain("color: #ff1733 !important");
    expect(removalBarsBlock).toContain("height: 5px !important");
    expect(removalBarsBlock).toContain("background: currentColor !important");
  });

  test("uses owner-colored crosses for territory and owner-colored circles for dead stones", () => {
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
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

describe("arePointButtonPropsEqual", () => {
  test("keeps a board point memoized when only handler ref contents change", () => {
    const point = { id: "3,4", x: 3, y: 4, valid: true, stone: null };
    const pointerTypeRef = { current: "" };
    const handlersRef = { current: { onPoint: () => "before", onNeutral: () => {}, onScoringPoint: null } };
    const previous = pointButtonProps({ point, pointerTypeRef, handlersRef });
    handlersRef.current = { onPoint: () => "after", onNeutral: () => {}, onScoringPoint: null };
    const next = pointButtonProps({ point, pointerTypeRef, handlersRef });

    expect(arePointButtonPropsEqual(previous, next)).toBe(true);
  });

  test("rerenders a board point when visible point state changes", () => {
    const point = { id: "3,4", x: 3, y: 4, valid: true, stone: null };

    expect(arePointButtonPropsEqual(
      pointButtonProps({ point }),
      pointButtonProps({ point: { ...point, stone: "black" } })
    )).toBe(false);
    expect(arePointButtonPropsEqual(
      pointButtonProps({ point, showMoves: false }),
      pointButtonProps({ point, showMoves: true })
    )).toBe(false);
    expect(arePointButtonPropsEqual(
      pointButtonProps({ point, hasScoringPoint: false }),
      pointButtonProps({ point, hasScoringPoint: true })
    )).toBe(false);
    expect(arePointButtonPropsEqual(
      pointButtonProps({ point, libertyPurgeMarked: false }),
      pointButtonProps({ point, libertyPurgeMarked: true })
    )).toBe(false);
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

function pointButtonProps(overrides = {}) {
  return {
    boardSize: 13,
    confirmClass: "",
    deadOwner: null,
    decorationImage: null,
    emptyTerritoryOwner: null,
    gameMode: "spark",
    handlersRef: { current: { onPoint: () => {}, onScoringPoint: null, onNeutral: () => {} } },
    hasScoringPoint: false,
    isStar: false,
    libertyPurgeMarked: false,
    markedActionId: "",
    moveNumber: null,
    neutralMarked: false,
    point: { id: "0,0", x: 0, y: 0, valid: true, stone: null },
    pointerTypeRef: { current: "" },
    previewClass: "",
    showMoves: false,
    showScoringMarks: false,
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

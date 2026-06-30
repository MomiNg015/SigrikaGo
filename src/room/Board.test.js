import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createPoints } from "../shared/game.js";
import Board from "./Board.jsx";
import { areBoardPropsEqual, arePointButtonPropsEqual, erasedBoundaryGeometry, stoneOffsetForPoint } from "./Board.jsx";

describe("areBoardPropsEqual", () => {
  test("rerenders the board when handler references change so stable refs stay current", () => {
    const game = { phase: "playing", points: [], history: [] };
    const previous = boardProps({ game, onPoint: () => "before" });
    const next = boardProps({ game, onPoint: () => "after" });

    expect(areBoardPropsEqual(previous, next)).toBe(false);
  });

  test("keeps point buttons memoized while the stable handler ref contents change", () => {
    const point = { id: "3,3", x: 3, y: 3, valid: true, stone: null };
    const pointerTypeRef = { current: "" };
    const handlersRef = { current: { onPoint: () => "before" } };
    const previous = pointButtonProps({ point, handlersRef, pointerTypeRef });
    handlersRef.current = { onPoint: () => "after" };
    const next = pointButtonProps({ point, handlersRef, pointerTypeRef });

    expect(arePointButtonPropsEqual(previous, next)).toBe(true);
  });

  test("keeps the board memoized when timer ticks replace the same preview player", () => {
    const game = { phase: "playing", points: [], history: [] };
    const handlers = boardHandlers();
    const previous = boardProps({
      game,
      ...handlers,
      previewPlayer: { color: "black", characterId: "sigrika", character: null, time: { main: 300 } }
    });
    const next = boardProps({
      game,
      ...handlers,
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
    const libertyPurgeBlock = css.match(/\.liberty-purge-stone \.stone\s*\{[^}]+\}/)?.[0] ?? "";

    expect(exposedBlock).toContain("rgba(8, 174, 84, 0.95)");
    expect(exposedBlock).toContain("rgba(0, 142, 72, 0.96)");
    expect(flippedBlock).toContain("rgba(126, 30, 255, 0.95)");
    expect(flippedBlock).toContain("rgba(112, 24, 214, 0.96)");
    expect(doubleMoveBlock).toContain("rgba(255, 65, 32, 0.96)");
    expect(doubleMoveBlock).toContain("double-move-stone-glow");
    expect(libertyPurgeBlock).toContain("rgba(171, 10, 38, 0.78)");
    expect(libertyPurgeBlock).toContain("liberty-purge-stone-glow");
    expect(css).toContain("@keyframes double-move-stone-glow");
    expect(css).toContain("@keyframes liberty-purge-stone-glow");
  });

  test("marks gomoku winning stones with a point-local golden reveal effect", () => {
    const points = createPoints(13).map((point) => (
      point.y === 6 && point.x >= 2 && point.x <= 6
        ? { ...point, stone: "black" }
        : point
    ));
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "finished",
        mode: "gomoku",
        size: 13,
        points,
        history: [],
        winner: {
          winnerColor: "black",
          reason: "gomoku-five",
          winningLine: ["2,6", "3,6", "4,6", "5,6", "6,6"]
        }
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup.match(/gomoku-winning-line/g)).toHaveLength(5);
    expect(css).toContain(".gomoku-winning-line .stone");
    expect(css).toContain("rgba(255, 220, 85, 0.98)");
    expect(css).toContain("animation: gomoku-winning-stone-glow 1.45s ease-in-out infinite alternate");
    expect(css).toContain("animation: gomoku-winning-ring-pulse 1.7s ease-in-out infinite alternate");
    expect(css).toContain("@keyframes gomoku-winning-ring-pulse");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
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

  test("renders erased Sigrika field markers from the crater WebP asset at 1.5 board-cell scale", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: [{ id: "3,3", x: 3, y: 3, valid: false, stone: null }],
        history: []
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const voidBlock = css.match(/\.void\s*\{[^}]+\}/)?.[0] ?? "";

    expect(markup).toContain('class="void"');
    expect(voidBlock).toContain("--erased-field-marker-size: 150%");
    expect(voidBlock).toContain("width: var(--erased-field-marker-size)");
    expect(voidBlock).toContain("background: center / contain no-repeat url(\"/assets/effects/sigrika-erased-field-marker.webp\")");
    expect(voidBlock).toContain("pointer-events: none");
    expect(voidBlock).not.toContain("radial-gradient");
    expect(() => readFileSync(new URL("../../public/assets/effects/sigrika-erased-field-marker.webp", import.meta.url))).not.toThrow();
  });

  test("keeps ordinary placement hints centered on board intersections", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: [{ id: "5,5", x: 5, y: 5, valid: true, stone: null }],
        history: []
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const pointBlock = css.match(/\.point\s*\{[^}]+\}/)?.[0] ?? "";
    const boardPointBlock = css.match(/\.board \.point\s*\{[^}]+\}/)?.[0] ?? "";
    const previewBlock = css.match(/\.point::before\s*\{[^}]+\}/)?.[0] ?? "";
    const pointConfirmBlock = css.match(/\.point\.touch-confirming::before\s*\{[^}]+\}/)?.[0] ?? "";
    const confirmBlock = css.match(/\.touch-confirm-marker\s*\{[^}]+\}/)?.[0] ?? "";

    expect(markup).toContain("--board-point-center-x:42.30769230769231%");
    expect(markup).toContain("--board-point-center-y:42.30769230769231%");
    expect(pointBlock).toContain("position: absolute");
    expect(pointBlock).toContain("left: var(--board-point-center-x)");
    expect(pointBlock).toContain("top: var(--board-point-center-y)");
    expect(pointBlock).toContain("width: calc(100% / var(--size))");
    expect(pointBlock).toContain("height: calc(100% / var(--size))");
    expect(pointBlock).toContain("transform: translate(-50%, -50%)");
    expect(boardPointBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(previewBlock).toContain("left: 50%");
    expect(previewBlock).toContain("top: 50%");
    expect(previewBlock).toContain("transform: translate(-50%, -50%)");
    expect(pointConfirmBlock).toContain("display: none");
    expect(pointConfirmBlock).toContain("opacity: 0");
    expect(confirmBlock).not.toContain("left: 50%");
    expect(confirmBlock).not.toContain("top: 50%");
    expect(confirmBlock).not.toContain("translate(-50%, -50%)");
  });

  test("keeps mobile board touch feedback centered on intersections", () => {
    const touchCss = readCssWithImports(
      new URL("../styles/themes/bright-school/mobile/room/touch-board-feedback.css", import.meta.url)
    );
    const motionCss = readCssWithImports(new URL("../styles/themes/bright-school/mobile/motion.css", import.meta.url));
    const activeBlock = touchCss.match(/\.mobile-room-screen \.point\.previewable:active\s*\{[^}]+\}/)?.[0] ?? "";
    const confirmingBlock = touchCss.match(/\.mobile-room-screen \.point\.touch-confirming\s*\{[^}]+\}/)?.[0] ?? "";
    const reducedMotionBlock = motionCss.match(/\.mobile-room-screen \.point\.previewable:active,[\s\S]*?\.mobile-room-screen \.point\.touch-confirming\s*\{[^}]+\}/)?.[0] ?? "";

    expect(activeBlock).toContain("transform: translate(-50%, -50%) scale(0.94) !important");
    expect(confirmingBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(reducedMotionBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(activeBlock).not.toContain("transform: scale(0.94) !important");
    expect(confirmingBlock).not.toContain("transform: none !important");
  });

  test("renders tutorial target rings as real child elements so theme pseudo-element guards cannot erase them", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: [{ id: "5,5", x: 5, y: 5, valid: true, stone: null }],
        history: []
      },
      tutorialTargetPointId: "5,5"
    })));
    const css = readCssWithImports(new URL("../styles/room/tutorial-battle-screen.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const targetRingBlock = css.match(/\.board \.point\.tutorial-target-point \.tutorial-target-ring\s*\{[^}]+\}/)?.[0] ?? "";
    const brightTargetRingBlock = brightSchoolCss.match(/\.theme-bright-school\.theme-bright-school \.board \.point\.tutorial-target-point \.tutorial-target-ring\s*\{[^}]+\}/)?.[0] ?? "";

    expect(markup).toContain("tutorial-target-point");
    expect(markup).toContain("tutorial-target-ring");
    expect(css).toContain(".board .point.tutorial-target-point .tutorial-target-ring");
    expect(targetRingBlock).toContain("transform: translate(-50%, -50%)");
    expect(targetRingBlock).toContain("animation: tutorial-target-pulse");
    expect(targetRingBlock).toContain("rgba(255, 210, 77");
    expect(brightTargetRingBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(css).not.toContain(".board .point.tutorial-target-point::after");
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

  test("can disable stone jitter for precision tutorial boards", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points: [{ id: "3,10", x: 3, y: 10, valid: true, stone: "black" }],
        history: []
      },
      stoneJitter: false
    })));

    expect(markup).toContain("--stone-offset-x:0px");
    expect(markup).toContain("--stone-offset-y:0px");
    expect(markup).toContain("--board-point-center-x:26.923076923076923%");
    expect(markup).toContain("--board-point-center-y:80.76923076923077%");
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
    expect(() => readFileSync(new URL("../../public/assets/boards/nabomo-color-illusion-board.webp", import.meta.url))).not.toThrow();
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
    expect(css).toContain(".spray .stone::before");
    expect(css).toContain("spray-stone-bottom-glow");
    expect(css).toContain("spray-stone-entry-glow");
    const sprayStoneBlock = css.match(/\.spray \.stone\s*\{[^}]+\}/)?.[0] ?? "";

    expect(css).toContain('--spray-stone-art: center / 100% 100% no-repeat url("/assets/stones/spray-stone.webp")');
    expect(sprayStoneBlock).toContain("background: var(--spray-stone-art)");
    expect(sprayStoneBlock).not.toContain("--spray-stone-fallback");
    expect(sprayStoneBlock).not.toContain("conic-gradient");
    expect(css).not.toContain("--spray-stone-fallback");
    expect(readFileSync(new URL("../styles/room/board/spray-stone-effects.css", import.meta.url), "utf8")).not.toContain("conic-gradient");
    expect(() => readFileSync(new URL("../../public/assets/stones/spray-stone.webp", import.meta.url))).not.toThrow();
  });

  test("masks original stones during Lynae spray pending animation", () => {
    const targetId = "3,3";
    const randomTargetId = "6,6";
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "skill-preview",
        size: 13,
        points: [
          { id: targetId, x: 3, y: 3, valid: true, stone: "white" },
          { id: randomTargetId, x: 6, y: 6, valid: true, stone: "black" }
        ],
        history: [],
        pendingSkill: {
          id: "spray-preview",
          effectType: "spray-stone",
          targetId,
          affectedPointIds: [targetId, randomTargetId],
          bannerDurationMs: 2000,
          boardEffectDurationMs: 1800
        }
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup.match(/spray-transform-pending/g)).toHaveLength(2);
    expect(markup).toContain("--skill-banner-duration:2000ms");
    expect(markup).toContain("--skill-board-effect-duration:1800ms");
    expect(css).toContain(".spray-transform-pending .stone");
    expect(css).toContain("spray-original-paint-cover");
    expect(css).toContain("spray-transform-paint-bloom");
    expect(css).toMatch(/\.spray \.stone,\r?\n\.spray-transform-pending \.stone/);
    const pendingPaintBlock = css.match(/\.spray-transform-pending \.stone::before\s*\{[^}]+\}/)?.[0] ?? "";
    const paintCoverKeyframes = css.match(/@keyframes spray-original-paint-cover \{[\s\S]*?\n\}/)?.[0] ?? "";
    const paintBloomKeyframes = css.match(/@keyframes spray-transform-paint-bloom \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(pendingPaintBlock).toContain("inset: -10%");
    expect(pendingPaintBlock).toContain("radial-gradient(circle at 22% 34%, rgba(34, 211, 238, 0.9)");
    expect(pendingPaintBlock).toContain("radial-gradient(circle at 74% 31%, rgba(255, 80, 154, 0.86)");
    expect(pendingPaintBlock).toContain("mask-image: radial-gradient(ellipse at 50% 50%");
    expect(pendingPaintBlock).not.toContain("linear-gradient");
    expect(pendingPaintBlock).not.toContain("conic-gradient");
    expect(pendingPaintBlock).not.toContain("box-shadow");
    expect(pendingPaintBlock).toContain("z-index: 6");
    expect(paintCoverKeyframes).toContain("0% { opacity: 1; filter: none; }");
    expect(paintCoverKeyframes).toContain("62% { opacity: 1; filter: saturate(1.1) brightness(1.03); }");
    expect(paintCoverKeyframes).toContain("72% { background: var(--spray-stone-art);");
    expect(paintBloomKeyframes).toContain("0% { opacity: 0;");
    expect(paintBloomKeyframes).toContain("18% { opacity: 0.98;");
    expect(paintBloomKeyframes).toContain("68% { opacity: 0.96;");
    expect(paintBloomKeyframes).toContain("82% { opacity: 0.72;");
  });

  test("uses the final spray stone offset while Lynae pending paint covers the original stone", () => {
    const point = createPoints(13).find((candidate) => {
      const originalOffset = stoneOffsetForPoint({ ...candidate, stone: "white" });
      const sprayOffset = stoneOffsetForPoint({ ...candidate, stone: "spray" });
      return originalOffset.x !== sprayOffset.x || originalOffset.y !== sprayOffset.y;
    });
    expect(point).toBeTruthy();
    const originalOffset = stoneOffsetForPoint({ ...point, stone: "white" });
    const sprayOffset = stoneOffsetForPoint({ ...point, stone: "spray" });
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "skill-preview",
        size: 13,
        points: [{ ...point, stone: "white" }],
        history: [],
        pendingSkill: {
          id: "spray-preview",
          effectType: "spray-stone",
          targetId: point.id,
          affectedPointIds: [point.id],
          bannerDurationMs: 2000,
          boardEffectDurationMs: 1800
        }
      }
    })));

    expect(markup).toContain("spray-transform-pending");
    expect(markup).toContain(`--stone-offset-x:${sprayOffset.x}px`);
    expect(markup).toContain(`--stone-offset-y:${sprayOffset.y}px`);
    expect(markup).not.toContain(`--stone-offset-x:${originalOffset.x}px;--stone-offset-y:${originalOffset.y}px`);
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

  test("shows Chisa pending placement before delayed slashes and keeps it off the latest-move ring", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "skill-preview",
        size: 13,
        points: createPoints(13),
        history: [{ type: "move", id: "3,3", moveNumber: 1 }],
        pendingSkill: {
          id: "chisa-pending",
          color: "black",
          effectType: "liberty-purge",
          targetId: "6,6",
          affectedPointIds: ["6,6", "5,6"],
          removalMarkIds: ["5,6"],
          bannerDurationMs: 2000,
          boardEffectDurationMs: 1800
        }
      },
      stoneDecorations: { black: "paw-stone", white: "" }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain('data-effect-type="liberty-purge"');
    expect(markup).toContain('class="point  black  liberty-purge-stone liberty-purge-pending');
    expect(markup).toContain("stone decorated-stone liberty-purge-pending-stone");
    expect(markup).toContain("--stone-decoration-image:url(&quot;/assets/decorations/paw-stone-black.webp&quot;)");
    expect(css).toContain("liberty-purge-stone-drop");
    expect(css).toContain("var(--skill-banner-duration, 2000ms)");
  });

  test("renders resolved Chisa skill stones with their own red glow instead of the latest-move ring", () => {
    const points = createPoints(13).map((point) => (
      point.id === "6,6"
        ? { ...point, stone: "black", skillEffect: "liberty-purge-stone", skillEffectOwner: "black" }
        : point
    ));
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points,
        history: [
          { type: "move", id: "3,3", moveNumber: 1 },
          { type: "skill", effectType: "liberty-purge", id: "6,6", placedId: "6,6", moveNumber: 1 }
        ]
      }
    })));

    expect(markup).toContain("liberty-purge-stone");
    expect(markup).not.toContain('class="stone "><i');
  });

  test("reveals Sigrika erased field marker at the meteor impact point during the pending animation", () => {
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "skill-preview",
        size: 13,
        points: createPoints(13),
        history: [],
        pendingSkill: {
          id: "sigrika-impact",
          effectType: "erase-point",
          targetId: "6,6",
          affectedPointIds: ["6,6"],
          bannerDurationMs: 2000,
          boardEffectDurationMs: 1800
        }
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain("--erase-impact-marker-delay:3044ms");
    expect(markup).toContain('class="void erase-impact-pending"');
    expect(markup).not.toContain('class="point erased');
    expect(css).toContain(".void.erase-impact-pending");
    expect(css).toContain("erase-impact-marker-reveal");
    expect(css).toContain("opacity: 0");
    expect(css).not.toContain(".void.erase-impact-pending::before");
  });

  test("renders Voyage Star center point with only one centered star crater marker", () => {
    const points = createPoints(13);
    const center = points.find((point) => point.id === "6,6");
    const erasedNeighbor = points.find((point) => point.id === "5,6");
    center.valid = false;
    center.skillEffect = "voyage-star-erased-point";
    erasedNeighbor.valid = false;
    erasedNeighbor.skillEffect = "voyage-star-erased-point";

    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points,
        history: [{ type: "skill", effectType: "voyage-star", id: "6,6" }]
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain("voyage-star-crater-mark");
    expect(markup).toContain('data-point-id="6,6"');
    expect(markup).toContain("--voyage-star-crater-x:50%");
    expect(markup).toContain("--voyage-star-crater-y:50%");
    expect((markup.match(/voyage-star-crater-mark/g) ?? [])).toHaveLength(1);
    expect(markup).not.toContain('class="void"');
    expect(css).toContain(".voyage-star-crater-mark");
    expect(css).toContain("width: calc(350% / var(--size))");
    expect(css).toContain("height: calc(350% / var(--size))");
    expect(css).toContain('background: center / contain no-repeat url("/assets/effects/voyage-star-crater.webp")');
    expect(css).toContain("left: var(--voyage-star-crater-x, 50%)");
    expect(css).toContain("top: var(--voyage-star-crater-y, 50%)");
    expect(css).toContain("transform: translate(-50%, -50%)");
    expect(css).toContain("animation: voyage-star-crater-aura 1.85s ease-in-out infinite alternate");
    expect(css).toContain("drop-shadow(0 0 8px rgba(214, 92, 255, 0.76))");
    expect(css).not.toContain("@keyframes voyage-star-crater-haze");
    expect(css).not.toContain(".voyage-star-crater-mark::before");
  });

  test("renders Voyage Star crater point directly when the resolved point carries the crater effect", () => {
    const points = createPoints(13);
    const center = points.find((point) => point.id === "6,6");
    center.valid = false;
    center.skillEffect = "voyage-star-crater-point";

    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points,
        history: []
      }
    })));

    expect(markup).toContain("voyage-star-crater-mark");
    expect(markup).toContain("--voyage-star-crater-x:50%");
    expect(markup).toContain("--voyage-star-crater-y:50%");
    expect(markup).not.toContain('class="void"');
  });

  test("positions the Voyage Star crater from board coordinates instead of point-child layout", () => {
    const points = createPoints(13);
    const center = points.find((point) => point.id === "4,9");
    center.valid = false;
    center.skillEffect = "voyage-star-crater-point";

    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points,
        history: [{ type: "skill", effectType: "voyage-star", id: "4,9" }]
      }
    })));

    expect(markup).toContain("--voyage-star-crater-x:34.61538461538461%");
    expect(markup).toContain("--voyage-star-crater-y:73.07692307692307%");
  });

  test("does not keep the latest-move ring on the previous move after Voyage Star", () => {
    const points = createPoints(13);
    const previousMove = points.find((point) => point.id === "1,9");
    const center = points.find((point) => point.id === "4,9");
    previousMove.stone = "black";
    center.valid = false;
    center.skillEffect = "voyage-star-crater-point";

    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points,
        history: [
          { type: "move", id: "1,9", moveNumber: 17 },
          { type: "skill", effectType: "voyage-star", id: "4,9", moveNumber: 17 }
        ]
      }
    })));

    expect(markup).toContain("voyage-star-crater-mark");
    expect(markup).not.toContain("<i></i>");
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
    expect(css).toContain("left: -18%");
    expect(css).toContain("right: -18%");
    expect(css).toContain("height: calc(180% / var(--size))");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("radial-gradient(ellipse at 16% 34%");
    expect(css).toContain("clip-path: inset(0 0 0 0)");
    expect(css).toContain("--row-slash-y-offset: clamp(6px, 1.8vw, 13px)");
    expect(css).toContain("translate: 0 calc(-50% + var(--row-slash-y-offset))");
    expect(css).toContain(".board-row-slash::before");
    expect(css).toContain("animation: row-slash-strike 520ms");
    expect(css).toContain(".board-row-slash.casting");
    expect(css).toContain("animation-duration: var(--row-slash-cast-duration, 396ms)");
    expect(css).toContain("animation-delay: calc(var(--skill-banner-duration, 2000ms) + var(--row-slash-cast-delay, 342ms))");
    expect(css).toContain("clip-path: inset(0 100% 0 0)");
    expect(css).toContain("clip-path: inset(0 18% 0 0)");
    expect(css).toContain("100% 10px no-repeat");
    expect(css).toContain("100% 8px no-repeat");
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

  test("renders gray cells and first-line-weight boundaries around erased intersections", () => {
    const points = createPoints(13);
    const erasedPoint = points.find((point) => point.id === "6,6");
    erasedPoint.valid = false;
    erasedPoint.skillEffect = "erased-point";
    const geometry = erasedBoundaryGeometry(points, 13);
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "playing",
        size: 13,
        points,
        history: []
      }
    })));
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));

    expect(geometry.cells).toHaveLength(4);
    expect(geometry.lines).toHaveLength(4);
    expect(markup).toContain("erased-boundary-layer");
    expect(markup.match(/erased-boundary-cell/g)).toHaveLength(4);
    expect(markup.match(/erased-boundary-line/g)).toHaveLength(4);
    expect(markup).toContain('data-erased-point-id="6,6"');
    expect(roomCss).toContain(".erased-boundary-layer");
    expect(roomCss).toContain(".erased-boundary-cell");
    expect(roomCss).toContain("rgba(86, 89, 92, 0.32)");
    expect(readStrokeWidth(roomCss, ".erased-boundary-line")).toBe(1.6);
    expect(readStrokeWidth(brightSchoolCss, ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .erased-boundary-line")).toBe(2);
  });

  test("draws only the outside outline of merged erased gray cells", () => {
    const points = createPoints(13);
    for (const pointId of ["6,6", "7,6"]) {
      const point = points.find((candidate) => candidate.id === pointId);
      point.valid = false;
      point.skillEffect = "erased-point";
    }

    const geometry = erasedBoundaryGeometry(points, 13);

    expect(geometry.cells.map((cell) => cell.key).sort()).toEqual([
      "cell-5-5",
      "cell-5-6",
      "cell-6-5",
      "cell-6-6",
      "cell-7-5",
      "cell-7-6"
    ]);
    expect(geometry.lines.map((line) => line.key).sort()).toEqual([
      "line-h-5-5-8",
      "line-h-7-5-8",
      "line-v-5-5-7",
      "line-v-8-5-7"
    ]);
  });

  test("renders QiuYuan pending skill with a Pixi cast and synchronized persistent row scar", () => {
    const points = createPoints(13);
    points.find((point) => point.id === "0,5").stone = "black";
    points.find((point) => point.id === "3,5").stone = "white";
    const markup = renderToStaticMarkup(createElement(Board, boardProps({
      game: {
        phase: "skill-preview",
        size: 13,
        points,
        history: [],
        rowEffects: [{ effectType: "row-slash", owner: "black", y: 5, id: "resolved-5" }],
        pendingSkill: {
          id: "slash-preview",
          effectType: "row-slash",
          targetId: "3,5",
          row: 5,
          affectedPointIds: Array.from({ length: 13 }, (_item, x) => `${x},5`)
        }
      }
    })));
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-type="row-slash"');
    expect(markup).toContain("board-row-effects");
    expect((markup.match(/board-row-slash/g) ?? []).length).toBe(1);
    expect(markup).toContain("board-row-slash casting");
    expect(markup).toContain("--row-slash-cast-delay:342ms");
    expect(markup).toContain("--row-slash-cast-duration:396ms");
    expect(markup).toContain("row-slash-cut-pending");
    expect(markup).toContain("--row-slash-cut-delay:420ms");
    expect(markup).toContain("--row-slash-cut-delay:495ms");
    expect(markup).not.toContain("board-row-slash preview");
    expect(css).toContain(".row-slash-cut-pending .stone");
    expect(css).toContain("row-slash-cut-away 120ms steps(1, end)");
    expect(css).toContain("row-slash-cut-flash 140ms");
    expect(css).toContain("@keyframes row-slash-cut-away");
  });

  test("prewarms Pixi only for skill-enabled boards with global effects enabled", () => {
    const source = readFileSync(new URL("./Board.jsx", import.meta.url), "utf8");

    expect(source).toContain("prewarm={game.skillEnabled !== false && skillEffectsEnabled !== false}");
    expect(source).toContain("effectsEnabled={skillEffectsEnabled !== false && game.pendingSkill?.effectsEnabled !== false}");
  });

  test("renders Nabomo passive desaturation as a board ambient layer without replacing points", () => {
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
    expect(markup).toContain("color-illusion-board-surface");
    expect(markup).toContain('data-ambient-effect="color-illusion-desaturate"');
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
    expect(boardPointBlock).toContain("position: absolute");
    expect(boardPointBlock).toContain("left: var(--board-point-center-x)");
    expect(boardPointBlock).toContain("top: var(--board-point-center-y)");
    expect(boardPointBlock).toContain("transform: translate(-50%, -50%)");
    expect(boardPointBlock).toContain("background: transparent");
    expect(boardPointBlock).toContain("background-image: none");
    expect(boardPointBlock).toContain("width: calc(100% / var(--size))");
    expect(boardPointBlock).toContain("height: calc(100% / var(--size))");
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
    expect(rowSlashBlock).toContain("100% 10px no-repeat");
    expect(rowSlashBlock).not.toContain("clip-path:");
    expect(rowSlashBlock).toContain("drop-shadow(0 0 11px rgba(221, 255, 248, 0.64))");
    expect(rowSlashBlock).not.toContain("background-color: var(--bright-sheet)");
    expect(rowSlashBeforeAfterBlock).toContain('content: "" !important');
    expect(rowSlashBeforeAfterBlock).toContain("display: block !important");
    expect(rowSlashBeforeAfterBlock).toContain("pointer-events: none !important");
    expect(rowSlashAfterBlock).toContain("rgba(18, 86, 94, 0.58)");
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
    expect(targetingBlock).not.toContain(".board .point.star:not(.black):not(.white):not(.erased)::before");
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
    expect(arePointButtonPropsEqual(
      pointButtonProps({ point, eraseImpactPending: false }),
      pointButtonProps({ point, eraseImpactPending: true })
    )).toBe(false);
    expect(arePointButtonPropsEqual(
      pointButtonProps({ point, pendingLibertyPurgeColor: "" }),
      pointButtonProps({ point, pendingLibertyPurgeColor: "black" })
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

function boardHandlers() {
  return {
    onPoint: () => {},
    onScoringPoint: null,
    onNeutral: () => {},
    onBoardSurface: () => {}
  };
}

function pointButtonProps(overrides = {}) {
  return {
    boardSize: 13,
    confirmClass: "",
    deadOwner: null,
    decorationImage: null,
    emptyTerritoryOwner: null,
    eraseImpactPending: false,
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
    pendingLibertyPurgeColor: "",
    pendingEffectClass: "",
    previewClass: "",
    showMoves: false,
    showScoringMarks: false,
    stoneJitter: true,
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

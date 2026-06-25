import { describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BoardSkillEffects, {
  SKILL_EFFECT_REDUCED_MOTION_MS,
  boardPointCenter,
  effectTimingForPendingSkill,
  preparePixiEffect,
  reducedMotionQuery
} from "./BoardSkillEffects.jsx";
import { pointCenterForHost } from "./boardSkillEffectGeometry.js";

describe("BoardSkillEffects", () => {
  test("maps board point ids to pixel centers for different board sizes", () => {
    expect(boardPointCenter("0,0", { boardSize: 13, width: 260, height: 260 })).toEqual({ x: 10, y: 10 });
    expect(boardPointCenter("12,12", { boardSize: 13, width: 260, height: 260 })).toEqual({ x: 250, y: 250 });
    expect(boardPointCenter("18,18", { boardSize: 19, width: 380, height: 380 })).toEqual({ x: 370, y: 370 });
  });

  test("prefers the rendered board point center for Pixi effects", () => {
    const pointElement = {
      getBoundingClientRect: () => ({ left: 140, top: 92, width: 40, height: 40 })
    };
    const host = {
      clientWidth: 260,
      clientHeight: 260,
      getBoundingClientRect: () => ({ left: 100, top: 52, width: 260, height: 260 }),
      parentElement: {
        querySelector: (selector) => selector === '[data-point-id="3,4"]' ? pointElement : null
      }
    };

    expect(pointCenterForHost("3,4", { boardSize: 13, host })).toEqual({ x: 60, y: 60 });
  });

  test("starts board effects only after the skill banner phase", () => {
    expect(effectTimingForPendingSkill({
      effectType: "erase-point",
      bannerDurationMs: 2000,
      boardEffectDurationMs: 1800
    })).toEqual({
      startDelayMs: 2000,
      durationMs: 1800
    });
  });

  test("uses a short static reduced-motion timing", () => {
    expect(reducedMotionQuery).toBe("(prefers-reduced-motion: reduce)");
    expect(effectTimingForPendingSkill({
      effectType: "random-blast",
      bannerDurationMs: 2000,
      boardEffectDurationMs: 1800
    }, { reducedMotion: true })).toEqual({
      startDelayMs: 2000,
      durationMs: SKILL_EFFECT_REDUCED_MOTION_MS
    });
  });

  test("passes audio settings as presentation-only data", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      audioSettings: { master: 50, sfx: 40 },
      pendingSkill: {
        id: "skill-audio",
        effectType: "random-blast",
        targetId: "6,6"
      }
    }));

    expect(markup).toContain('data-effect-id="skill-audio"');
    expect(markup).not.toContain("master");
    expect(markup).not.toContain("sfx");
  });

  test("renders a passive non-interactive overlay keyed by pending skill id", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      pendingSkill: {
        id: "skill-1",
        effectType: "flip-stone",
        targetId: "4,4",
        affectedPointIds: ["4,4"]
      }
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-id="skill-1"');
    expect(markup).toContain('data-effect-type="flip-stone"');
    expect(markup).toContain('data-board-effect="true"');
    expect(markup).toContain("aria-hidden=\"true\"");
  });

  test("keeps the Pixi fallback transparent instead of flashing a board-covering gray panel", () => {
    const css = readFileSync(new URL("../styles/room/board/effects-canvas-motion.css", import.meta.url), "utf8");
    const fallbackBlock = css.match(/\.board-effects-layer\[data-effect-fallback="true"\]::after\s*\{[^}]+\}/)?.[0] ?? "";

    expect(fallbackBlock).toContain("background: transparent");
    expect(fallbackBlock).not.toContain("background-color");
    expect(fallbackBlock).not.toContain("inset: 0");
    expect(fallbackBlock).not.toContain("width: 100%");
    expect(fallbackBlock).not.toContain("height: 100%");
  });

  test("prepares the Pixi app and renderer assets during the banner window", async () => {
    const appInstances = [];
    class Application {
      constructor() {
        this.canvas = { className: "" };
        this.init = vi.fn(async () => {});
        this.destroy = vi.fn();
        appInstances.push(this);
      }
    }
    const pixi = {
      Application,
      Assets: {
        load: vi.fn(async () => {})
      }
    };
    const host = {
      clientWidth: 260,
      clientHeight: 260,
      dataset: {},
      children: [],
      replaceChildren(...children) {
        this.children = children;
      }
    };
    const loadPixi = vi.fn(async () => pixi);

    const prepared = preparePixiEffect({
      host,
      pendingSkill: { id: "changli-cast", effectType: "double-move" },
      loadPixi
    });

    expect(loadPixi).toHaveBeenCalledTimes(1);
    await prepared.ready;

    expect(appInstances).toHaveLength(1);
    expect(appInstances[0].init).toHaveBeenCalledWith(expect.objectContaining({
      resizeTo: host,
      backgroundAlpha: 0
    }));
    expect(pixi.Assets.load).toHaveBeenCalledWith([
      "/assets/effects/changli-fire-phoenix.svg",
      "/assets/effects/changli-flame-sprite.svg"
    ]);
    expect(host.children).toEqual([appInstances[0].canvas]);
    expect(appInstances[0].canvas.className).toBe("board-effects-canvas");

    prepared.cleanup();
    expect(appInstances[0].destroy).toHaveBeenCalled();
    expect(host.children).toEqual([]);
  });

  test("renders QiuYuan row slash as a full-board Pixi cast layer", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      pendingSkill: {
        id: "slash-pixi-cast",
        effectType: "row-slash",
        targetId: "4,5",
        row: 5
      }
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-id="slash-pixi-cast"');
    expect(markup).toContain('data-effect-type="row-slash"');
    expect(markup).toContain('data-board-effect="true"');
  });

  test("renders ChangLi double-move as a full-board Pixi layer", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      pendingSkill: {
        id: "changli-double-move",
        effectType: "double-move"
      }
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-id="changli-double-move"');
    expect(markup).toContain('data-effect-type="double-move"');
    expect(markup).toContain('data-board-effect="true"');
  });

  test("renders Mornye protocol takeover as a targeted Pixi layer", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      pendingSkill: {
        id: "mornye-protocol",
        effectType: "protocol-takeover",
        targetId: "6,6"
      }
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-id="mornye-protocol"');
    expect(markup).toContain('data-effect-type="protocol-takeover"');
    expect(markup).toContain('data-board-effect="true"');
  });

  test("renders Chisa liberty-purge as a targeted Pixi layer", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      pendingSkill: {
        id: "chisa-liberty-purge",
        effectType: "liberty-purge",
        targetId: "6,6",
        affectedPointIds: ["6,6", "5,6", "7,6"]
      }
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-id="chisa-liberty-purge"');
    expect(markup).toContain('data-effect-type="liberty-purge"');
    expect(markup).toContain('data-board-effect="true"');
  });

  test("renders row-slash layer metadata even when a legacy preview has no id", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      pendingSkill: {
        effectType: "row-slash",
        targetId: "4,5",
        row: 5
      }
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-type="row-slash"');
    expect(markup).toContain('data-board-effect="true"');
  });

  test("supports disabling idle Pixi prewarm for no-skill boards", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 19,
      prewarm: false,
      pendingSkill: null
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).not.toContain("prewarm");
  });

  test("supports disabling skill presentation effects from one host setting", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      effectsEnabled: false,
      pendingSkill: {
        id: "disabled-effect",
        effectType: "erase-point",
        targetId: "6,6"
      }
    }));

    expect(markup).toBe("");
    expect(effectTimingForPendingSkill({
      effectType: "erase-point",
      bannerDurationMs: 2000,
      boardEffectDurationMs: 1800
    }, { effectsEnabled: false })).toEqual({
      startDelayMs: 0,
      durationMs: 0
    });
  });

  test("keeps an already-started Pixi cast alive when the resolved room snapshot clears pendingSkill", () => {
    const source = readFileSync(new URL("./BoardSkillEffects.jsx", import.meta.url), "utf8");

    expect(source).toContain("const activeEffectCleanupRef = useRef(() => {})");
    expect(source).toContain("if (!started) preparedEffect.cleanup()");
    expect(source).toContain("activeEffectCleanupRef.current = cleanup");
    expect(source).toContain("preparedEffect.cleanup();");
    expect(source).not.toContain("cleanup();\n      preparedEffect.cleanup();");
  });
});

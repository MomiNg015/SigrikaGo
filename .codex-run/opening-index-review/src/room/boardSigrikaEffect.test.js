import { afterEach, describe, expect, test, vi } from "vitest";
import { SIGRIKA_STAR_IMPACT_PROGRESS, SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS } from "../shared/sigrikaPresentation.js";
import { skillEffectSoundCues } from "../shared/skillEffectCatalog.js";
import { playRegisteredBoardSkillEffect } from "./boardSkillEffectRegistry.js";
import { sigrikaStarFrame, sigrikaStarGeometry } from "./boardSigrikaEffect.js";

afterEach(() => vi.restoreAllMocks());

describe("Sigrika star and sleepy Sunspirit", () => {
  test("finishes a separate bright burst before revealing the Sunspirit", () => {
    const geometry = sigrikaStarGeometry({ target: { x: 180, y: 180 }, width: 360, height: 360, boardSize: 13 });
    const { sample, layers } = renderCast();
    sample(SIGRIKA_STAR_IMPACT_PROGRESS + 0.03);
    expect(layers.glow.commands.some(([method, , , points]) => method === "star" && points === 8)).toBe(true);
    expect(sigrikaStarFrame(SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS - 0.001, geometry).reveal).toBe(0);
    expect(sigrikaStarFrame(SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS, geometry).burst).toBe(1);
    sample(SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS);
    expect(layers.glow.commands.some(([method]) => method === "star")).toBe(false);
    expect(sigrikaStarFrame(SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS + 0.03, geometry).reveal).toBeGreaterThan(0);
  });
  test("contacts the target on the sound cue without an early impact", () => {
    const geometry = sigrikaStarGeometry({ target: { x: 180, y: 180 }, width: 360, height: 360, boardSize: 13 });
    const contact = skillEffectSoundCues("erase-point").impactAt;
    expect(contact).toBe(SIGRIKA_STAR_IMPACT_PROGRESS);
    expect(sigrikaStarFrame(contact - 0.001, geometry)).toMatchObject({ landed: false, impact: 0 });
    expect(sigrikaStarFrame(contact, geometry)).toMatchObject({ x: 180, y: 180, landed: true });
    const { sample, layers } = renderCast();
    sample(contact - 0.001);
    expect(layers.glow.commands).toEqual([]);
    expect(layers.rings.commands).toEqual([]);
    expect(layers.dust.commands).toEqual([]);
    sample(contact);
    expect(layers.rings.commands.some(([method]) => method === "circle")).toBe(true);
  });

  test.each(["0,0", "6,6", "12,12"])("scales the star and aligns the trail for target %s", (targetId) => {
    const [column, row] = targetId.split(",").map(Number);
    const sizes = [];
    for (const width of [360, 720]) {
      const { sample, layers } = renderCast({ width, targetId });
      sample(0.5);
      const [, x, y, , radius] = layers.star.commands.find(([method]) => method === "star");
      const [, points] = layers.trail.commands.find(([method]) => method === "poly");
      const target = { x: (column + 0.5) / 13 * width, y: (row + 0.5) / 13 * width };
      const tail = { x: points[2] - x, y: points[3] - y };
      const toTarget = { x: target.x - x, y: target.y - y };
      expect(tail.x * toTarget.y - tail.y * toTarget.x).toBeCloseTo(0, 6);
      expect(tail.x * toTarget.x + tail.y * toTarget.y).toBeLessThan(0);
      sizes.push(radius);
    }
    expect(sizes[1] / sizes[0]).toBeCloseTo(2);
  });

  test("returns stardust toward the Sunspirit and clears all transient residue", () => {
    const { sample, layer, layers } = renderCast();
    const dustRadius = () => Math.max(...layers.dust.commands
      .filter(([method]) => method === "circle" || method === "star")
      .map(([, x, y]) => Math.hypot(x - 180, y - 180)));
    sample(0.73);
    const outerRadius = dustRadius();
    sample(0.9);
    expect(dustRadius()).toBeLessThan(outerRadius / 2);
    sample(1);
    expect(layer.alpha).toBe(0);
    expect(layer.x).toBe(0);
    expect(layer.y).toBe(0);
    expect(layers.star.commands).toEqual([]);
    expect(layers.trail.commands).toEqual([]);
  });

  test("keeps reduced motion on the static hit renderer", () => {
    const { app } = renderCast({ reducedMotion: true });
    expect(app.stage.children.every((child) => child instanceof RecordingGraphics)).toBe(true);
  });
});

function renderCast({ width = 360, targetId = "6,6", reducedMotion = false } = {}) {
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  const callbacks = [];
  const app = { stage: new RecordingContainer(), ticker: { add: (callback) => callbacks.push(callback) } };
  const onError = vi.fn();
  playRegisteredBoardSkillEffect({
    app, pixi: { Graphics: RecordingGraphics, Container: RecordingContainer },
    host: { clientWidth: width, clientHeight: width }, boardSize: 13,
    pendingSkill: { effectType: "erase-point", targetId }, durationMs: 1800, reducedMotion, onError
  });
  expect(onError).not.toHaveBeenCalled();
  const layer = app.stage.children[0];
  const [rune, glow, rings, trail, star, dust] = layer.children ?? [];
  return {
    app, layer, layers: { rune, glow, rings, trail, star, dust },
    sample(progress) { now = progress * 1800; callbacks.forEach((callback) => callback()); }
  };
}

class RecordingContainer {
  children = [];
  addChild(...children) { this.children.push(...children); }
}

class RecordingGraphics {
  commands = [];
  clear() { this.commands = []; return this; }
}
for (const method of ["circle", "ellipse", "star", "poly", "moveTo", "lineTo", "fill", "stroke"]) {
  RecordingGraphics.prototype[method] = function (...args) { this.commands.push([method, ...args]); return this; };
}

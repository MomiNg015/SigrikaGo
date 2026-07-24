import fs from "node:fs";
import path from "node:path";
import { describe, expect, test, vi } from "vitest";
import { SKILL_EFFECT_CATALOG } from "../shared/skillEffectCatalog.js";
import {
  BOARD_SKILL_EFFECT_RENDERERS,
  boardSkillEffectAssetUrls,
  meteorEraseCraterAlpha,
  protocolTakeoverLockAlpha,
  playRegisteredBoardSkillEffect
} from "./boardSkillEffectRegistry.js";

describe("boardSkillEffectRegistry", () => {
  test("registers every catalog board effect", () => {
    const boardEffectTypes = Object.entries(SKILL_EFFECT_CATALOG)
      .filter(([, metadata]) => metadata.boardEffect)
      .map(([effectType]) => effectType);

    expect(Object.keys(BOARD_SKILL_EFFECT_RENDERERS).sort()).toEqual(boardEffectTypes.sort());
  });

  test("keeps hidden-hand registered as a full-board effect", () => {
    expect(BOARD_SKILL_EFFECT_RENDERERS["hidden-hand"]).toMatchObject({
      fullBoard: true,
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
  });

  test("renders Aemeath hidden-hand as a center-out line-only circuit takeover", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const hiddenHandSource = registrySource.match(/function playDataStreamHiddenHand[\s\S]*?function playReducedMotionHit/)?.[0] ?? "";
    const reducedSweepSource = registrySource.match(/function playReducedMotionBoardSweep[\s\S]*?function playReducedMotionChangliDoubleMove/)?.[0] ?? "";

    expect(hiddenHandSource).toContain("circuitBoardPoints");
    expect(hiddenHandSource).toContain("drawCircuitLanes");
    expect(hiddenHandSource).toContain("drawCircuitDiagonals");
    expect(hiddenHandSource).toContain("membraneAlpha");
    expect(hiddenHandSource).toContain("boardPointCenter");
    expect(hiddenHandSource).not.toContain("0x041810");
    expect(hiddenHandSource).not.toContain("coverAlpha");
    expect(hiddenHandSource).not.toContain("const underlay = new pixi.Graphics()");
    expect(hiddenHandSource).not.toContain("underlay.circle");
    expect(reducedSweepSource).not.toContain(".circle(center.x, center.y");
    expect(hiddenHandSource).not.toContain("drawCircuitChips");
    expect(hiddenHandSource).not.toContain("const chips");
    expect(hiddenHandSource).not.toContain("roundRect");
    expect(hiddenHandSource).not.toContain("new pixi.Text");
    expect(hiddenHandSource).not.toContain("\"01\"");
    expect(hiddenHandSource).not.toContain("\"10\"");
  });

  test("keeps ChangLi double-move registered as a full-board effect", () => {
    expect(BOARD_SKILL_EFFECT_RENDERERS["double-move"]).toMatchObject({
      fullBoard: true,
      assets: [
        "/assets/effects/changli-fire-phoenix.svg",
        "/assets/effects/changli-flame-sprite.svg"
      ],
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
  });

  test("keeps Aemeath Voyage Star registered as a full-board sword impact, quake, and dissolve effect", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const voyageSource = registrySource.match(/function playVoyageStar[\s\S]*?function playReducedMotionVoyageStar/)?.[0] ?? "";
    const reducedVoyageSource = registrySource.match(/function playReducedMotionVoyageStar[\s\S]*?function libertyPurgeSlashTargets/)?.[0] ?? "";
    const explosionCoverSource = registrySource.match(/function drawVoyageStarExplosionCover[\s\S]*?function drawVoyageStarSword/)?.[0] ?? "";

    expect(BOARD_SKILL_EFFECT_RENDERERS["voyage-star"]).toMatchObject({
      fullBoard: true,
      assets: ["/assets/effects/voyage-star-crater.webp"],
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
    expect(registrySource).toContain("VOYAGE_STAR_CRATER_IMAGE");
    expect(registrySource).toContain("VOYAGE_STAR_SOLID_CORE_CELLS");
    expect(registrySource).toContain("VOYAGE_STAR_DISSOLVE_SPARKS");
    expect(registrySource).toContain("VOYAGE_STAR_QUAKE_DUST");
    expect(registrySource).toContain("voyageStarSeed");
    expect(voyageSource).toContain("drawVoyageStarSword");
    expect(voyageSource).toContain("const quakeLayer = new pixi.Container()");
    expect(voyageSource).toContain("const omen = new pixi.Graphics()");
    expect(voyageSource).toContain("const shockwaves = new pixi.Graphics()");
    expect(voyageSource).toContain("const dust = new pixi.Graphics()");
    expect(voyageSource).toContain("const explosionCoverLayer = new pixi.Graphics()");
    expect(voyageSource).toContain("quakeLayer.addChild(omen, impactGlow, shockwaves, dust, particles, sword)");
    expect(voyageSource).toContain("app.stage.addChild(quakeLayer, explosionCoverLayer)");
    expect(voyageSource).toContain("drawVoyageStarOmen");
    expect(voyageSource).toContain("drawVoyageStarEarthquake");
    expect(voyageSource).toContain("voyageStarQuakeShake");
    expect(voyageSource).toContain("const coverProgress = easeOutCubic");
    expect(voyageSource).toContain("const coverDissolve = clamp01((progress - 0.77) / 0.21)");
    expect(voyageSource).toContain("const coverAlpha = coverDissolve > 0 ? 1 - easeInCubic(coverDissolve) : 1");
    expect(voyageSource).toContain("const fullCover = coverProgress >= 0.82");
    expect(voyageSource).toContain("const glowAlpha = fullCover");
    expect(voyageSource).toContain("const swordAlpha = fullCover");
    expect(voyageSource).toContain("? 0");
    expect(voyageSource).toContain("drawVoyageStarExplosionCover");
    expect(voyageSource).toContain("dissolveProgress: coverDissolve");
    expect(voyageSource).toContain("fall");
    expect(voyageSource).toContain("cellSize");
    expect(voyageSource).not.toContain("craterSprite");
    expect(voyageSource).not.toContain("drawVoyageStarCrater");
    expect(voyageSource).toContain("pointCenterForHost(pendingSkill?.targetId");
    expect(voyageSource).toContain("voyageStarRemovedTargets");
    expect(voyageSource).toContain("voyageStarFullCoverRadius");
    expect(voyageSource).toContain("0xffffff");
    expect(voyageSource).toContain("0xffdf85");
    expect(voyageSource).not.toContain("alpha: whiteout");
    expect(explosionCoverSource).toContain("SOFT_EXPLOSION_EDGE_STEPS");
    expect(explosionCoverSource).toContain("solidCoreRadius");
    expect(explosionCoverSource).toContain("cellSize * VOYAGE_STAR_SOLID_CORE_CELLS");
    expect(explosionCoverSource).toContain("solidTransitionRadius");
    expect(explosionCoverSource).toContain("transitionAlpha");
    expect(explosionCoverSource).toContain("edgeFeather");
    expect(explosionCoverSource).toContain("edgeProgress");
    expect(explosionCoverSource).toContain("Math.pow(1 - edgeProgress, 2.35)");
    expect(explosionCoverSource).toContain("if (layerAlpha > 0.001)");
    expect(explosionCoverSource).toContain("0.86 * alpha");
    expect(explosionCoverSource).toContain("0.68 * alpha");
    expect(explosionCoverSource).not.toContain("radius * 1.24");
    expect(explosionCoverSource).toContain("0xfff4c4");
    expect(explosionCoverSource).toContain("0xffed9a");
    expect(explosionCoverSource).toContain("if (fullCover)");
    expect(explosionCoverSource).toContain("rect(0, 0, width, height)");
    expect(explosionCoverSource).toContain("fill({ color: 0xffffff, alpha })");
    expect(explosionCoverSource).toContain("drawVoyageStarDissolve");
    expect(explosionCoverSource).not.toContain("0.5 * alpha");
    expect(explosionCoverSource).not.toContain("0.58 * alpha");
    expect(reducedVoyageSource).toContain("0xfff4c4");
    expect(reducedVoyageSource).not.toContain("craterSprite");
    expect(reducedVoyageSource).not.toContain("drawVoyageStarCrater");
    expect(reducedVoyageSource).not.toContain("0.32 * alpha");
    expect(registrySource).not.toContain("voyageStarCraterCenterForHost");
    expect(registrySource).not.toContain("x: target.x - cellWidth");
    expect(registrySource).not.toContain("y: target.y - cellHeight");
    expect(registrySource).toContain("const bladeTip = y");
    expect(registrySource).toContain("const bladeBase = y - size * 0.96");
    expect(registrySource).not.toContain("const bladeBottom = y + size * 0.18");
  });

  test("preloads Voyage Star crater artwork for the resolved board marker", () => {
    expect(boardSkillEffectAssetUrls("voyage-star")).toEqual(["/assets/effects/voyage-star-crater.webp"]);
  });

  test("fades targeted transient renderer residue to transparent before cleanup", () => {
    expect(protocolTakeoverLockAlpha({ impact: 1, residue: 1, fade: 0 })).toBe(0);
    expect(protocolTakeoverLockAlpha({ impact: 1, residue: 0.5, fade: 0.25 })).toBeGreaterThan(0);
    expect(meteorEraseCraterAlpha({ progress: 1, craterProgress: 1 })).toBe(0);
    expect(meteorEraseCraterAlpha({ progress: 0.7, craterProgress: 0.4 })).toBeGreaterThan(0);
  });

  test("exposes renderer asset urls for banner-window preloading", () => {
    expect(boardSkillEffectAssetUrls("flip-stone")).toEqual(["/assets/effects/denia-bubble-pop.webp"]);
    expect(boardSkillEffectAssetUrls("random-blast")).toEqual(["/assets/characters/portraits/baconbits.webp"]);
    expect(boardSkillEffectAssetUrls("row-slash")).toEqual([]);
    expect(boardSkillEffectAssetUrls("unknown-effect")).toEqual([]);
  });

  test("runs hidden-hand through the Pixi renderer smoke path", () => {
    const { app, pixi, tickerCallbacks } = createSmokePixi();
    const onError = vi.fn();

    playRegisteredBoardSkillEffect({
      app,
      pixi,
      host: smokeHost(),
      boardSize: 13,
      pendingSkill: { effectType: "hidden-hand", targetId: "6,6" },
      durationMs: 1500,
      reducedMotion: false,
      onError
    });

    expect(onError).not.toHaveBeenCalled();
    expect(app.stage.children.length).toBeGreaterThan(0);
    expect(tickerCallbacks).toHaveLength(1);
    expect(() => tickerCallbacks[0]()).not.toThrow();
  });

  test("runs Voyage Star through the Pixi renderer smoke path", () => {
    const { app, pixi, tickerCallbacks } = createSmokePixi();
    const onError = vi.fn();

    playRegisteredBoardSkillEffect({
      app,
      pixi,
      host: smokeHost(),
      boardSize: 13,
      pendingSkill: {
        effectType: "voyage-star",
        targetId: "6,6",
        removedStones: [{ id: "5,6" }, { id: "6,5" }]
      },
      durationMs: 1800,
      reducedMotion: false,
      onError
    });

    expect(onError).not.toHaveBeenCalled();
    expect(app.stage.children.length).toBeGreaterThan(0);
    expect(tickerCallbacks).toHaveLength(1);
    expect(() => tickerCallbacks[0]()).not.toThrow();
  });

  test("reports invalid Voyage Star runtime input without throwing out of the room UI", () => {
    const { app, pixi } = createSmokePixi();
    const onError = vi.fn();

    expect(() => playRegisteredBoardSkillEffect({
      app,
      pixi,
      host: smokeHost({ clientWidth: 260, clientHeight: 260 }),
      boardSize: 13,
      pendingSkill: { effectType: "voyage-star", targetId: "" },
      durationMs: 1800,
      reducedMotion: false,
      onError
    })).not.toThrow();

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  test("keeps ChangLi fire field irregular instead of drawing a full-canvas rectangle", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const assetSource = fs.readFileSync(path.resolve("src/room/boardSkillEffectAssets.js"), "utf8");
    const changliSource = registrySource.match(/function playChangliDoubleMove[\s\S]*?function changliFlamePointIds/)?.[0] ?? "";

    expect(changliSource).toContain("drawChangliFireField");
    expect(changliSource).not.toContain(".rect(0, 0, width, height)");
    expect(assetSource).toContain("/assets/effects/changli-fire-phoenix.svg");
    expect(assetSource).toContain("/assets/effects/changli-flame-sprite.svg");
  });

  test("keeps Mornye protocol takeover registered as a targeted Pixi beam effect", () => {
    expect(BOARD_SKILL_EFFECT_RENDERERS["protocol-takeover"]).toMatchObject({
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
  });

  test("plays Lynae spray animation on every transformed point", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const spraySource = registrySource.match(/function playSprayStone[\s\S]*?function drawCracks/)?.[0] ?? "";

    expect(BOARD_SKILL_EFFECT_RENDERERS["spray-stone"]).toMatchObject({
      play: expect.any(Function)
    });
    expect(spraySource).toContain("sprayEffectTargets");
    expect(spraySource).toContain("pendingSkill?.affectedPointIds");
    expect(spraySource).toContain("for (const [targetIndex, effectTarget] of targets.entries())");
  });

  test("plays Chisa liberty-purge as delayed sequential scissor slashes over removal points", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const libertySource = registrySource.match(/function playLibertyPurge[\s\S]*?function sprayEffectTargets/)?.[0] ?? "";

    expect(BOARD_SKILL_EFFECT_RENDERERS["liberty-purge"]).toMatchObject({
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
    expect(libertySource).toContain("libertyPurgeSlashTargets");
    expect(libertySource).toContain("pendingSkill?.removalMarkIds");
    expect(libertySource).toContain("pendingSkill?.affectedPointIds");
    expect(libertySource).toContain("pointId !== pendingSkill?.targetId");
    expect(libertySource).toContain("LIBERTY_PURGE_SLASH_STAGGER_MS");
    expect(libertySource).toContain("LIBERTY_PURGE_SLASH_DRAW_MS");
    expect(libertySource).not.toContain("slice(0, 7)");
    expect(libertySource).toContain("drawScissorSlash");
    expect(libertySource).toContain("0xff1733");
  });

  test("keeps Sigrika meteor impact crater dark during impact but fades before cleanup", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const meteorSource = registrySource.match(/function playMeteorErase[\s\S]*?function playBubbleFlip/)?.[0] ?? "";

    expect(meteorSource).toContain("const craterAlpha = meteorEraseCraterAlpha({ progress, craterProgress })");
    expect(meteorSource).toContain("fill({ color: 0x4a4648, alpha: craterAlpha })");
    expect(meteorSource).not.toContain("fill({ color: 0x000000");
  });

  test("plays QiuYuan row-slash as a Pixi ink-blade cast before the DOM row scar persists", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const rowSlashSource = registrySource.match(/function playRowSlash[\s\S]*?function playReducedMotionRowSlash/)?.[0] ?? "";

    expect(BOARD_SKILL_EFFECT_RENDERERS["row-slash"]).toMatchObject({
      fullBoard: true,
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
    expect(registrySource).toContain("ROW_SLASH_INK_PARTICLES");
    expect(registrySource).toContain("ROW_SLASH_SPARKS");
    expect(rowSlashSource).toContain("drawRowSlashOmen");
    expect(rowSlashSource).toContain("drawRowSlashCharge");
    expect(rowSlashSource).toContain("drawRowSlashInkBrush");
    expect(rowSlashSource).toContain("drawRowSlashLeadingEdge");
    expect(rowSlashSource).toContain("drawRowSlashInkSparks");
    expect(rowSlashSource).toContain("drawRowSlashStoneCut");
    expect(rowSlashSource).toContain("rowSlashCutTargets");
    expect(rowSlashSource).toContain("const main = easeOutCubic(clamp01((progress - 0.19) / 0.22))");
    expect(rowSlashSource).toContain("0.23 + xProgress * 0.17");
    expect(registrySource).toContain("drawRowSlashOmenBrush");
    expect(registrySource).toContain("travelDuration: 0.17");
    expect(registrySource).toContain("const fadeOut = 1 - clamp01((progress - 0.54) / 0.18)");
    expect(registrySource).toContain("const sweep = easeOutCubic(clamp01(raw))");
    expect(registrySource).toContain("(Math.PI / 3)");
    expect(registrySource).toContain("reveal: sweep");
    expect(registrySource).toContain("direction: flash.direction");
    expect(registrySource).toContain("const brushHeight = cellSize * 1.8");
    expect(registrySource).toContain("drawRowSlashInkSmears");
    expect(registrySource).toContain("drawRowSlashBladeGlow");
    expect(registrySource).toContain("const glowLayers = [");
    expect(registrySource).toContain("color: 0xbffff5");
    expect(registrySource).toContain("color: 0xe8fffb");
    expect(registrySource).toContain("spread: brushHeight * 0.74");
    expect(registrySource).toContain("0x0e2935");
    expect(registrySource).toContain("0x286d76");
    expect(registrySource).toContain("0x5c9190");
    expect(registrySource).not.toContain("width: Math.max(10, cellSize * 0.34)");
    expect(registrySource).toContain("Math.hypot(width, height) * 1.42");
    expect(registrySource).toContain("seedIndex: 112");
    expect(registrySource).toContain("seedIndex: 137");
    expect(registrySource).toContain("rowSlashSeed");
    expect(rowSlashSource).not.toContain("fill({ color: 0xaefcf1");
    expect(rowSlashSource).not.toContain("fill({ color: 0xdffff9");
    expect(rowSlashSource).not.toContain("fill({ color: 0x6fd9d6");
    expect(registrySource).toContain("0xffffff");
    expect(registrySource).not.toContain("QIUYUAN_BLADE_STREAK_IMAGE");
    expect(registrySource).not.toContain("/assets/effects/qiuyuan-blade-streak.svg");
  });

  test("skips unknown effects without touching the Pixi stage", () => {
    const app = { stage: { addChild: () => { throw new Error("should not draw"); } } };

    expect(() => playRegisteredBoardSkillEffect({
      app,
      pixi: {},
      host: { clientWidth: 260, clientHeight: 260 },
      boardSize: 13,
      pendingSkill: { effectType: "unknown-effect", targetId: "6,6" },
      durationMs: 1000,
      reducedMotion: false
    })).not.toThrow();
  });

  test("reports renderer failures without throwing out of the room UI", () => {
    const onError = vi.fn();

    expect(() => playRegisteredBoardSkillEffect({
      app: { stage: { addChild: vi.fn() } },
      pixi: {},
      host: { clientWidth: 260, clientHeight: 260 },
      boardSize: 13,
      pendingSkill: { effectType: "boom", targetId: "6,6" },
      durationMs: 1000,
      reducedMotion: false,
      renderers: {
        boom: {
          play: () => {
            throw new Error("renderer failed");
          }
        }
      },
      onError
    })).not.toThrow();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

function smokeHost(overrides = {}) {
  return {
    clientWidth: 260,
    clientHeight: 260,
    ...overrides
  };
}

function createSmokePixi() {
  const tickerCallbacks = [];
  class Graphics {
    clear() { return this; }
    rect() { return this; }
    circle() { return this; }
    ellipse() { return this; }
    poly() { return this; }
    star() { return this; }
    moveTo() { return this; }
    lineTo() { return this; }
    quadraticCurveTo() { return this; }
    bezierCurveTo() { return this; }
    fill() { return this; }
    stroke() { return this; }
  }
  class Container {
    constructor() {
      this.children = [];
      this.x = 0;
      this.y = 0;
    }
    addChild(...children) {
      this.children.push(...children);
      return children[0] ?? null;
    }
  }
  const app = {
    stage: new Container(),
    ticker: {
      add: vi.fn((callback) => tickerCallbacks.push(callback))
    }
  };
  return {
    app,
    pixi: { Container, Graphics },
    tickerCallbacks
  };
}

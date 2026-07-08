import {
  LIBERTY_PURGE_SLASH_DRAW_MS,
  LIBERTY_PURGE_SLASH_EXIT_MS,
  LIBERTY_PURGE_SLASH_INITIAL_DELAY_MS,
  LIBERTY_PURGE_SLASH_STAGGER_MS
} from "../shared/skillPresentation.js";
import {
  BACONBITS_IMAGE,
  CHANGLI_FIRE_PHOENIX_IMAGE,
  CHANGLI_FLAME_SPRITE_IMAGE,
  DANEA_BUBBLE_IMAGE,
  VOYAGE_STAR_CRATER_IMAGE,
  boardSkillEffectAssetUrls,
  boardSkillEffectBlockingAssetUrls
} from "./boardSkillEffectAssets.js";
import { boardPointCenter, pointCenterForHost } from "./boardSkillEffectGeometry.js";

const SOFT_EXPLOSION_EDGE_STEPS = 44;
const VOYAGE_STAR_DISSOLVE_SPARKS = 46;
const VOYAGE_STAR_QUAKE_DUST = 34;
const VOYAGE_STAR_SOLID_CORE_CELLS = 2.2;
const ROW_SLASH_INK_PARTICLES = 28;
const ROW_SLASH_SPARKS = 16;
const MORNYE_PROTOCOL_COLORS = Object.freeze({
  core: 0xf8f6ff,
  ice: 0xbdefff,
  lavender: 0xc9b8ff,
  lilac: 0x9f8cff,
  shadow: 0x6f7fb6
});

export function protocolTakeoverLockAlpha({ impact, residue, fade }) {
  return Math.min(1, impact * 1.3) * (1 - residue * 0.18) * fade;
}

export function meteorEraseCraterAlpha({ progress, craterProgress }) {
  const exitFade = 1 - clamp01((progress - 0.84) / 0.14);
  return craterProgress > 0 ? exitFade : 0;
}

export function playRegisteredBoardSkillEffect({
  app,
  pixi,
  host,
  boardSize,
  pendingSkill,
  durationMs,
  reducedMotion,
  renderers = BOARD_SKILL_EFFECT_RENDERERS,
  onError = () => {}
}) {
  try {
    const renderer = renderers[pendingSkill?.effectType];
    if (!renderer) return;
    assertPlayableBoardEffectHost({ app, host, durationMs, effectType: pendingSkill?.effectType });
    if (renderer.fullBoard) {
      const play = reducedMotion ? renderer.playReducedMotion : renderer.play;
      play?.({ app, pixi, host, boardSize, pendingSkill, durationMs });
      return;
    }
    const target = pointCenterForHost(pendingSkill.targetId, { boardSize, host });
    if (!isFinitePoint(target)) {
      throw new Error(`Pixi board effect target is unavailable for ${pendingSkill?.effectType ?? "unknown"}`);
    }
    if (reducedMotion) {
      const play = renderer.playReducedMotion ?? playReducedMotionHit;
      play({ app, pixi, host, boardSize, pendingSkill, target, durationMs });
      return;
    }
    renderer.play({ app, pixi, host, boardSize, pendingSkill, target, durationMs });
  } catch (error) {
    onError(error);
  }
}

export { boardSkillEffectAssetUrls, boardSkillEffectBlockingAssetUrls };

export async function loadPixiAssetList(pixi, urls) {
  if (!pixi?.Assets?.load || urls.length === 0) return [];
  const result = await pixi.Assets.load(urls);
  if (Array.isArray(result)) return result;
  return urls.map((url) => result?.[url] ?? null);
}

function playReducedMotionBoardSweep({ app, pixi, host, durationMs }) {
  const sweep = new pixi.Graphics();
  app.stage.addChild(sweep);
  const startedAt = performance.now();
  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const alpha = 0.28 * (1 - progress);
    sweep.clear()
      .rect(0, 0, host.clientWidth, host.clientHeight)
      .fill({ color: 0x102d23, alpha: alpha * 0.4 });
  });
}

function playReducedMotionChangliDoubleMove({ app, pixi, host, durationMs }) {
  const pulse = new pixi.Graphics();
  app.stage.addChild(pulse);
  const center = { x: host.clientWidth / 2, y: host.clientHeight / 2 };
  const maxRadius = Math.hypot(host.clientWidth, host.clientHeight) * 0.5;
  const startedAt = performance.now();
  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const alpha = 0.34 * (1 - progress);
    pulse.clear();
    drawChangliFireField({
      graphics: pulse,
      center,
      width: host.clientWidth,
      height: host.clientHeight,
      maxRadius,
      progress,
      boardIgnite: easeOutCubic(progress),
      fireAlpha: alpha,
      shake: 0
    });
    pulse.circle(center.x, center.y, Math.min(host.clientWidth, host.clientHeight) * (0.28 + progress * 0.18))
      .stroke({ width: 4, color: 0xffc15a, alpha });
  });
}

function playChangliDoubleMove({ app, pixi, host, boardSize, durationMs }) {
  const width = host.clientWidth;
  const height = host.clientHeight;
  const center = { x: width / 2, y: height / 2 };
  const maxRadius = Math.hypot(width, height) * 0.52;
  const wash = new pixi.Graphics();
  const heat = new pixi.Graphics();
  const embers = new pixi.Graphics();
  const phoenixLayer = new pixi.Container();
  const flameLayer = new pixi.Container();
  app.stage.addChild(wash, flameLayer, heat, phoenixLayer, embers);

  let phoenix = null;
  let phoenixAspect = 1;
  const pointFlames = [];
  const pointIds = changliFlamePointIds(boardSize);
  void loadPixiAssetList(pixi, [CHANGLI_FIRE_PHOENIX_IMAGE, CHANGLI_FLAME_SPRITE_IMAGE]).then(([phoenixTexture, flameTexture]) => {
    if (!phoenixTexture || !flameTexture) return;
    phoenix = new pixi.Sprite({ texture: phoenixTexture });
    phoenixAspect = phoenixTexture.height && phoenixTexture.width ? phoenixTexture.height / phoenixTexture.width : 1;
    phoenix.anchor.set(0.5);
    phoenix.blendMode = "add";
    phoenixLayer.addChild(phoenix);

    const flameBaseSize = Math.max(22, Math.min(width, height) / boardSize * 1.45);
    for (const [index, pointId] of pointIds.entries()) {
      const point = boardPointCenter(pointId, { boardSize, width, height });
      const sprite = new pixi.Sprite({ texture: flameTexture });
      sprite.anchor.set(0.5, 0.78);
      const baseWidth = flameBaseSize * (0.82 + (index % 5) * 0.08);
      const baseHeight = baseWidth * 1.16;
      sprite.width = baseWidth;
      sprite.height = baseHeight;
      sprite.x = point.x;
      sprite.y = point.y + sprite.height * 0.22;
      sprite.alpha = 0;
      sprite.blendMode = "add";
      flameLayer.addChild(sprite);
      pointFlames.push({ sprite, point, phase: index * 0.37, baseWidth, baseHeight });
    }
  }).catch(() => {});

  const startedAt = performance.now();
  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const fly = easeOutCubic(Math.min(progress / 0.46, 1));
    const boardIgnite = easeOutCubic(clamp01((progress - 0.22) / 0.42));
    const sustain = 1 - clamp01((progress - 0.76) / 0.22);
    const fireAlpha = boardIgnite * sustain;
    const shake = progress > 0.32 && progress < 0.68 ? Math.sin(progress * 96) * 1.8 * fireAlpha : 0;

    if (phoenix) {
      const start = { x: width + maxRadius * 0.2, y: -height * 0.18 };
      const target = { x: center.x, y: center.y - height * 0.04 };
      const impactFade = clamp01((progress - 0.42) / 0.24);
      phoenix.x = lerp(start.x, target.x, fly);
      phoenix.y = lerp(start.y, target.y, fly) + Math.sin(progress * Math.PI * 7) * 5;
      phoenix.rotation = lerp(-0.72, 0.06, fly);
      phoenix.alpha = progress < 0.66 ? 1 * (1 - impactFade * 0.28) : 0.66 * (1 - clamp01((progress - 0.66) / 0.24));
      const phoenixWidth = Math.min(width, height) * (0.82 + fly * 0.38 + impactFade * 0.22);
      phoenix.width = phoenixWidth;
      phoenix.height = phoenixWidth * phoenixAspect;
    }

    wash.clear();
    drawChangliFireField({ graphics: wash, center, width, height, maxRadius, progress, boardIgnite, fireAlpha, shake });

    heat.clear();
    for (let index = 0; index < 9; index += 1) {
      const lane = index / 8;
      const y = height * (0.14 + lane * 0.78) + Math.sin(progress * 8 + index) * 3;
      const wave = Math.sin(progress * 13 + index * 0.9) * 8 * fireAlpha;
      heat.moveTo(width * 0.08, y)
        .bezierCurveTo(width * 0.3, y - 18 - wave, width * 0.68, y + 18 + wave, width * 0.92, y)
        .stroke({ width: 1.5, color: index % 2 ? 0xffb038 : 0xff5a22, alpha: 0.1 * fireAlpha });
    }

    embers.clear();
    for (let index = 0; index < 34; index += 1) {
      const drift = (progress * (0.68 + (index % 5) * 0.06) + index * 0.071) % 1;
      const angle = index * 2.399;
      const x = center.x + Math.cos(angle) * maxRadius * (0.12 + (index % 7) * 0.07) + Math.sin(progress * 9 + index) * 7;
      const y = height * (1.06 - drift * 1.12);
      embers.circle(x, y, 1.1 + (index % 3) * 0.55)
        .fill({ color: index % 4 ? 0xff9b30 : 0xffffff, alpha: 0.64 * fireAlpha * Math.sin(drift * Math.PI) });
    }

    for (const { sprite, point, phase, baseWidth, baseHeight } of pointFlames) {
      const pulse = 0.86 + Math.sin(progress * 12 + phase) * 0.12;
      sprite.x = point.x + Math.sin(progress * 10 + phase) * 2.2;
      sprite.y = point.y + sprite.height * 0.22 - Math.sin(progress * 11 + phase) * 2;
      sprite.alpha = 0.72 * fireAlpha * (0.78 + Math.sin(progress * 15 + phase) * 0.16);
      sprite.width = baseWidth * pulse;
      sprite.height = baseHeight * (0.94 + (pulse - 0.86));
      sprite.rotation = Math.sin(progress * 7 + phase) * 0.08;
    }
  });
}

function drawChangliFireField({ graphics, center, width, height, maxRadius, progress, boardIgnite, fireAlpha, shake }) {
  const coreRadius = maxRadius * (0.12 + boardIgnite * 0.36);
  const outerRadius = maxRadius * (0.22 + boardIgnite * 0.58);
  graphics.circle(center.x + shake, center.y, coreRadius)
    .fill({ color: 0xff4a1f, alpha: 0.1 * fireAlpha })
    .circle(center.x - shake * 0.5, center.y + height * 0.02, coreRadius * 0.58)
    .fill({ color: 0xffd66a, alpha: 0.08 * fireAlpha });

  for (let index = 0; index < 13; index += 1) {
    const angle = index * 2.399 + progress * (0.28 + (index % 3) * 0.06);
    const lane = 0.34 + (index % 5) * 0.11;
    const x = center.x + Math.cos(angle) * outerRadius * lane + Math.sin(progress * 10 + index) * 6 * fireAlpha;
    const y = center.y + Math.sin(angle) * outerRadius * lane * 0.72 + Math.cos(progress * 8 + index) * 5 * fireAlpha;
    const radius = maxRadius * (0.08 + (index % 4) * 0.018) * (0.62 + boardIgnite * 0.86);
    graphics.ellipse(x, y, radius * (1.1 + (index % 3) * 0.28), radius * (0.5 + (index % 4) * 0.08))
      .fill({ color: index % 2 ? 0xff8b2c : 0xff3d1c, alpha: 0.055 * fireAlpha });
  }

  for (let index = 0; index < 16; index += 1) {
    const angle = index * 0.73 + progress * 0.42;
    const startRadius = outerRadius * (0.34 + (index % 4) * 0.04);
    const endRadius = outerRadius * (0.72 + (index % 5) * 0.035);
    const startX = center.x + Math.cos(angle) * startRadius;
    const startY = center.y + Math.sin(angle) * startRadius * 0.74;
    const endX = center.x + Math.cos(angle + Math.sin(progress * 7 + index) * 0.2) * endRadius;
    const endY = center.y + Math.sin(angle + Math.cos(progress * 8 + index) * 0.16) * endRadius * 0.74;
    const bendX = center.x + Math.cos(angle + 0.46) * outerRadius * 0.58;
    const bendY = center.y + Math.sin(angle - 0.32) * outerRadius * 0.46;
    graphics.moveTo(startX, startY)
      .bezierCurveTo(bendX, bendY, lerp(startX, endX, 0.76), lerp(startY, endY, 0.54), endX, endY)
      .stroke({
        width: 3.6 + (index % 4) * 1.2,
        color: index % 3 === 0 ? 0xffdc73 : 0xff5a22,
        alpha: 0.13 * fireAlpha
      });
  }
}

function changliFlamePointIds(boardSize) {
  const max = Math.max(0, boardSize - 1);
  const mid = Math.floor(max / 2);
  const anchors = [
    [0, 0], [mid, 0], [max, 0],
    [0, mid], [mid, mid], [max, mid],
    [0, max], [mid, max], [max, max],
    [Math.floor(max * 0.25), Math.floor(max * 0.25)],
    [Math.ceil(max * 0.75), Math.floor(max * 0.25)],
    [Math.floor(max * 0.25), Math.ceil(max * 0.75)],
    [Math.ceil(max * 0.75), Math.ceil(max * 0.75)]
  ];
  const ids = new Set();
  for (const [x, y] of anchors) ids.add(`${x},${y}`);
  return [...ids];
}

function playDataStreamHiddenHand({ app, pixi, host, boardSize, durationMs }) {
  const gridLines = new pixi.Graphics();
  const diagonals = new pixi.Graphics();
  const membrane = new pixi.Graphics();
  const afterglow = new pixi.Graphics();
  const width = host.clientWidth;
  const height = host.clientHeight;
  const center = { x: width / 2, y: height / 2 };
  app.stage.addChild(gridLines, diagonals, membrane, afterglow);
  const points = circuitBoardPoints({ boardSize, width, height });
  const horizontalLanes = circuitGridLanes(points, boardSize, "horizontal");
  const verticalLanes = circuitGridLanes(points, boardSize, "vertical");
  const diagonalLinks = circuitDiagonalLinks(points, boardSize);
  const maxRadius = Math.hypot(width, height) * 0.58;
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const ignition = easeOutCubic(clamp01(progress / 0.18));
    const spread = easeOutCubic(clamp01((progress - 0.08) / 0.52));
    const exit = clamp01((progress - 0.74) / 0.22);
    const alpha = ignition * (1 - exit);
    const radius = maxRadius * spread;
    const membraneLocal = clamp01((progress - 0.48) / 0.18);
    const membraneFade = clamp01((progress - 0.64) / 0.16);
    const membraneAlpha = Math.sin(membraneLocal * Math.PI) * (1 - membraneFade * 0.35);

    gridLines.clear();
    diagonals.clear();
    membrane.clear();
    afterglow.clear();

    drawCircuitLanes(gridLines, horizontalLanes, { center, radius, progress, alpha, width: 2.6, color: 0x2dff89 });
    drawCircuitLanes(gridLines, verticalLanes, { center, radius, progress, alpha, width: 2.1, color: 0xb9ffda });
    drawCircuitDiagonals(diagonals, diagonalLinks, { center, radius, progress, alpha });

    if (membraneAlpha > 0) {
      membrane.rect(0, 0, width, height)
        .stroke({ width: 2, color: 0x7dffc2, alpha: 0.2 * membraneAlpha });
      drawCircuitLanes(membrane, horizontalLanes, {
        center,
        radius: maxRadius,
        progress: 1,
        alpha: membraneAlpha,
        width: 1.5,
        color: 0x8dffc8
      });
      drawCircuitLanes(membrane, verticalLanes, {
        center,
        radius: maxRadius,
        progress: 1,
        alpha: membraneAlpha,
        width: 1.2,
        color: 0xffffff
      });
    }

    const residue = clamp01((progress - 0.68) / 0.28);
    if (residue > 0) {
      for (let index = 0; index < 18; index += 1) {
        const angle = index * 2.399 + progress * 0.38;
        const distance = maxRadius * (0.14 + residue * (0.72 + (index % 4) * 0.04));
        afterglow.rect(
          center.x + Math.cos(angle) * distance,
          center.y + Math.sin(angle) * distance * 0.88,
          3 + (index % 3) * 2,
          1.5
        ).fill({ color: index % 3 ? 0x55ff9f : 0xffffff, alpha: 0.28 * alpha * (1 - residue) });
      }
    }
  });
}

function circuitBoardPoints({ boardSize, width, height }) {
  const points = [];
  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const point = boardPointCenter(`${x},${y}`, { boardSize, width, height });
      points.push({
        ...point,
        boardX: x,
        boardY: y,
        phase: ((x * 17 + y * 31) % 23) / 23
      });
    }
  }
  return points;
}

function circuitGridLanes(points, boardSize, direction) {
  const lanes = [];
  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize - 1; x += 1) {
      const first = direction === "horizontal"
        ? points[y * boardSize + x]
        : points[x * boardSize + y];
      const second = direction === "horizontal"
        ? points[y * boardSize + x + 1]
        : points[(x + 1) * boardSize + y];
      lanes.push({
        first,
        second,
        phase: ((first.boardX + 1) * 11 + (first.boardY + 1) * 7) % 13 / 13
      });
    }
  }
  return lanes;
}

function circuitDiagonalLinks(points, boardSize) {
  const links = [];
  for (let y = 1; y < boardSize - 1; y += 2) {
    for (let x = 1; x < boardSize - 1; x += 3) {
      const first = points[y * boardSize + x];
      const xOffset = (x + y) % 2 === 0 ? 1 : -1;
      const yOffset = (x * 3 + y) % 2 === 0 ? 1 : -1;
      const second = points[(y + yOffset) * boardSize + x + xOffset];
      if (first && second) links.push({ first, second, phase: ((x + 2) * (y + 3)) % 17 / 17 });
    }
  }
  return links;
}

function drawCircuitLanes(graphics, lanes, { center, radius, progress, alpha, width, color }) {
  for (const lane of lanes) {
    const midpoint = {
      x: (lane.first.x + lane.second.x) / 2,
      y: (lane.first.y + lane.second.y) / 2
    };
    const distance = Math.hypot(midpoint.x - center.x, midpoint.y - center.y);
    const reveal = clamp01((radius - distance + 26) / 52);
    if (!reveal) continue;
    const streak = 0.62 + Math.sin(progress * 34 + lane.phase * Math.PI * 2) * 0.26;
    const lineAlpha = alpha * reveal * (0.26 + streak * 0.28);
    graphics.moveTo(lane.first.x, lane.first.y)
      .lineTo(lane.second.x, lane.second.y)
      .stroke({ width, color, alpha: lineAlpha });
  }
}

function drawCircuitDiagonals(graphics, links, { center, radius, progress, alpha }) {
  for (const link of links) {
    const midpoint = {
      x: (link.first.x + link.second.x) / 2,
      y: (link.first.y + link.second.y) / 2
    };
    const distance = Math.hypot(midpoint.x - center.x, midpoint.y - center.y);
    const reveal = clamp01((radius - distance + 18) / 46);
    if (!reveal) continue;
    graphics.moveTo(link.first.x, link.first.y)
      .lineTo(link.second.x, link.second.y)
      .stroke({
        width: 1.15,
        color: link.phase > 0.5 ? 0xbaffdf : 0x25ff84,
        alpha: alpha * reveal * (0.12 + Math.sin(progress * 20 + link.phase * 5) * 0.04)
      });
  }
}

function playReducedMotionHit({ app, pixi, target, durationMs }) {
  const ring = new pixi.Graphics();
  app.stage.addChild(ring);
  const startedAt = performance.now();
  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    ring.clear()
      .circle(target.x, target.y, 16 + progress * 10)
      .stroke({ width: 4, color: 0xffffff, alpha: 0.7 * (1 - progress) });
  });
}

function playReducedMotionProtocolTakeover({ app, pixi, target, durationMs }) {
  const marker = new pixi.Graphics();
  app.stage.addChild(marker);
  const startedAt = performance.now();
  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const fade = 1 - progress;
    marker.clear()
      .circle(target.x, target.y, 18 + progress * 8)
      .stroke({ width: 3, color: MORNYE_PROTOCOL_COLORS.lavender, alpha: 0.56 * fade })
      .moveTo(target.x - 18, target.y)
      .lineTo(target.x + 18, target.y)
      .moveTo(target.x, target.y - 18)
      .lineTo(target.x, target.y + 18)
      .stroke({ width: 2, color: MORNYE_PROTOCOL_COLORS.core, alpha: 0.5 * fade });
  });
}

function playProtocolTakeover({ app, pixi, host, target, durationMs }) {
  const shaft = new pixi.Graphics();
  const threads = new pixi.Graphics();
  const scan = new pixi.Graphics();
  const lock = new pixi.Graphics();
  const sparks = new pixi.Graphics();
  app.stage.addChild(shaft, threads, scan, lock, sparks);
  const width = host.clientWidth;
  const height = host.clientHeight;
  const topY = -Math.max(36, height * 0.12);
  const beamWidth = Math.max(28, Math.min(width, height) * 0.1);
  const lineCount = 11;
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const enter = easeOutCubic(Math.min(progress / 0.34, 1));
    const impact = clamp01((progress - 0.34) / 0.28);
    const residue = clamp01((progress - 0.58) / 0.34);
    const fade = 1 - clamp01((progress - 0.72) / 0.22);
    const activeAlpha = enter * fade;
    const scanY = lerp(topY, target.y, enter);
    const jitter = Math.sin(progress * 78) * 1.2 * activeAlpha;

    shaft.clear();
    shaft.moveTo(target.x - beamWidth * 0.52 + jitter, topY)
      .lineTo(target.x + beamWidth * 0.46 + jitter, topY)
      .lineTo(target.x + beamWidth * 0.18, target.y + 2)
      .lineTo(target.x - beamWidth * 0.22, target.y + 2)
      .fill({ color: MORNYE_PROTOCOL_COLORS.lavender, alpha: 0.09 * activeAlpha })
      .moveTo(target.x - beamWidth * 0.18, topY)
      .lineTo(target.x + beamWidth * 0.18, topY)
      .lineTo(target.x + 3, target.y)
      .lineTo(target.x - 3, target.y)
      .fill({ color: MORNYE_PROTOCOL_COLORS.ice, alpha: 0.12 * activeAlpha });

    threads.clear();
    for (let index = 0; index < lineCount; index += 1) {
      const lane = (index - (lineCount - 1) / 2) / ((lineCount - 1) / 2);
      const phase = progress * (10 + (index % 4) * 1.4) + index * 0.82;
      const weave = Math.sin(phase) * beamWidth * 0.16;
      const startX = target.x + lane * beamWidth * 0.54 + weave;
      const endX = target.x + lane * beamWidth * 0.08 + Math.cos(phase * 0.7) * 4;
      const midX = lerp(startX, endX, 0.5) + Math.sin(phase * 1.3) * beamWidth * 0.2;
      const visibleEndY = lerp(topY, target.y, Math.min(1, enter + index * 0.018));
      threads.moveTo(startX, topY + 8)
        .bezierCurveTo(midX, height * 0.18, midX - lane * 10, height * 0.48, endX, visibleEndY)
        .stroke({
          width: index % 3 === 0 ? 2.2 : 1.2,
          color: index % 4 === 0 ? MORNYE_PROTOCOL_COLORS.core : index % 2 ? MORNYE_PROTOCOL_COLORS.ice : MORNYE_PROTOCOL_COLORS.lilac,
          alpha: (index % 3 === 0 ? 0.42 : 0.26) * activeAlpha
        });
    }

    scan.clear();
    if (progress < 0.68) {
      scan.ellipse(target.x, scanY, beamWidth * (0.46 + impact * 0.45), 5 + impact * 3)
        .fill({ color: MORNYE_PROTOCOL_COLORS.core, alpha: 0.28 * activeAlpha })
        .stroke({ width: 2, color: MORNYE_PROTOCOL_COLORS.lavender, alpha: 0.5 * activeAlpha });
    }

    lock.clear();
    const lockAlpha = protocolTakeoverLockAlpha({ impact, residue, fade });
    if (lockAlpha > 0) {
      const radius = 13 + impact * 10 + residue * 4;
      lock.circle(target.x, target.y, radius)
        .stroke({ width: 3, color: MORNYE_PROTOCOL_COLORS.lavender, alpha: 0.54 * lockAlpha })
        .circle(target.x, target.y, 6 + impact * 5)
        .fill({ color: MORNYE_PROTOCOL_COLORS.ice, alpha: 0.12 * lockAlpha })
        .moveTo(target.x - radius * 0.72, target.y)
        .lineTo(target.x + radius * 0.72, target.y)
        .moveTo(target.x, target.y - radius * 0.72)
        .lineTo(target.x, target.y + radius * 0.72)
        .stroke({ width: 1.7, color: MORNYE_PROTOCOL_COLORS.core, alpha: 0.42 * lockAlpha });
      for (let index = 0; index < 4; index += 1) {
        const angle = Math.PI / 4 + index * Math.PI / 2 + progress * 0.28;
        const inner = radius * 0.8;
        const outer = radius * 1.18;
        lock.moveTo(target.x + Math.cos(angle) * inner, target.y + Math.sin(angle) * inner)
          .lineTo(target.x + Math.cos(angle) * outer, target.y + Math.sin(angle) * outer)
          .stroke({ width: 2, color: MORNYE_PROTOCOL_COLORS.shadow, alpha: 0.44 * lockAlpha });
      }
    }

    sparks.clear();
    for (let index = 0; index < 16; index += 1) {
      const burst = clamp01((progress - 0.42 - (index % 4) * 0.018) / 0.28);
      if (!burst) continue;
      const angle = index * 2.399;
      const distance = burst * (18 + (index % 5) * 5);
      sparks.circle(
        target.x + Math.cos(angle) * distance,
        target.y + Math.sin(angle) * distance * 0.76,
        1.2 + (index % 3) * 0.35
      ).fill({
        color: index % 4 ? MORNYE_PROTOCOL_COLORS.ice : MORNYE_PROTOCOL_COLORS.lilac,
        alpha: 0.58 * (1 - burst)
      });
    }
  });
}

function playMeteorErase({ app, pixi, target, durationMs }) {
  const aura = new pixi.Graphics();
  const focus = new pixi.Graphics();
  const meteor = new pixi.Graphics();
  const trail = new pixi.Graphics();
  const cracks = new pixi.Graphics();
  const ring = new pixi.Graphics();
  const crater = new pixi.Graphics();
  const dust = Array.from({ length: 34 }, (_, index) => {
    const colors = [0xfff0a8, 0xffbd68, 0xffffff, 0xe66b4d];
    const particle = new pixi.Graphics()
      .circle(0, 0, 1.4 + (index % 4) * 0.85)
      .fill({ color: colors[index % colors.length], alpha: 0.92 });
    particle.visible = false;
    app.stage.addChild(particle);
    return particle;
  });
  app.stage.addChild(focus, crater, cracks, ring, trail, aura, meteor);
  const start = { x: target.x - 110, y: -48 };
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const anticipation = clamp01(progress / 0.22);
    const fall = easeInCubic(Math.min(progress / 0.58, 1));
    const impact = clamp01((progress - 0.46) / 0.38);
    const craterProgress = clamp01((progress - 0.58) / 0.34);
    const shake = impact > 0 && impact < 0.36 ? (1 - impact / 0.36) * 4 : 0;
    const x = lerp(start.x, target.x, fall);
    const y = lerp(start.y, target.y, fall);

    app.stage.x = Math.sin(progress * 80) * shake;
    app.stage.y = Math.cos(progress * 74) * shake * 0.7;
    focus.clear();
    if (progress < 0.64) {
      focus.circle(target.x, target.y, 24 + anticipation * 10)
        .fill({ color: 0xffe7a0, alpha: 0.06 + anticipation * 0.08 });
    }
    aura.clear();
    if (progress < 0.55) {
      aura.circle(target.x, target.y, 16 + Math.sin(progress * Math.PI * 10) * 2)
        .stroke({ width: 2.5, color: 0xfff1b5, alpha: 0.22 + anticipation * 0.22 });
    }
    trail.clear();
    if (progress < 0.66) {
      for (let index = 0; index < 5; index += 1) {
        const offset = index / 5;
        const tx = lerp(start.x, target.x, clamp01(fall - offset * 0.12));
        const ty = lerp(start.y, target.y, clamp01(fall - offset * 0.12));
        trail.circle(tx - 14 * index, ty - 8 * index, 14 - index * 2)
          .fill({ color: index % 2 ? 0xff8f5c : 0xfff1a8, alpha: 0.22 * (1 - offset) });
      }
    }
    meteor.clear();
    if (progress < 0.62) {
      meteor.circle(x, y, 25).fill({ color: 0xffd978, alpha: 0.16 });
      meteor.star(x, y, 5, 20, 7).fill({ color: 0xfff5b8, alpha: 1 });
      meteor.star(x, y, 5, 11, 4).fill({ color: 0xffffff, alpha: 0.9 });
      meteor.moveTo(x - 58, y - 36).lineTo(x, y).stroke({ width: 7, color: 0xff9f5a, alpha: 0.22 });
      meteor.moveTo(x - 39, y - 24).lineTo(x, y).stroke({ width: 3, color: 0xffffff, alpha: 0.38 });
    }
    ring.clear();
    if (impact) {
      ring.circle(target.x, target.y, 8 + impact * 60).stroke({ width: 6, color: 0xffc95d, alpha: 0.64 * (1 - impact) });
      ring.circle(target.x, target.y, 4 + impact * 36).stroke({ width: 2, color: 0xffffff, alpha: 0.42 * (1 - impact) });
    }
    crater.clear();
    const craterAlpha = meteorEraseCraterAlpha({ progress, craterProgress });
    crater.ellipse(target.x, target.y + 1, 9 + craterProgress * 15, 4 + craterProgress * 8).fill({ color: 0x4a4648, alpha: craterAlpha });
    crater.ellipse(target.x - 2, target.y - 1, 5 + craterProgress * 8, 2 + craterProgress * 4).fill({ color: 0x86594b, alpha: 0.32 * craterProgress });
    cracks.clear();
    if (craterProgress) {
      drawCracks(cracks, target, craterProgress);
    }
    for (const [index, particle] of dust.entries()) {
      if (!impact) continue;
      const angle = (Math.PI * 2 * index) / dust.length;
      const distance = 22 + (index % 5) * 9;
      particle.visible = true;
      particle.x = target.x + Math.cos(angle) * impact * distance;
      particle.y = target.y + Math.sin(angle) * impact * distance * 0.72;
      particle.alpha = 1 - impact;
    }
  });
}

function playBubbleFlip({ app, pixi, target, durationMs }) {
  const bubbleArt = pixi.Sprite.from(DANEA_BUBBLE_IMAGE);
  bubbleArt.anchor.set(0.5);
  bubbleArt.width = 88;
  bubbleArt.height = 88;
  bubbleArt.alpha = 0;
  const targetGlow = new pixi.Graphics();
  const bubble = new pixi.Graphics();
  const caustics = new pixi.Graphics();
  const flash = new pixi.Graphics();
  const shards = Array.from({ length: 24 }, (_, index) => {
    const shard = new pixi.Graphics()
      .circle(0, 0, 1.5 + (index % 3) * 0.7)
      .fill({ color: index % 3 ? 0xbff5ff : 0xffffff, alpha: 0.88 });
    shard.visible = false;
    app.stage.addChild(shard);
    return shard;
  });
  app.stage.addChild(targetGlow, bubble, caustics, bubbleArt, flash);
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const gather = clamp01(progress / 0.28);
    const grow = easeOutBack(Math.min(progress / 0.48, 1));
    const corrupt = clamp01((progress - 0.24) / 0.34);
    const pop = clamp01((progress - 0.58) / 0.34);
    const radius = 20 + grow * 18;
    const wobble = Math.sin(progress * Math.PI * 7) * 2.5;
    targetGlow.clear();
    if (progress < 0.7) {
      targetGlow.circle(target.x, target.y, radius + 14)
        .fill({ color: corrupt > 0.18 ? 0x5d246f : 0x7df0ff, alpha: 0.04 + gather * 0.07 + corrupt * 0.04 });
      targetGlow.circle(target.x, target.y, radius * 0.62)
        .stroke({ width: 2, color: corrupt > 0.25 ? 0x1a1022 : 0xffffff, alpha: 0.16 + gather * 0.22 });
    }
    bubble.clear();
    caustics.clear();
    bubbleArt.x = target.x;
    bubbleArt.y = target.y + wobble;
    bubbleArt.rotation = progress * 0.28;
    bubbleArt.alpha = progress < 0.68 ? 0.28 * gather * (1 - corrupt * 0.5) : 0.3 * (1 - pop);
    bubbleArt.scale.set(0.72 + grow * 0.34);
    if (progress < 0.68) {
      bubble.circle(target.x, target.y + wobble, radius + 8)
        .fill({ color: 0x74dfff, alpha: (0.08 + gather * 0.08) * (1 - corrupt * 0.8) });
      if (corrupt) {
        bubble.circle(target.x, target.y + wobble, radius + 6)
          .fill({ color: 0x2b1138, alpha: 0.08 + corrupt * 0.24 });
        bubble.circle(target.x + radius * 0.22, target.y + wobble - radius * 0.12, radius * (0.42 + corrupt * 0.18))
          .fill({ color: 0x6b2b91, alpha: 0.08 + corrupt * 0.16 });
        bubble.circle(target.x - radius * 0.18, target.y + wobble + radius * 0.18, radius * 0.36)
          .fill({ color: 0x0d0b14, alpha: 0.08 + corrupt * 0.14 });
      }
      bubble.circle(target.x, target.y + wobble, radius)
        .fill({ color: corrupt > 0.45 ? 0x241032 : 0xa8eaff, alpha: 0.14 * (1 - corrupt * 0.35) })
        .stroke({ width: 4, color: corrupt > 0.5 ? 0xb56cff : 0xffffff, alpha: 0.66 });
      bubble.circle(target.x - radius * 0.34, target.y + wobble - radius * 0.36, radius * 0.16)
        .fill({ color: 0xffffff, alpha: 0.6 });
      for (let index = 0; index < 3; index += 1) {
        caustics.ellipse(
          target.x + Math.cos(progress * 4 + index) * 8,
          target.y + wobble + Math.sin(progress * 3 + index) * 8,
          radius * (0.46 - index * 0.08),
          3
        ).stroke({ width: 1.4, color: 0xffffff, alpha: 0.22 });
      }
    }
    flash.clear();
    if (pop) {
      flash.circle(target.x, target.y, 10 + pop * 40).fill({ color: 0xffffff, alpha: 0.5 * (1 - pop) })
        .circle(target.x, target.y, 18 + pop * 58).stroke({ width: 3, color: 0x8de9ff, alpha: 0.44 * (1 - pop) });
    }
    for (const [index, shard] of shards.entries()) {
      if (!pop) continue;
      const angle = (Math.PI * 2 * index) / shards.length;
      const distance = 28 + (index % 4) * 8;
      shard.visible = true;
      shard.x = target.x + Math.cos(angle) * pop * distance;
      shard.y = target.y + Math.sin(angle) * pop * distance;
      shard.alpha = 1 - pop;
    }
  });
}

function playBaconbitsBlast({ app, pixi, host, boardSize, pendingSkill, target, durationMs }) {
  const shadow = new pixi.Graphics();
  const smoke = new pixi.Graphics();
  const blast = new pixi.Graphics();
  const shockwave = new pixi.Graphics();
  const sprite = pixi.Sprite.from(BACONBITS_IMAGE);
  sprite.anchor.set(0.5);
  sprite.width = Math.min(host.clientWidth, host.clientHeight) * 0.2;
  sprite.height = sprite.width;
  app.stage.addChild(shadow, smoke, shockwave, blast, sprite);
  const affected = (pendingSkill.affectedPointIds ?? [])
    .map((pointId) => pointCenterForHost(pointId, { boardSize, host }))
    .filter(Boolean);
  const ghosts = affected.map((point, index) => {
    const ghost = new pixi.Graphics()
      .circle(0, 0, 8)
      .fill({ color: index % 2 ? 0xf8f8ff : 0x141116, alpha: 0.45 })
      .stroke({ width: 1.5, color: 0xffffff, alpha: 0.28 });
    ghost.visible = false;
    app.stage.addChild(ghost);
    return { ghost, point };
  });
  const start = { x: host.clientWidth + sprite.width, y: Math.max(0, target.y - 80) };
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const fly = easeOutCubic(Math.min(progress / 0.45, 1));
    const hover = clamp01((progress - 0.28) / 0.18);
    const swell = clamp01((progress - 0.38) / 0.22);
    const boom = clamp01((progress - 0.54) / 0.38);
    const bodyScale = 1 + swell * 1.18 - boom * 0.9;
    sprite.x = lerp(start.x, target.x, fly);
    sprite.y = lerp(start.y, target.y, fly) + Math.sin(progress * Math.PI * 8) * 4 * hover;
    sprite.rotation = Math.sin(progress * 18) * (0.08 + swell * 0.1);
    sprite.scale.set(bodyScale, 1 + swell * 0.9 - boom * 0.7);
    sprite.alpha = progress < 0.78 ? 1 : 1 - clamp01((progress - 0.78) / 0.18);
    shadow.clear();
    if (progress < 0.72) {
      shadow.ellipse(target.x, target.y + 10, sprite.width * 0.34 * bodyScale, 8 + swell * 8)
        .fill({ color: 0x25171d, alpha: 0.12 + hover * 0.14 });
    }
    shockwave.clear();
    if (boom) {
      shockwave.circle(target.x, target.y, 18 + boom * 86).stroke({ width: 8, color: 0xff96b6, alpha: 0.52 * (1 - boom) })
        .circle(target.x, target.y, 8 + boom * 48).stroke({ width: 3, color: 0xffffff, alpha: 0.38 * (1 - boom) });
    }
    smoke.clear();
    if (boom) {
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        const distance = boom * (24 + (index % 4) * 10);
        smoke.circle(target.x + Math.cos(angle) * distance, target.y + Math.sin(angle) * distance * 0.78, 10 + boom * 9)
          .fill({ color: index % 2 ? 0xffd2dd : 0xd4c0c8, alpha: 0.18 * (1 - boom) });
      }
    }
    blast.clear();
    for (const point of affected) {
      const outward = boom * 16;
      blast.circle(point.x + (point.x - target.x) * boom * 0.16, point.y + (point.y - target.y) * boom * 0.16, 8 + outward)
        .fill({ color: 0xf7b0c7, alpha: 0.22 * (1 - boom) })
        .stroke({ width: 2, color: 0xffffff, alpha: 0.42 * (1 - boom) });
    }
    for (const { ghost, point } of ghosts) {
      if (!boom) continue;
      ghost.visible = true;
      ghost.x = point.x + (point.x - target.x) * boom * 0.36;
      ghost.y = point.y + (point.y - target.y) * boom * 0.36 - boom * 18;
      ghost.alpha = 0.46 * (1 - boom);
      ghost.scale.set(1 + boom * 0.8);
    }
  });
}

function playSprayStone({ app, pixi, host, boardSize, pendingSkill, target, durationMs }) {
  const wash = new pixi.Graphics();
  const sparkle = new pixi.Graphics();
  app.stage.addChild(wash, sparkle);
  const colors = [0x34e2c4, 0x8d7cff, 0xff7eb6, 0xffd15d];
  const targets = sprayEffectTargets({ host, boardSize, pendingSkill, target });
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const bloom = easeOutCubic(Math.min(progress / 0.72, 1));
    const fade = 1 - progress;
    wash.clear();
    sparkle.clear();
    for (const [targetIndex, effectTarget] of targets.entries()) {
      const phase = targetIndex * 0.48;
      for (let index = 0; index < colors.length; index += 1) {
        const angle = progress * Math.PI * 2 + index * Math.PI / 2 + phase;
        const radius = 12 + bloom * (26 + index * 4);
        wash.circle(effectTarget.x + Math.cos(angle) * 4, effectTarget.y + Math.sin(angle) * 4, radius)
          .stroke({ width: 3, color: colors[(index + targetIndex) % colors.length], alpha: 0.34 * fade });
      }
      for (let index = 0; index < 10; index += 1) {
        const angle = (Math.PI * 2 * index) / 10 + progress * 1.4 + phase;
        const distance = 12 + bloom * (18 + (index % 3) * 6);
        sparkle.star(
          effectTarget.x + Math.cos(angle) * distance,
          effectTarget.y + Math.sin(angle) * distance,
          4,
          4 + (index % 2),
          1.5
        ).fill({ color: colors[(index + targetIndex) % colors.length], alpha: 0.52 * fade });
      }
    }
  });
}

function playRowSlash({ app, pixi, host, boardSize, pendingSkill, durationMs }) {
  const width = host.clientWidth;
  const height = host.clientHeight;
  const cellSize = Math.min(width, height) / Math.max(1, boardSize);
  const row = rowSlashRow(pendingSkill);
  if (!Number.isInteger(row)) return;
  const y = ((row + 0.5) / boardSize) * height;
  const omen = new pixi.Graphics();
  const ink = new pixi.Graphics();
  const edge = new pixi.Graphics();
  const cuts = new pixi.Graphics();
  const sparks = new pixi.Graphics();
  app.stage.addChild(omen, ink, edge, cuts, sparks);
  const cutTargets = rowSlashCutTargets({ host, boardSize, pendingSkill, row });
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const main = easeOutCubic(clamp01((progress - 0.19) / 0.22));
    const inkFade = 1 - clamp01((progress - 0.66) / 0.12);
    omen.clear();
    ink.clear();
    edge.clear();
    cuts.clear();
    sparks.clear();

    drawRowSlashOmen(omen, { width, height, cellSize, progress });

    const charge = clamp01((progress - 0.13) / 0.07) * (1 - clamp01((progress - 0.2) / 0.08));
    if (charge > 0) {
      drawRowSlashCharge(ink, { y, cellSize, charge });
    }

    if (main > 0 && inkFade > 0) {
      const headX = lerp(-cellSize * 0.75, width + cellSize * 0.75, main);
      drawRowSlashInkBrush(ink, {
        width,
        y,
        cellSize,
        headX,
        progress: main,
        alpha: inkFade
      });
      drawRowSlashLeadingEdge(edge, {
        x: headX,
        y,
        cellSize,
        alpha: inkFade * (1 - clamp01((main - 0.9) / 0.1))
      });
      drawRowSlashInkSparks(sparks, {
        width,
        y,
        cellSize,
        headX,
        progress: main,
        alpha: inkFade
      });
    }

    for (const [index, point] of cutTargets.entries()) {
      const xProgress = point.x / Math.max(1, width);
      const local = clamp01((progress - (0.23 + xProgress * 0.17)) / 0.075);
      if (!local) continue;
      drawRowSlashStoneCut(cuts, {
        point,
        cellSize,
        local,
        index
      });
    }
  });
}

function playReducedMotionRowSlash({ app, pixi, host, boardSize, pendingSkill, durationMs }) {
  const width = host.clientWidth;
  const height = host.clientHeight;
  const row = rowSlashRow(pendingSkill);
  if (!Number.isInteger(row)) return;
  const y = ((row + 0.5) / boardSize) * height;
  const cellSize = Math.min(width, height) / Math.max(1, boardSize);
  const flash = new pixi.Graphics();
  app.stage.addChild(flash);
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const alpha = Math.sin(progress * Math.PI);
    flash.clear()
      .rect(0, y - cellSize * 0.46, width, cellSize * 0.92)
      .fill({ color: 0xbaf8ef, alpha: 0.2 * alpha })
      .rect(0, y - cellSize * 0.08, width, cellSize * 0.16)
      .fill({ color: 0xffffff, alpha: 0.62 * alpha });
  });
}

function playLibertyPurge({ app, pixi, host, boardSize, pendingSkill, target, durationMs }) {
  const wash = new pixi.Graphics();
  const slashLayer = new pixi.Graphics();
  const sparks = new pixi.Graphics();
  app.stage.addChild(wash, slashLayer, sparks);
  const targets = libertyPurgeSlashTargets({ host, boardSize, pendingSkill, target });
  const cellSize = Math.min(host.clientWidth, host.clientHeight) / Math.max(1, boardSize);
  const baseLength = Math.max(30, Math.min(76, cellSize * 2.5));
  const lastSlashStartMs = LIBERTY_PURGE_SLASH_INITIAL_DELAY_MS
    + Math.max(0, targets.length - 1) * LIBERTY_PURGE_SLASH_STAGGER_MS;
  const fadeStartMs = Math.max(durationMs * 0.74, lastSlashStartMs + LIBERTY_PURGE_SLASH_DRAW_MS * 0.68);
  const startedAt = performance.now();

  app.ticker.add(() => {
    const elapsedMs = performance.now() - startedAt;
    const exit = clamp01((elapsedMs - fadeStartMs) / LIBERTY_PURGE_SLASH_EXIT_MS);
    const globalAlpha = 1 - exit;
    wash.clear();
    slashLayer.clear();
    sparks.clear();

    for (const [index, point] of targets.entries()) {
      const local = clamp01(
        (elapsedMs - LIBERTY_PURGE_SLASH_INITIAL_DELAY_MS - index * LIBERTY_PURGE_SLASH_STAGGER_MS)
          / LIBERTY_PURGE_SLASH_DRAW_MS
      );
      if (!local) continue;
      const draw = easeOutCubic(Math.min(local / 0.62, 1));
      const fade = globalAlpha * (1 - clamp01((local - 0.68) / 0.32) * 0.28);
      const angle = point.angle;
      const length = baseLength * (0.82 + (index % 3) * 0.12);
      const open = length * (0.18 + draw * 0.38);

      wash.ellipse(point.x, point.y, length * 0.72 * draw, length * 0.26 * draw)
        .fill({ color: 0xff1733, alpha: 0.06 * fade });
      drawScissorSlash(slashLayer, {
        x: point.x,
        y: point.y,
        angle,
        length,
        progress: draw,
        alpha: fade
      });
      drawScissorSlash(slashLayer, {
        x: point.x + Math.cos(angle + Math.PI / 2) * open * 0.22,
        y: point.y + Math.sin(angle + Math.PI / 2) * open * 0.22,
        angle: angle + Math.PI * 0.55,
        length: length * 0.82,
        progress: draw,
        alpha: fade * 0.86
      });

      if (local > 0.2 && local < 0.92) {
        const burst = clamp01((local - 0.2) / 0.72);
        for (let sparkIndex = 0; sparkIndex < 5; sparkIndex += 1) {
          const sparkAngle = angle + (sparkIndex - 2) * 0.34 + Math.sin(index) * 0.2;
          const distance = burst * (8 + sparkIndex * 3);
          sparks.circle(
            point.x + Math.cos(sparkAngle) * distance,
            point.y + Math.sin(sparkAngle) * distance,
            1.2 + (sparkIndex % 2) * 0.45
          ).fill({ color: sparkIndex % 2 ? 0xffedf0 : 0xff1733, alpha: 0.62 * fade * (1 - burst * 0.44) });
        }
      }
    }
  });
}

function playReducedMotionLibertyPurge({ app, pixi, host, boardSize, pendingSkill, target, durationMs }) {
  const slashLayer = new pixi.Graphics();
  app.stage.addChild(slashLayer);
  const targets = libertyPurgeSlashTargets({ host, boardSize, pendingSkill, target }).slice(0, 4);
  const cellSize = Math.min(host.clientWidth, host.clientHeight) / Math.max(1, boardSize);
  const length = Math.max(28, Math.min(64, cellSize * 2.2));
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const alpha = 0.78 * (1 - progress);
    slashLayer.clear();
    for (const point of targets) {
      drawScissorSlash(slashLayer, {
        x: point.x,
        y: point.y,
        angle: point.angle,
        length,
        progress: 1,
        alpha
      });
    }
  });
}

function playVoyageStar({ app, pixi, host, boardSize, pendingSkill, durationMs }) {
  const { width, height } = boardEffectHostSize(host, "voyage-star");
  const safeDurationMs = boardEffectDurationMs(durationMs, "voyage-star");
  const center = pointCenterForHost(pendingSkill?.targetId, { boardSize, host });
  if (!isFinitePoint(center)) {
    throw new Error("Voyage Star target center is unavailable");
  }
  const removedTargets = voyageStarRemovedTargets({ host, boardSize, pendingSkill });
  if (!Array.isArray(removedTargets)) {
    throw new Error("Voyage Star removed target list is invalid");
  }
  const quakeLayer = new pixi.Container();
  const omen = new pixi.Graphics();
  const sword = new pixi.Graphics();
  const impactGlow = new pixi.Graphics();
  const shockwaves = new pixi.Graphics();
  const dust = new pixi.Graphics();
  const particles = new pixi.Graphics();
  const explosionCoverLayer = new pixi.Graphics();
  quakeLayer.addChild(omen, impactGlow, shockwaves, dust, particles, sword);
  app.stage.addChild(quakeLayer, explosionCoverLayer);
  const fullCoverRadius = voyageStarFullCoverRadius({ width, height, center });
  const cellSize = Math.min(width, height) / Math.max(1, boardSize);
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / safeDurationMs);
    const omenProgress = clamp01(progress / 0.15);
    const fall = easeInCubic(clamp01((progress - 0.1) / 0.22));
    const impact = clamp01((progress - 0.28) / 0.22);
    const shock = clamp01((progress - 0.28) / 0.24);
    const coverProgress = easeOutCubic(clamp01((progress - 0.42) / 0.16));
    const coverDissolve = clamp01((progress - 0.77) / 0.21);
    const coverAlpha = coverDissolve > 0 ? 1 - easeInCubic(coverDissolve) : 1;
    const fullCover = coverProgress >= 0.82;
    const swordY = lerp(-height * 0.42, center.y, fall);
    const swordAlpha = fullCover
      ? 0
      : progress < 0.5
        ? 1
        : 1 - clamp01((progress - 0.5) / 0.08) * 0.36;
    const shake = voyageStarQuakeShake(progress, cellSize);
    quakeLayer.x = shake.x;
    quakeLayer.y = shake.y;

    const glowAlpha = fullCover
      ? 0
      : Math.max(omenProgress * (1 - clamp01((progress - 0.22) / 0.18)) * 0.28, impact * (1 - clamp01((progress - 0.44) / 0.16)));

    omen.clear();
    if (progress < 0.42) {
      drawVoyageStarOmen(omen, { center, width, height, cellSize, progress, omenProgress, fall });
    }

    impactGlow.clear()
      .circle(center.x, center.y, cellSize * (0.55 + impact * 3.3))
      .fill({ color: 0xffdf85, alpha: 0.16 * glowAlpha })
      .circle(center.x, center.y, cellSize * (0.36 + impact * 2.2))
      .fill({ color: 0xffffff, alpha: 0.22 * glowAlpha });

    shockwaves.clear();
    dust.clear();
    if (shock > 0 && !fullCover) {
      drawVoyageStarEarthquake(shockwaves, dust, {
        center,
        width,
        height,
        cellSize,
        shock,
        progress
      });
    }

    particles.clear();
    if (impact > 0) {
      for (const [index, target] of removedTargets.entries()) {
        const burst = clamp01((progress - 0.34 - index * 0.012) / 0.34);
        if (!burst) continue;
        for (let particleIndex = 0; particleIndex < 5; particleIndex += 1) {
          const angle = particleIndex * 1.257 + index * 0.73;
          const distance = burst * cellSize * (0.28 + particleIndex * 0.12);
          particles.star(
            target.x + Math.cos(angle) * distance,
            target.y + Math.sin(angle) * distance,
            4,
            Math.max(2.2, cellSize * 0.08),
            Math.max(0.9, cellSize * 0.03)
          ).fill({ color: particleIndex % 2 ? 0xffdf85 : 0xffffff, alpha: 0.48 * (1 - burst) * (1 - coverProgress) });
        }
      }
    }

    sword.clear();
    if (swordAlpha > 0) {
      drawVoyageStarSword(sword, {
        x: center.x,
        y: swordY,
        size: Math.max(54, cellSize * 3.8),
        alpha: swordAlpha,
        fall
      });
    }

    explosionCoverLayer.clear();
    if (coverProgress > 0 && coverAlpha > 0) {
      drawVoyageStarExplosionCover(explosionCoverLayer, {
        center,
        width,
        height,
        cellSize,
        radius: fullCoverRadius * coverProgress,
        fullCover,
        dissolveProgress: coverDissolve,
        alpha: coverAlpha
      });
    }
  });
}

function playReducedMotionVoyageStar({ app, pixi, host, boardSize, pendingSkill, durationMs }) {
  const { width, height } = boardEffectHostSize(host, "voyage-star");
  const safeDurationMs = boardEffectDurationMs(durationMs, "voyage-star");
  const center = pointCenterForHost(pendingSkill?.targetId, { boardSize, host });
  if (!isFinitePoint(center)) {
    throw new Error("Voyage Star target center is unavailable");
  }
  const whiteoutLayer = new pixi.Graphics();
  app.stage.addChild(whiteoutLayer);
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / safeDurationMs);
    const alpha = 1 - progress;
    whiteoutLayer.clear()
      .rect(0, 0, width, height)
      .fill({ color: 0xfff4c4, alpha: 0.42 * alpha })
      .rect(0, 0, width, height)
      .fill({ color: 0xffffff, alpha: 0.62 * alpha });
  });
}

function rowSlashRow(pendingSkill) {
  if (Number.isInteger(pendingSkill?.row)) return pendingSkill.row;
  const row = Number(String(pendingSkill?.targetId ?? "").split(",")[1]);
  return Number.isInteger(row) ? row : null;
}

function rowSlashCutTargets({ host, boardSize, pendingSkill, row }) {
  const pointIds = Array.isArray(pendingSkill?.affectedPointIds) && pendingSkill.affectedPointIds.length
    ? pendingSkill.affectedPointIds
    : Array.from({ length: boardSize }, (_, x) => `${x},${row}`);
  return pointIds
    .map((pointIdValue) => pointCenterForHost(pointIdValue, { boardSize, host }))
    .filter(Boolean)
    .sort((left, right) => left.x - right.x);
}

function drawRowSlashOmen(graphics, { width, height, cellSize, progress }) {
  const flashes = [
    { start: 0.02, travelDuration: 0.17, seedIndex: 112, direction: 1 },
    { start: 0.1, travelDuration: 0.17, seedIndex: 137, direction: -1 }
  ];
  const fadeOut = 1 - clamp01((progress - 0.54) / 0.18);
  for (const [index, flash] of flashes.entries()) {
    const raw = (progress - flash.start) / flash.travelDuration;
    if (raw <= 0 || fadeOut <= 0) continue;
    const sweep = easeOutCubic(clamp01(raw));
    const alphaIn = clamp01(raw / 0.18);
    const seed = rowSlashSeed(flash.seedIndex);
    const alpha = alphaIn * fadeOut;
    const angle = Math.PI / 2 + (seed.radius - 0.5) * (Math.PI / 3);
    const travel = (flash.direction > 0 ? sweep - 0.5 : 0.5 - sweep) * height * 0.88;
    const centerX = width * (0.34 + seed.size * 0.32) + Math.cos(angle) * travel;
    const centerY = height * 0.5 + Math.sin(angle) * travel;
    drawRowSlashOmenBrush(graphics, {
      width,
      height,
      centerX,
      centerY,
      angle,
      seedOffset: index * 18,
      cellSize,
      alpha,
      reveal: sweep,
      direction: flash.direction
    });
  }
}

function drawRowSlashOmenBrush(graphics, {
  width,
  height,
  centerX,
  centerY,
  angle,
  seedOffset,
  cellSize,
  alpha,
  reveal = 1,
  direction = 1
}) {
  const length = Math.hypot(width, height) * 1.42;
  const fullHalf = length / 2;
  const tangentX = Math.cos(angle);
  const tangentY = Math.sin(angle);
  const normalX = Math.cos(angle + Math.PI / 2);
  const normalY = Math.sin(angle + Math.PI / 2);
  const startAlong = direction > 0 ? -fullHalf : fullHalf;
  const endAlong = direction > 0
    ? lerp(-fullHalf, fullHalf, reveal)
    : lerp(fullHalf, -fullHalf, reveal);
  const half = Math.max(cellSize * 0.44, Math.abs(endAlong - startAlong) / 2);
  const midAlong = (startAlong + endAlong) / 2;
  const brushCenterX = centerX + tangentX * midAlong;
  const brushCenterY = centerY + tangentY * midAlong;
  const visibleLength = half * 2;
  const brushHeight = cellSize * 1.8;
  drawRowSlashInkSmears(graphics, {
    x: brushCenterX,
    y: brushCenterY,
    angle,
    length: visibleLength,
    spread: brushHeight * 0.72,
    cellSize,
    alpha,
    seedOffset: seedOffset + 4,
    count: 18
  });
  drawRowSlashBladeGlow(graphics, {
    x: brushCenterX,
    y: brushCenterY,
    angle,
    length: visibleLength,
    cellSize,
    alpha
  });
  drawInkSlashLine(graphics, {
    x: brushCenterX,
    y: brushCenterY,
    angle,
    length: visibleLength,
    width: Math.max(3, cellSize * 0.08),
    color: 0xffffff,
    alpha: 0.92 * alpha
  });
  drawInkSlashLine(graphics, {
    x: brushCenterX - normalX * cellSize * 0.16,
    y: brushCenterY - normalY * cellSize * 0.16,
    angle,
    length: visibleLength * 0.92,
    width: Math.max(2.4, cellSize * 0.075),
    color: 0x2f7f86,
    alpha: 0.4 * alpha
  });
  drawInkSlashLine(graphics, {
    x: brushCenterX + normalX * cellSize * 0.18,
    y: brushCenterY + normalY * cellSize * 0.18,
    angle,
    length: visibleLength * 0.82,
    width: Math.max(2, cellSize * 0.058),
    color: 0x173e4a,
    alpha: 0.28 * alpha
  });

  for (let particleIndex = 0; particleIndex < 10; particleIndex += 1) {
    const seed = rowSlashSeed(seedOffset + particleIndex + 40);
    const along = (seed.radius - 0.5) * visibleLength * 0.84;
    const side = (seed.size - 0.5) * brushHeight * 1.4;
    graphics.circle(
      brushCenterX + tangentX * along + normalX * side,
      brushCenterY + tangentY * along + normalY * side,
      Math.max(1, cellSize * (0.018 + seed.delay * 0.028))
    ).fill({ color: seed.delay > 0.52 ? 0xffffff : 0xb9fff4, alpha: 0.22 * alpha });
  }
}

function drawRowSlashCharge(graphics, { y, cellSize, charge }) {
  const x = -cellSize * 0.12;
  graphics.circle(x + cellSize * 0.24, y, cellSize * (0.22 + charge * 0.26))
    .fill({ color: 0xdffff9, alpha: 0.18 * charge })
    .circle(x + cellSize * 0.12, y, cellSize * (0.08 + charge * 0.12))
    .fill({ color: 0xffffff, alpha: 0.38 * charge });
  for (let index = 0; index < 8; index += 1) {
    const seed = rowSlashSeed(index);
    const px = x + cellSize * (0.08 + seed.radius * 0.75);
    const py = y + (seed.size - 0.5) * cellSize * 1.34;
    graphics.circle(px, py, Math.max(1, cellSize * (0.02 + seed.delay * 0.04)))
      .fill({ color: seed.delay > 0.5 ? 0xffffff : 0x9df2e8, alpha: 0.34 * charge });
  }
}

function drawRowSlashInkBrush(graphics, { width, y, cellSize, headX, progress, alpha }) {
  const brushHeight = cellSize * 1.8;
  const left = -cellSize * 0.7;
  const right = Math.min(width + cellSize * 0.7, headX);
  const slashLength = Math.max(0, right - left);
  const centerX = left + slashLength / 2;
  if (slashLength <= 0) return;
  drawRowSlashInkSmears(graphics, {
    x: centerX,
    y,
    angle: 0,
    length: slashLength,
    spread: brushHeight * 0.74,
    cellSize,
    alpha,
    seedOffset: 18,
    count: 30
  });
  drawRowSlashBladeGlow(graphics, {
    x: centerX,
    y,
    angle: 0,
    length: slashLength,
    cellSize,
    alpha
  });
  drawInkSlashLine(graphics, {
    x: centerX,
    y,
    angle: 0,
    length: slashLength,
    width: Math.max(3, cellSize * 0.1),
    color: 0xffffff,
    alpha: 0.86 * alpha
  });
  drawInkSlashLine(graphics, {
    x: centerX,
    y: y + cellSize * 0.18,
    angle: 0,
    length: slashLength * 0.94,
    width: Math.max(2, cellSize * 0.06),
    color: 0x1f5662,
    alpha: 0.42 * alpha
  });
  drawInkSlashLine(graphics, {
    x: centerX,
    y: y - cellSize * 0.16,
    angle: 0,
    length: slashLength * 0.9,
    width: Math.max(1.8, cellSize * 0.05),
    color: 0x4c8688,
    alpha: 0.34 * alpha
  });

  for (let index = 0; index < ROW_SLASH_INK_PARTICLES; index += 1) {
    const seed = rowSlashSeed(index + 20);
    const x = lerp(left + cellSize * 0.4, right - cellSize * 0.2, seed.radius);
    if (x > right || x < left) continue;
    const yOffset = (seed.size - 0.5) * brushHeight * 1.05;
    const particleAlpha = alpha * (0.12 + seed.delay * 0.18) * (1 - clamp01(progress - seed.radius));
    graphics.circle(x, y + yOffset, Math.max(1, cellSize * (0.018 + seed.delay * 0.05)))
      .fill({ color: seed.size > 0.56 ? 0xffffff : 0x85e8df, alpha: particleAlpha });
  }
}

function drawRowSlashLeadingEdge(graphics, { x, y, cellSize, alpha }) {
  if (alpha <= 0) return;
  graphics.poly([
    x - cellSize * 0.18, y - cellSize * 0.78,
    x + cellSize * 0.32, y - cellSize * 0.2,
    x + cellSize * 0.2, y + cellSize * 0.76,
    x - cellSize * 0.26, y + cellSize * 0.18
  ]).fill({ color: 0xffffff, alpha: 0.42 * alpha });
  graphics.moveTo(x - cellSize * 0.18, y - cellSize * 0.72)
    .lineTo(x + cellSize * 0.2, y + cellSize * 0.72)
    .stroke({ width: Math.max(2.4, cellSize * 0.08), color: 0xffffff, alpha: 0.86 * alpha });
}

function drawRowSlashInkSparks(graphics, { width, y, cellSize, headX, progress, alpha }) {
  for (let index = 0; index < ROW_SLASH_SPARKS; index += 1) {
    const seed = rowSlashSeed(index + 80);
    const local = clamp01(progress * 1.2 - seed.delay * 0.42);
    if (!local) continue;
    const x = Math.min(width + cellSize, headX - cellSize * (0.2 + seed.radius * 2.5) * local);
    const yOffset = (seed.size - 0.5) * cellSize * 1.7;
    const sparkleAlpha = Math.sin(local * Math.PI) * alpha * 0.72;
    graphics.star(
      x,
      y + yOffset,
      4,
      Math.max(2.2, cellSize * (0.05 + seed.delay * 0.04)),
      Math.max(0.8, cellSize * 0.018)
    ).fill({ color: index % 3 ? 0xbffff5 : 0xffffff, alpha: sparkleAlpha });
  }
}

function drawRowSlashStoneCut(graphics, { point, cellSize, local, index }) {
  const fade = 1 - clamp01((local - 0.5) / 0.5);
  const angle = -0.08 + ((index % 3) - 1) * 0.035;
  drawInkSlashLine(graphics, {
    x: point.x,
    y: point.y,
    angle,
    length: cellSize * (0.78 + local * 0.34),
    width: Math.max(1.4, cellSize * 0.036),
    color: 0xffffff,
    alpha: 0.82 * fade
  });
  for (let shardIndex = 0; shardIndex < 3; shardIndex += 1) {
    const direction = shardIndex - 1;
    const drift = local * cellSize * (0.12 + shardIndex * 0.08);
    graphics.poly([
      point.x + direction * cellSize * 0.08 + drift,
      point.y - cellSize * 0.14 - drift * 0.15,
      point.x + direction * cellSize * 0.18 + drift * 1.15,
      point.y + cellSize * 0.02,
      point.x + direction * cellSize * 0.06 + drift,
      point.y + cellSize * 0.12 + drift * 0.1
    ]).fill({ color: shardIndex % 2 ? 0xbffbf4 : 0xffffff, alpha: 0.34 * fade });
  }
}

function drawInkSlashLine(graphics, { x, y, angle, length, width, color, alpha }) {
  const half = length / 2;
  const dx = Math.cos(angle) * half;
  const dy = Math.sin(angle) * half;
  graphics.moveTo(x - dx, y - dy)
    .lineTo(x + dx, y + dy)
    .stroke({ width, color, alpha, cap: "round" });
}

function drawRowSlashBladeGlow(graphics, { x, y, angle, length, cellSize, alpha }) {
  const glowLayers = [
    { width: 0.48, color: 0xbffff5, alpha: 0.12 },
    { width: 0.3, color: 0xe8fffb, alpha: 0.18 },
    { width: 0.18, color: 0xffffff, alpha: 0.24 }
  ];
  for (const layer of glowLayers) {
    drawInkSlashLine(graphics, {
      x,
      y,
      angle,
      length,
      width: Math.max(2.4, cellSize * layer.width),
      color: layer.color,
      alpha: alpha * layer.alpha
    });
  }
}

function drawRowSlashInkSmears(graphics, { x, y, angle, length, spread, cellSize, alpha, seedOffset, count }) {
  const tangentX = Math.cos(angle);
  const tangentY = Math.sin(angle);
  const normalX = Math.cos(angle + Math.PI / 2);
  const normalY = Math.sin(angle + Math.PI / 2);
  const half = length / 2;
  for (let index = 0; index < count; index += 1) {
    const seed = rowSlashSeed(seedOffset + index * 3);
    const siblingSeed = rowSlashSeed(seedOffset + index * 3 + 1);
    const along = lerp(-half * 0.94, half * 0.94, seed.radius);
    const segmentHalf = cellSize * (0.12 + seed.delay * 0.28);
    const offset = (seed.size - 0.5) * spread;
    const thickness = cellSize * (0.018 + siblingSeed.radius * 0.07);
    const ragged = (siblingSeed.size - 0.5) * cellSize * 0.12;
    const cx = x + tangentX * along + normalX * offset;
    const cy = y + tangentY * along + normalY * offset;
    const color = seed.delay > 0.66
      ? 0x0e2935
      : seed.delay > 0.36
        ? 0x286d76
        : 0x5c9190;
    graphics.poly([
      cx - tangentX * segmentHalf + normalX * (-thickness + ragged),
      cy - tangentY * segmentHalf + normalY * (-thickness + ragged),
      cx + tangentX * segmentHalf * (0.8 + seed.size * 0.5) + normalX * (-thickness * (0.3 + siblingSeed.delay)),
      cy + tangentY * segmentHalf * (0.8 + seed.size * 0.5) + normalY * (-thickness * (0.3 + siblingSeed.delay)),
      cx + tangentX * segmentHalf + normalX * (thickness - ragged * 0.45),
      cy + tangentY * segmentHalf + normalY * (thickness - ragged * 0.45),
      cx - tangentX * segmentHalf * (0.7 + siblingSeed.size * 0.4) + normalX * (thickness * (0.4 + seed.radius)),
      cy - tangentY * segmentHalf * (0.7 + siblingSeed.size * 0.4) + normalY * (thickness * (0.4 + seed.radius))
    ]).fill({ color, alpha: alpha * (0.16 + seed.delay * 0.18) });
  }
  for (let index = 0; index < Math.max(4, Math.floor(count / 3)); index += 1) {
    const seed = rowSlashSeed(seedOffset + index * 5 + 80);
    const along = lerp(-half * 0.9, half * 0.9, seed.radius);
    const offset = (seed.size - 0.5) * spread * 0.7;
    drawInkSlashLine(graphics, {
      x: x + tangentX * along + normalX * offset,
      y: y + tangentY * along + normalY * offset,
      angle,
      length: cellSize * (0.32 + seed.delay * 0.9),
      width: Math.max(1, cellSize * (0.018 + seed.size * 0.025)),
      color: 0xffffff,
      alpha: alpha * (0.18 + seed.delay * 0.18)
    });
  }
}

function rowSlashSeed(index) {
  return {
    delay: ((index * 11) % 29) / 28,
    radius: ((index * 17) % 37) / 36,
    size: ((index * 23) % 41) / 40
  };
}

function libertyPurgeSlashTargets({ host, boardSize, pendingSkill, target }) {
  const removalPointIds = Array.isArray(pendingSkill?.removalMarkIds)
    ? pendingSkill.removalMarkIds
    : [];
  const pointIds = removalPointIds.length
    ? removalPointIds
    : (Array.isArray(pendingSkill?.affectedPointIds)
        ? pendingSkill.affectedPointIds.filter((pointId) => pointId !== pendingSkill?.targetId)
        : []);
  const points = pointIds
    .map((pointId) => pointCenterForHost(pointId, { boardSize, host }))
    .filter(Boolean);
  const uniquePoints = points.length ? points : [];
  return uniquePoints.map((point, index) => ({
    ...point,
    angle: -0.78 + (index % 4) * 0.34 + Math.sin(index * 1.7) * 0.18
  }));
}

function voyageStarRemovedTargets({ host, boardSize, pendingSkill }) {
  const pointIds = Array.isArray(pendingSkill?.removedStones)
    ? pendingSkill.removedStones.map((entry) => entry?.id).filter(Boolean)
    : [];
  return [...new Set(pointIds)]
    .map((pointIdValue) => pointCenterForHost(pointIdValue, { boardSize, host }))
    .filter(Boolean);
}

function voyageStarFullCoverRadius({ width, height, center }) {
  return Math.max(
    Math.hypot(center.x, center.y),
    Math.hypot(width - center.x, center.y),
    Math.hypot(center.x, height - center.y),
    Math.hypot(width - center.x, height - center.y)
  ) * 1.08;
}

function voyageStarQuakeShake(progress, cellSize) {
  const first = quakePulse(progress, 0.3, 0.1, 1);
  const second = quakePulse(progress, 0.39, 0.08, 0.62);
  const third = quakePulse(progress, 0.48, 0.06, 0.34);
  const power = (first + second + third) * Math.max(2.2, cellSize * 0.085);
  return {
    x: Math.sin(progress * 150) * power + Math.sin(progress * 79) * power * 0.38,
    y: Math.cos(progress * 132) * power * 0.72
  };
}

function quakePulse(progress, start, duration, strength) {
  const local = clamp01((progress - start) / duration);
  if (!local) return 0;
  return Math.sin(local * Math.PI) * strength;
}

function drawVoyageStarOmen(graphics, { center, width, height, cellSize, progress, omenProgress, fall }) {
  const fade = 1 - clamp01((progress - 0.24) / 0.14);
  const alpha = Math.sin(omenProgress * Math.PI) * fade;
  if (alpha <= 0) return;
  graphics.circle(center.x, center.y, cellSize * (0.8 + omenProgress * 1.8))
    .fill({ color: 0xfff4c4, alpha: 0.08 * alpha })
    .circle(center.x, center.y, cellSize * (0.38 + omenProgress * 0.62))
    .fill({ color: 0xffffff, alpha: 0.12 * alpha });
  for (let index = -2; index <= 2; index += 1) {
    const lane = index / 2;
    const beamAlpha = alpha * (0.08 + (2 - Math.abs(index)) * 0.035) * (1 - fall * 0.45);
    const beamWidth = cellSize * (0.12 + (2 - Math.abs(index)) * 0.045);
    const topY = Math.max(0, center.y - height * 0.48);
    graphics.rect(center.x + lane * cellSize * 1.05 - beamWidth / 2, topY, beamWidth, center.y - topY + cellSize * 0.8)
      .fill({ color: index === 0 ? 0xffffff : 0xfff4c4, alpha: beamAlpha });
  }
  for (let index = 0; index < 8; index += 1) {
    const angle = index * 0.785 + progress * 0.4;
    const distance = cellSize * (1.2 + (index % 3) * 0.32 + omenProgress * 0.8);
    graphics.star(
      center.x + Math.cos(angle) * distance,
      center.y + Math.sin(angle) * distance * 0.78,
      4,
      Math.max(2.5, cellSize * 0.08),
      Math.max(1, cellSize * 0.03)
    ).fill({ color: index % 2 ? 0xfff4c4 : 0xffffff, alpha: 0.34 * alpha });
  }
}

function drawVoyageStarEarthquake(shockwaves, dust, { center, width, height, cellSize, shock, progress }) {
  const maxRadius = Math.hypot(width, height) * 0.48;
  const fade = 1 - clamp01((shock - 0.72) / 0.28);
  for (let index = 0; index < 3; index += 1) {
    const local = clamp01(shock * 1.25 - index * 0.18);
    if (!local) continue;
    const ringFade = Math.sin(local * Math.PI) * fade;
    const radius = cellSize * (0.9 + index * 0.45) + maxRadius * local * (0.18 + index * 0.05);
    shockwaves.ellipse(center.x, center.y, radius, radius * (0.72 + index * 0.04))
      .stroke({
        width: Math.max(2, cellSize * (0.08 + index * 0.025)),
        color: index % 2 ? 0xffd78a : 0xffffff,
        alpha: 0.46 * ringFade
      });
    shockwaves.ellipse(center.x, center.y + cellSize * 0.05, radius * 0.72, radius * 0.4)
      .stroke({ width: Math.max(1.4, cellSize * 0.04), color: 0xfff4c4, alpha: 0.2 * ringFade });
  }
  for (let index = 0; index < VOYAGE_STAR_QUAKE_DUST; index += 1) {
    const seed = voyageStarSeed(index);
    const angle = seed.angle + progress * 0.2;
    const local = clamp01(shock * 1.12 - seed.delay);
    if (!local) continue;
    const distance = cellSize * (0.75 + seed.radius * 4.2) * (0.42 + local);
    const x = center.x + Math.cos(angle) * distance;
    const y = center.y + Math.sin(angle) * distance * 0.7 - local * cellSize * 0.22;
    const alpha = Math.sin(local * Math.PI) * (0.34 + seed.radius * 0.24) * fade;
    dust.circle(x, y, Math.max(1.2, cellSize * (0.025 + seed.size * 0.045)))
      .fill({ color: seed.size > 0.55 ? 0xffffff : 0xffe2a2, alpha: 0.4 * alpha });
  }
}

function voyageStarSeed(index) {
  const angle = (index * 2.399963 + ((index * 19) % 11) * 0.071) % (Math.PI * 2);
  return {
    angle,
    delay: ((index * 7) % 13) / 52,
    radius: ((index * 17) % 29) / 28,
    size: ((index * 23) % 31) / 30
  };
}

function drawVoyageStarExplosionCover(graphics, {
  center,
  width,
  height,
  cellSize,
  radius,
  fullCover,
  dissolveProgress = 0,
  alpha
}) {
  if (!fullCover) {
    const solidCoreRadius = Math.min(radius, Math.max(18, cellSize * VOYAGE_STAR_SOLID_CORE_CELLS));
    const edgeFeather = Math.max(cellSize * 0.62, radius * 0.5);
    const outerRadius = Math.max(radius, solidCoreRadius) + edgeFeather;
    const solidTransitionRadius = solidCoreRadius + Math.max(10, cellSize * 0.55);
    const featherStart = solidCoreRadius / outerRadius;
    for (let step = SOFT_EXPLOSION_EDGE_STEPS; step >= 1; step -= 1) {
      const t = step / SOFT_EXPLOSION_EDGE_STEPS;
      const layerRadius = outerRadius * t;
      const edgeProgress = clamp01((t - featherStart) / Math.max(0.001, 1 - featherStart));
      const coreProgress = clamp01(t / Math.max(0.001, featherStart));
      const edgeAlpha = Math.pow(1 - edgeProgress, 2.35);
      const coreAlpha = Math.pow(1 - coreProgress, 1.15);
      const color = edgeProgress > 0 ? 0xffed9a : coreProgress > 0.58 ? 0xfff4c4 : 0xffffff;
      const layerAlpha = alpha * edgeAlpha * (0.01 + coreAlpha * 0.058);
      if (layerAlpha > 0.001) {
        graphics.circle(center.x, center.y, layerRadius)
          .fill({ color, alpha: layerAlpha });
      }
    }
    for (let step = 8; step >= 1; step -= 1) {
      const t = step / 8;
      const transitionAlpha = alpha * Math.pow(1 - t, 1.7) * 0.34;
      if (transitionAlpha > 0.001) {
        graphics.circle(center.x, center.y, solidCoreRadius + (solidTransitionRadius - solidCoreRadius) * t)
          .fill({ color: 0xfff4c4, alpha: transitionAlpha });
      }
    }
    graphics.circle(center.x, center.y, solidCoreRadius)
      .fill({ color: 0xfff4c4, alpha: 0.86 * alpha })
      .circle(center.x, center.y, solidCoreRadius * 0.72)
      .fill({ color: 0xffffff, alpha: 0.68 * alpha });
  }

  if (fullCover) {
    const dissolve = clamp01(dissolveProgress);
    graphics.rect(0, 0, width, height)
      .fill({ color: 0xffffff, alpha });
    if (dissolve > 0) {
      drawVoyageStarDissolve(graphics, { center, width, height, cellSize, dissolve });
    }
  }
}

function drawVoyageStarDissolve(graphics, { center, width, height, cellSize, dissolve }) {
  const fade = 1 - dissolve;
  const maxRadius = Math.hypot(width, height) * 0.58;
  for (let index = 0; index < 4; index += 1) {
    const ringProgress = clamp01(dissolve * 1.35 - index * 0.16);
    if (!ringProgress) continue;
    const ringFade = Math.sin(ringProgress * Math.PI) * fade;
    if (ringFade <= 0.002) continue;
    graphics.circle(center.x, center.y, maxRadius * (0.16 + ringProgress * 0.94))
      .stroke({
        width: Math.max(10, cellSize * (0.32 + index * 0.08)) * (1 - ringProgress * 0.54),
        color: index % 2 ? 0xfff4c4 : 0xffffff,
        alpha: 0.2 * ringFade
      });
  }
  for (let index = 0; index < VOYAGE_STAR_DISSOLVE_SPARKS; index += 1) {
    const angle = index * 2.399 + dissolve * 1.3;
    const lane = 0.18 + (index % 7) * 0.095;
    const drift = maxRadius * (lane + dissolve * (0.3 + (index % 5) * 0.032));
    const x = center.x + Math.cos(angle) * drift;
    const y = center.y + Math.sin(angle) * drift * 0.82;
    const pulse = Math.sin((dissolve * 2.7 + index * 0.17) * Math.PI);
    const sparkleAlpha = Math.max(0, pulse) * fade;
    if (sparkleAlpha <= 0.002) continue;
    const size = Math.max(4, cellSize * (0.08 + (index % 4) * 0.026));
    graphics.star(x, y, 4 + (index % 2), size * (1.8 + dissolve * 2.2), size)
      .fill({ color: index % 3 ? 0xfff4c4 : 0xffffff, alpha: 0.64 * sparkleAlpha });
    graphics.circle(x, y, size * (2.8 + dissolve * 4.4))
      .fill({ color: 0xffed9a, alpha: 0.12 * sparkleAlpha });
  }
  for (let index = 0; index < 14; index += 1) {
    const angle = index * 0.628 + dissolve * 0.42;
    const inner = maxRadius * (0.1 + dissolve * 0.38);
    const outer = maxRadius * (0.38 + dissolve * 0.7);
    graphics.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner)
      .lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer)
      .stroke({ width: Math.max(2.2, cellSize * 0.06), color: 0xffffff, alpha: 0.2 * fade });
  }
}

function drawVoyageStarSword(graphics, { x, y, size, alpha, fall = 1 }) {
  const bladeHalf = size * 0.11;
  const bladeTip = y;
  const bladeBase = y - size * 0.96;
  const trailAlpha = alpha * (1 - clamp01((fall - 0.62) / 0.38));
  if (trailAlpha > 0.02) {
    graphics.moveTo(x, bladeBase - size * 0.92)
      .lineTo(x + size * 0.22, bladeBase - size * 0.08)
      .lineTo(x, bladeTip)
      .lineTo(x - size * 0.22, bladeBase - size * 0.08)
      .fill({ color: 0xdff8ff, alpha: 0.1 * trailAlpha })
      .moveTo(x, bladeBase - size * 0.68)
      .lineTo(x + size * 0.09, bladeBase - size * 0.06)
      .lineTo(x, bladeTip - size * 0.02)
      .lineTo(x - size * 0.09, bladeBase - size * 0.06)
      .fill({ color: 0xffffff, alpha: 0.16 * trailAlpha });
  }
  graphics.circle(x, bladeTip - size * 0.2, size * 0.28)
    .fill({ color: 0xdff8ff, alpha: 0.08 * alpha });
  graphics.poly([
    x, bladeTip,
    x + bladeHalf, bladeTip - size * 0.2,
    x + bladeHalf * 0.72, bladeBase,
    x - bladeHalf * 0.72, bladeBase,
    x - bladeHalf, bladeTip - size * 0.2
  ]).fill({ color: 0xffffff, alpha })
    .stroke({ width: Math.max(2, size * 0.035), color: 0xdff8ff, alpha: 0.72 * alpha });
  graphics.moveTo(x, bladeTip - size * 0.08)
    .lineTo(x, bladeBase + size * 0.05)
    .stroke({ width: Math.max(1.4, size * 0.018), color: 0xcff7ff, alpha: 0.78 * alpha });
  graphics.rect(x - size * 0.34, bladeBase - size * 0.04, size * 0.68, size * 0.08)
    .fill({ color: 0xffffff, alpha: 0.92 * alpha });
  graphics.rect(x - size * 0.38, bladeBase - size * 0.015, size * 0.76, size * 0.03)
    .fill({ color: 0xdff8ff, alpha: 0.56 * alpha });
  graphics.rect(x - size * 0.08, bladeBase - size * 0.34, size * 0.16, size * 0.34)
    .fill({ color: 0xf4fbff, alpha: 0.9 * alpha });
  graphics.circle(x, bladeBase - size * 0.05, size * 0.13)
    .stroke({ width: Math.max(2, size * 0.035), color: 0xffffff, alpha: 0.78 * alpha })
    .circle(x, bladeBase - size * 0.05, size * 0.055)
    .fill({ color: 0xbdefff, alpha: 0.7 * alpha });
}

function drawScissorSlash(graphics, { x, y, angle, length, progress, alpha }) {
  const half = (length * progress) / 2;
  const startX = x - Math.cos(angle) * half;
  const startY = y - Math.sin(angle) * half;
  const endX = x + Math.cos(angle) * half;
  const endY = y + Math.sin(angle) * half;
  const bendX = x + Math.cos(angle + Math.PI / 2) * length * 0.08 * Math.sin(progress * Math.PI);
  const bendY = y + Math.sin(angle + Math.PI / 2) * length * 0.08 * Math.sin(progress * Math.PI);

  graphics.moveTo(startX, startY)
    .quadraticCurveTo(bendX, bendY, endX, endY)
    .stroke({ width: 9, color: 0x3a0710, alpha: 0.22 * alpha });
  graphics.moveTo(startX, startY)
    .quadraticCurveTo(bendX, bendY, endX, endY)
    .stroke({ width: 5.2, color: 0xff1733, alpha: 0.78 * alpha });
  graphics.moveTo(lerp(startX, endX, 0.08), lerp(startY, endY, 0.08))
    .quadraticCurveTo(bendX, bendY, lerp(startX, endX, 0.92), lerp(startY, endY, 0.92))
    .stroke({ width: 1.6, color: 0xfff0f2, alpha: 0.68 * alpha });
}

function sprayEffectTargets({ host, boardSize, pendingSkill, target }) {
  const pointIds = Array.isArray(pendingSkill?.affectedPointIds)
    ? pendingSkill.affectedPointIds
    : [];
  const points = pointIds
    .map((pointId) => pointCenterForHost(pointId, { boardSize, host }))
    .filter(Boolean);
  if (points.length) return points;
  return target ? [target] : [];
}

function drawCracks(graphics, target, progress) {
  const cracks = [
    { angle: -0.25, length: 24 },
    { angle: 0.72, length: 19 },
    { angle: 2.4, length: 18 },
    { angle: 3.38, length: 22 },
    { angle: 4.62, length: 15 }
  ];
  for (const crack of cracks) {
    const length = crack.length * progress;
    graphics
      .moveTo(target.x, target.y)
      .lineTo(target.x + Math.cos(crack.angle) * length, target.y + Math.sin(crack.angle) * length * 0.72)
      .stroke({ width: 1.6, color: 0x3b2428, alpha: 0.44 * progress });
  }
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function assertPlayableBoardEffectHost({ app, host, durationMs, effectType }) {
  if (!app?.stage?.addChild) throw new Error(`Pixi board effect stage is unavailable for ${effectType ?? "unknown"}`);
  if (!app?.ticker?.add) throw new Error(`Pixi board effect ticker is unavailable for ${effectType ?? "unknown"}`);
  boardEffectHostSize(host, effectType);
  boardEffectDurationMs(durationMs, effectType);
}

function boardEffectHostSize(host, effectType) {
  const width = Number(host?.clientWidth);
  const height = Number(host?.clientHeight);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error(`Pixi board effect host has invalid size for ${effectType ?? "unknown"}`);
  }
  return { width, height };
}

function boardEffectDurationMs(durationMs, effectType) {
  const value = Number(durationMs);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Pixi board effect duration is invalid for ${effectType ?? "unknown"}`);
  }
  return value;
}

function isFinitePoint(point) {
  return Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeInCubic(value) {
  return value * value * value;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}


export const BOARD_SKILL_EFFECT_RENDERERS = Object.freeze({
  "double-move": Object.freeze({
    fullBoard: true,
    assets: [CHANGLI_FIRE_PHOENIX_IMAGE, CHANGLI_FLAME_SPRITE_IMAGE],
    play: playChangliDoubleMove,
    playReducedMotion: playReducedMotionChangliDoubleMove
  }),
  "erase-point": Object.freeze({ play: playMeteorErase }),
  "flip-stone": Object.freeze({
    assets: [DANEA_BUBBLE_IMAGE],
    play: playBubbleFlip
  }),
  "hidden-hand": Object.freeze({
    fullBoard: true,
    play: playDataStreamHiddenHand,
    playReducedMotion: playReducedMotionBoardSweep
  }),
  "voyage-star": Object.freeze({
    fullBoard: true,
    assets: [VOYAGE_STAR_CRATER_IMAGE],
    play: playVoyageStar,
    playReducedMotion: playReducedMotionVoyageStar
  }),
  "liberty-purge": Object.freeze({
    play: playLibertyPurge,
    playReducedMotion: playReducedMotionLibertyPurge
  }),
  "protocol-takeover": Object.freeze({
    play: playProtocolTakeover,
    playReducedMotion: playReducedMotionProtocolTakeover
  }),
  "random-blast": Object.freeze({
    assets: [BACONBITS_IMAGE],
    play: playBaconbitsBlast
  }),
  "row-slash": Object.freeze({
    fullBoard: true,
    play: playRowSlash,
    playReducedMotion: playReducedMotionRowSlash
  }),
  "spray-stone": Object.freeze({ play: playSprayStone })
});

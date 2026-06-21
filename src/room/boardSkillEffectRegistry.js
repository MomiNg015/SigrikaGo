import { boardPointCenter, pointCenterForHost } from "./boardSkillEffectGeometry.js";

const BACONBITS_IMAGE = "/assets/baconbits.webp";
const CHANGLI_FIRE_PHOENIX_IMAGE = "/assets/effects/changli-fire-phoenix.svg";
const CHANGLI_FLAME_SPRITE_IMAGE = "/assets/effects/changli-flame-sprite.svg";
const DANEA_BUBBLE_IMAGE = "/assets/effects/denia-bubble-pop.webp";
const MORNYE_PROTOCOL_COLORS = Object.freeze({
  core: 0xf8f6ff,
  ice: 0xbdefff,
  lavender: 0xc9b8ff,
  lilac: 0x9f8cff,
  shadow: 0x6f7fb6
});

export function playRegisteredBoardSkillEffect({ app, pixi, host, boardSize, pendingSkill, durationMs, reducedMotion }) {
  const renderer = BOARD_SKILL_EFFECT_RENDERERS[pendingSkill?.effectType];
  if (!renderer) return;
  if (renderer.fullBoard) {
    const play = reducedMotion ? renderer.playReducedMotion : renderer.play;
    play?.({ app, pixi, host, boardSize, pendingSkill, durationMs });
    return;
  }
  const target = pointCenterForHost(pendingSkill.targetId, { boardSize, host });
  if (!target) return;
  if (reducedMotion) {
    const play = renderer.playReducedMotion ?? playReducedMotionHit;
    play({ app, pixi, host, boardSize, pendingSkill, target, durationMs });
    return;
  }
  renderer.play({ app, pixi, host, boardSize, pendingSkill, target, durationMs });
}

export function boardSkillEffectAssetUrls(effectType) {
  return BOARD_SKILL_EFFECT_RENDERERS[effectType]?.assets ?? [];
}

function playReducedMotionBoardSweep({ app, pixi, host, durationMs }) {
  const sweep = new pixi.Graphics();
  app.stage.addChild(sweep);
  const center = { x: host.clientWidth / 2, y: host.clientHeight / 2 };
  const startedAt = performance.now();
  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const alpha = 0.28 * (1 - progress);
    sweep.clear()
      .rect(0, 0, host.clientWidth, host.clientHeight)
      .fill({ color: 0x102d23, alpha: alpha * 0.4 })
      .circle(center.x, center.y, Math.min(host.clientWidth, host.clientHeight) * (0.26 + progress * 0.12))
      .stroke({ width: 3, color: 0xdfffee, alpha });
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
  void pixi.Assets.load([CHANGLI_FIRE_PHOENIX_IMAGE, CHANGLI_FLAME_SPRITE_IMAGE]).then(([phoenixTexture, flameTexture]) => {
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

function playDataStreamHiddenHand({ app, pixi, host, durationMs }) {
  const grid = new pixi.Graphics();
  const streams = new pixi.Graphics();
  const glow = new pixi.Graphics();
  const width = host.clientWidth;
  const height = host.clientHeight;
  const center = { x: width / 2, y: height / 2 };
  const particles = Array.from({ length: 52 }, (_, index) => ({
    angle: (Math.PI * 2 * index) / 52,
    lane: index % 4,
    speed: 0.72 + (index % 7) * 0.04,
    glyph: new pixi.Text({
      text: index % 3 === 0 ? "01" : index % 3 === 1 ? "10" : "◇",
      style: {
        fill: index % 5 === 0 ? 0xffffff : 0x7dffbf,
        fontSize: 10 + (index % 3) * 2,
        fontFamily: "monospace"
      }
    })
  }));
  for (const particle of particles) {
    particle.glyph.anchor.set(0.5);
    app.stage.addChild(particle.glyph);
  }
  app.stage.addChild(grid, streams, glow);
  const maxRadius = Math.hypot(width, height) * 0.62;
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const enter = easeOutCubic(Math.min(progress / 0.5, 1));
    const exit = clamp01((progress - 0.58) / 0.36);
    const alpha = Math.min(1, enter * 1.2) * (1 - exit);
    const wave = maxRadius * (1 - enter * 0.78 + exit * 0.72);
    grid.clear();
    streams.clear();
    glow.clear();
    glow.circle(center.x, center.y, Math.max(16, wave * 0.52))
      .fill({ color: 0x38ff9b, alpha: 0.05 * alpha })
      .stroke({ width: 2, color: 0xeafff4, alpha: 0.28 * alpha });
    for (let index = 0; index < 8; index += 1) {
      const inset = index * 18 + enter * 22;
      const rectAlpha = alpha * Math.max(0, 0.24 - index * 0.018);
      if (inset < width / 2 && inset < height / 2) {
        grid.roundRect(inset, inset, width - inset * 2, height - inset * 2, 10)
          .stroke({ width: 1.4, color: index % 2 ? 0xbfffe1 : 0x38ff9b, alpha: rectAlpha });
      }
    }
    for (const particle of particles) {
      const radius = wave - particle.lane * 18 + Math.sin(progress * 8 + particle.lane) * 5;
      const x = center.x + Math.cos(particle.angle + progress * 0.22 * particle.speed) * radius;
      const y = center.y + Math.sin(particle.angle + progress * 0.18 * particle.speed) * radius;
      particle.glyph.x = x;
      particle.glyph.y = y;
      particle.glyph.alpha = alpha * (0.36 + particle.lane * 0.12);
      particle.glyph.rotation = particle.angle + Math.PI / 2;
      streams.moveTo(x, y)
        .lineTo(lerp(x, center.x, 0.1), lerp(y, center.y, 0.1))
        .stroke({ width: 1.2, color: particle.lane % 2 ? 0xffffff : 0x6cffb0, alpha: 0.08 * alpha });
    }
  });
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
    const lockAlpha = Math.min(1, impact * 1.3) * (1 - residue * 0.18);
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
    crater.ellipse(target.x, target.y + 1, 9 + craterProgress * 15, 4 + craterProgress * 8).fill({ color: 0x38282d, alpha: 0.64 * craterProgress });
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
  "protocol-takeover": Object.freeze({
    play: playProtocolTakeover,
    playReducedMotion: playReducedMotionProtocolTakeover
  }),
  "random-blast": Object.freeze({
    assets: [BACONBITS_IMAGE],
    play: playBaconbitsBlast
  }),
  "spray-stone": Object.freeze({ play: playSprayStone })
});

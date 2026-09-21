import { SIGRIKA_STAR_IMPACT_PROGRESS, SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS } from "../shared/sigrikaPresentation.js";

const COLORS = Object.freeze({ gold: 0xffd578, light: 0xfff4c9, mint: 0xa8efcf, white: 0xfffbed });
const FLIGHT_START = 0.12;
const STARDUST_COUNT = 22;

export function sigrikaStarGeometry({ target, width, height, boardSize }) {
  const cell = Math.max(14, Math.min(56, Math.min(width, height) / boardSize));
  const fromRight = target.x < width * 0.3;
  const start = {
    x: Math.max(cell * 0.6, Math.min(width - cell * 0.6, target.x + (fromRight ? 1 : -1) * cell * 2.6)),
    y: -cell * 1.2
  };
  const distance = Math.hypot(target.x - start.x, target.y - start.y);
  return {
    target, start, cell, distance,
    direction: { x: (target.x - start.x) / distance, y: (target.y - start.y) / distance }
  };
}

export function sigrikaStarFrame(progress, geometry) {
  const p = clamp01(progress);
  const flight = clamp01((p - FLIGHT_START) / (SIGRIKA_STAR_IMPACT_PROGRESS - FLIGHT_START));
  const fall = flight ** 3;
  const landed = p >= SIGRIKA_STAR_IMPACT_PROGRESS;
  const impact = clamp01((p - SIGRIKA_STAR_IMPACT_PROGRESS) / 0.28);
  const fade = p >= 1 ? 0 : 1 - clamp01((p - 0.9) / 0.1);
  return {
    x: geometry.start.x + (geometry.target.x - geometry.start.x) * fall,
    y: geometry.start.y + (geometry.target.y - geometry.start.y) * fall,
    fall, landed, impact, fade,
    burst: clamp01((p - SIGRIKA_STAR_IMPACT_PROGRESS) / (SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS - SIGRIKA_STAR_IMPACT_PROGRESS)),
    reveal: clamp01((p - SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS) / 0.16),
    starAlpha: clamp01(flight * 5) * (1 - clamp01((p - SIGRIKA_STAR_IMPACT_PROGRESS) / 0.025)),
    runeAlpha: clamp01(p / 0.14) * (1 - clamp01((p - 0.51) / 0.13)),
    returnProgress: clamp01((p - SIGRIKA_SUNSPIRIT_REVEAL_PROGRESS) / 0.2)
  };
}

export function playSigrikaStar({ app, pixi, host, boardSize, target, durationMs }) {
  const geometry = sigrikaStarGeometry({ target, width: host.clientWidth, height: host.clientHeight, boardSize });
  const layer = new pixi.Container();
  const rune = new pixi.Graphics();
  const glow = new pixi.Graphics();
  const rings = new pixi.Graphics();
  const trail = new pixi.Graphics();
  const star = new pixi.Graphics();
  const dust = new pixi.Graphics();
  layer.addChild(rune, glow, rings, trail, star, dust);
  app.stage.addChild(layer);
  const startedAt = performance.now();

  app.ticker.add(() => {
    const progress = clamp01((performance.now() - startedAt) / durationMs);
    const frame = sigrikaStarFrame(progress, geometry);
    const { cell } = geometry;
    layer.alpha = frame.fade;
    const shake = frame.landed ? (1 - clamp01((progress - SIGRIKA_STAR_IMPACT_PROGRESS) / 0.085)) * cell * 0.075 : 0;
    layer.x = shake ? Math.sin(progress * 100) * shake : 0;
    layer.y = shake ? Math.cos(progress * 90) * shake * 0.6 : 0;
    rune.clear();
    glow.clear();
    rings.clear();
    trail.clear();
    star.clear();
    dust.clear();

    drawRune(rune, geometry, progress, frame.runeAlpha);
    if (frame.starAlpha > 0) {
      drawStarTrail(trail, geometry, frame);
      const radius = cell * 0.42 * (frame.landed ? 1 - frame.impact * 0.55 : 1);
      star.circle(frame.x, frame.y, radius * 1.55).fill({ color: COLORS.gold, alpha: 0.09 * frame.starAlpha });
      star.star(frame.x, frame.y, 5, radius, radius * 0.4, -0.18)
        .fill({ color: COLORS.light, alpha: frame.starAlpha });
      star.star(frame.x, frame.y, 5, radius * 0.56, radius * 0.2, -0.18)
        .fill({ color: COLORS.white, alpha: 0.88 * frame.starAlpha });
    }
    if (!frame.landed) return;

    const pulse = (1 - frame.burst) ** 1.5;
    const mintArrival = Math.sin(Math.PI * frame.reveal);
    // Contact has its own bright, sharp burst before the sleeping creature appears.
    drawContactBurst(glow, geometry, frame.burst, pulse);
    glow.ellipse(target.x, target.y, cell * 0.65, cell * 0.44)
      .fill({ color: COLORS.mint, alpha: mintArrival * 0.13 });
    rings.circle(target.x, target.y, cell * (0.28 + easeOut(frame.burst) * 1.48))
      .stroke({ width: Math.max(1, cell * 0.09 * (1 - frame.burst)), color: COLORS.gold, alpha: 0.9 * pulse });
    rings.circle(target.x, target.y, cell * (0.2 + easeOut(frame.burst) * 1.1))
      .stroke({ width: Math.max(0.8, cell * 0.035), color: COLORS.white, alpha: 0.7 * pulse });
    drawReturningStardust(dust, geometry, frame);
  });
}

function drawContactBurst(graphics, { target, cell }, burst, pulse) {
  if (pulse <= 0) return;
  const expansion = easeOut(burst);
  graphics.circle(target.x, target.y, cell * (0.46 + expansion * 0.74))
    .fill({ color: COLORS.gold, alpha: pulse * 0.28 });
  graphics.star(target.x, target.y, 8, cell * (0.65 + expansion * 0.85), cell * 0.22, 0.12)
    .fill({ color: COLORS.light, alpha: pulse * 0.9 });
  graphics.circle(target.x, target.y, cell * (0.35 + expansion * 0.12))
    .fill({ color: COLORS.white, alpha: pulse * 0.96 });
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI / 6 + 0.12;
    const near = cell * (0.44 + expansion * 0.68);
    const far = near + cell * (0.36 + (index % 3) * 0.14) * (1 - burst);
    graphics.moveTo(target.x + Math.cos(angle) * near, target.y + Math.sin(angle) * near)
      .lineTo(target.x + Math.cos(angle) * far, target.y + Math.sin(angle) * far)
      .stroke({ width: cell * (index % 2 ? 0.025 : 0.045), color: COLORS.light, alpha: pulse * 0.85 });
  }
}

function drawStarTrail(graphics, { cell, direction, distance }, frame) {
  const length = Math.min(cell * 2.5, distance * frame.fall);
  const normal = { x: -direction.y, y: direction.x };
  for (const [scale, width, alpha, color] of [
    [1, 0.19, 0.12, COLORS.gold],
    [0.8, 0.09, 0.38, COLORS.gold],
    [0.57, 0.032, 0.7, COLORS.light]
  ]) {
    const tailX = frame.x - direction.x * length * scale;
    const tailY = frame.y - direction.y * length * scale;
    graphics.poly([
      frame.x + normal.x * cell * width, frame.y + normal.y * cell * width,
      tailX, tailY,
      frame.x - normal.x * cell * width, frame.y - normal.y * cell * width
    ]).fill({ color, alpha: alpha * frame.starAlpha });
  }
}

function drawRune(graphics, { target, cell }, progress, alpha) {
  if (alpha <= 0) return;
  const reveal = clamp01(progress / 0.32);
  for (let arc = 0; arc < 3; arc += 1) {
    const angle = arc * Math.PI * 2 / 3 - Math.PI / 2;
    const radius = cell * 0.67;
    const steps = 14;
    for (let step = 0; step <= steps; step += 1) {
      const theta = angle + (step / steps) * 1.5 * reveal;
      const x = target.x + Math.cos(theta) * radius;
      const y = target.y + Math.sin(theta) * radius * 0.8;
      if (step === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.stroke({ width: Math.max(1, cell * 0.025), color: arc === 1 ? COLORS.mint : COLORS.light, alpha: alpha * 0.65 });
    const x = target.x + Math.cos(angle) * radius;
    const y = target.y + Math.sin(angle) * radius * 0.8;
    graphics.star(x, y, 4, cell * 0.095, cell * 0.025)
      .fill({ color: COLORS.light, alpha: alpha * reveal * 0.8 });
  }
  // An open diamond keeps the actual intersection visible through the omen.
  const half = cell * 0.24 * reveal;
  graphics.poly([target.x, target.y - half, target.x + half, target.y, target.x, target.y + half, target.x - half, target.y])
    .stroke({ width: Math.max(0.8, cell * 0.018), color: COLORS.mint, alpha: alpha * 0.55 });
}

function drawReturningStardust(graphics, { target, cell }, frame) {
  const outward = easeOut(clamp01(frame.impact / 0.5));
  const returning = easeInOut(frame.returnProgress);
  const alpha = Math.min(1, frame.impact * 15) * (1 - frame.returnProgress) * 0.8;
  for (let index = 0; index < STARDUST_COUNT; index += 1) {
    const angle = index * 2.399963 + returning * 0.3;
    const radius = cell * (0.58 + (index % 5) * 0.13) * outward * (1 - returning);
    const x = target.x + Math.cos(angle) * radius;
    const y = target.y + Math.sin(angle) * radius * 0.8;
    const size = cell * (0.022 + (index % 3) * 0.011);
    const color = index % 3 === 0 ? COLORS.mint : COLORS.light;
    if (index % 4 === 0) graphics.star(x, y, 4, size * 1.7, size * 0.45).fill({ color, alpha });
    else graphics.circle(x, y, size).fill({ color, alpha: alpha * 0.7 });
  }
}

function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function easeOut(value) { return 1 - (1 - value) ** 3; }
function easeInOut(value) { return value * value * (3 - 2 * value); }

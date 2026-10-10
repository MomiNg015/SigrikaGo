import { DENIA_FORM_SWAP_MS, DENIA_SWARM_END_MS, DENIA_SWARM_START_MS } from "../shared/deniaSkillForm.js";

// Depth comes from size, speed, contrast and individual folding, never a tiled wall.
export function createDeniaPapers(width, height) {
  const mobile = width <= 600;
  const layers = [
    { spacing: 6500, size: mobile ? [22, 32] : [28, 42], opacity: .38 },
    { spacing: 1100, size: mobile ? [40, 58] : [50, 76], opacity: .92 },
    { spacing: 7500, size: mobile ? [62, 84] : [80, 112], opacity: 1 }
  ];
  let seed = 173;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  return layers.flatMap((layer, depth) => {
    const count = Math.min(depth === 1 ? 1200 : 200, Math.ceil(width * height / layer.spacing));
    const columns = Math.ceil(Math.sqrt(count * width / height));
    const rows = Math.ceil(count / columns);
    return Array.from({ length: count }, (_, index) => {
      const size = layer.size[0] + random() * (layer.size[1] - layer.size[0]);
      const x = ((index % columns) + random()) / columns * width;
      const y = (Math.floor(index / columns) + random()) / rows * height;
      const speed = Math.max(width / (850 - depth * 150) * (.75 + random() * .5),
        (x + size) / 750, (width + size - x) / 750);
      return { depth, x, y, size, speed, opacity: layer.opacity,
        angle: random() * Math.PI * 2, spin: (random() - .5) * (2 + depth * 2),
        fold: random() * Math.PI * 2, phase: random() * Math.PI * 2,
        lift: (18 + random() * 50) * (1 + depth * .45), drift: (random() - .5) * 75 };
    });
  });
}

export function createPaperFrames(image) {
  return [0, 1, 2].map((depth) => {
    const canvas = document.createElement("canvas");
    canvas.width = 112;
    canvas.height = 112;
    const context = canvas.getContext("2d");
    context.filter = depth === 0 ? "blur(.65px)" : "none";
    context.shadowColor = "rgba(8, 7, 25, .35)";
    context.shadowBlur = depth === 2 ? 6 : 2;
    context.shadowOffsetY = depth === 2 ? 3 : 1;
    context.drawImage(image, 24, 14, 64, 84);
    return canvas;
  });
}

export function deniaPaperPose(paper, elapsed) {
  const t = (elapsed - DENIA_FORM_SWAP_MS) / 750;
  return {
    x: paper.x + (elapsed - DENIA_FORM_SWAP_MS) * paper.speed,
    y: paper.y + paper.lift * (Math.sin(paper.phase + t * 2.4) - Math.sin(paper.phase)) + paper.drift * t,
    angle: paper.angle + t * paper.spin,
    fold: .18 + .82 * Math.abs(Math.cos(paper.fold + t * (2.1 + paper.depth * .6)))
  };
}

export function drawDeniaPapers(context, frames, papers, width, height, elapsed) {
  context.clearRect(0, 0, width, height);
  if (elapsed < DENIA_SWARM_START_MS || elapsed >= DENIA_SWARM_END_MS) return;
  for (const paper of papers) {
    const pose = deniaPaperPose(paper, elapsed);
    const size = paper.size * 112 / 84;
    if (pose.x < -size || pose.x > width + size || pose.y < -size || pose.y > height + size) continue;
    context.save();
    context.globalAlpha = paper.opacity;
    context.translate(pose.x, pose.y);
    context.rotate(pose.angle);
    context.scale(pose.fold, 1);
    context.drawImage(frames[paper.depth], -size / 2, -size / 2, size, size);
    context.restore();
  }
}

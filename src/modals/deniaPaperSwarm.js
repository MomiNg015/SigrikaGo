import { DENIA_FORM_SWAP_MS, DENIA_SWARM_END_MS, DENIA_SWARM_START_MS } from "../shared/deniaSkillForm.js";

// The reference is a flight through paper silhouettes: small distant groups,
// readable middle pieces, then close passes that hide the change of character.
export function createDeniaPapers(width, height) {
  const span = Math.min(width, height);
  const mobile = width <= 600;
  const layers = [
    { count: Math.min(64, Math.ceil(width * height / 18000)), size: [18, 30], opacity: .42 },
    { count: Math.min(96, Math.ceil(width * height / 10500)), size: mobile ? [44, 74] : [60, 104], opacity: .94 },
    { count: 14, size: [Math.sqrt(width * height) * .48, Math.sqrt(width * height) * .8], opacity: 1 }
  ];
  let seed = 173;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  return layers.flatMap((layer, depth) => {
    const columns = Math.ceil(Math.sqrt(layer.count * width / height));
    const rows = Math.ceil(layer.count / columns);
    return Array.from({ length: layer.count }, (_, index) => {
      const size = layer.size[0] + random() * (layer.size[1] - layer.size[0]);
      const x = depth === 2 ? ((index % columns) + .2 + random() * .6) / columns * width : random() * width;
      // Three loose ribbons share a current. Their edges stay broken instead of
      // spreading hundreds of equally weighted pieces across the whole screen.
      const lane = index % 3;
      const y = depth === 2 ? (Math.floor(index / columns) + .25 + random() * .5) / rows * height
        : height * (.16 + lane * .34 + .10 * Math.sin(x / width * 5 + lane)) + (random() - .5) * height * .13;
      const travel = Math.max(width * (1.05 + depth * .22), x + size * 1.7, width - x + size * 1.7) * (1 + random() * .12);
      return { depth, x, y, size, travel, opacity: layer.opacity,
        angle: Math.PI / 2 + (random() - .5) * 2.5,
        bank: (random() - .5) * 2.4, fold: (random() - .5) * (depth === 2 ? .9 : 3),
        phase: random() * Math.PI * 2, lift: span * (.05 + random() * .10),
        drift: (random() - .5) * height * .25, approach: -.04 + random() * .14 };
    });
  });
}

export function createPaperFrames(image) {
  return [0, 1, 2].map((depth) => {
    const canvas = document.createElement("canvas");
    // Near-lens silhouettes need enough source resolution to keep the outline
    // clean when enlarged. Blur is baked once, never applied during the draw loop.
    const ratio = depth === 2 ? 4 : 1;
    canvas.width = 112 * ratio;
    canvas.height = 112 * ratio;
    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    context.filter = depth === 0 ? "blur(.65px)" : depth === 2 ? "blur(1px)" : "none";
    context.shadowColor = "rgba(47, 40, 112, .5)";
    context.shadowBlur = depth === 2 ? 3 : 2;
    context.drawImage(image, 24, 14, 64, 84);
    return canvas;
  });
}

export function deniaPaperPose(paper, elapsed) {
  const halfWindow = (DENIA_SWARM_END_MS - DENIA_SWARM_START_MS) / 2;
  const t = (elapsed - DENIA_FORM_SWAP_MS) / halfWindow;
  return {
    x: paper.x + paper.travel * (t + .14 * t * t * t),
    y: paper.y + paper.lift * (Math.sin(paper.phase + t * 1.8) - Math.sin(paper.phase)) + paper.drift * t,
    angle: paper.angle + Math.sin(t * 1.4) * paper.bank,
    fold: .22 + .78 * Math.abs(Math.cos(paper.fold + t * (1.5 + paper.depth * .3))),
    // A close pass grows into the lens and recedes. Continuous large sprites
    // moving in parallel read as another wall, even with different velocities.
    scale: paper.depth === 2 ? .16 + .84 * Math.exp(-(((t - paper.approach) / .32) ** 2)) : 1 + .12 * t,
    curl: Math.sin(paper.phase + t * 3) * .12
  };
}

export function drawDeniaPapers(context, frames, papers, width, height, elapsed) {
  context.clearRect(0, 0, width, height);
  if (elapsed < DENIA_SWARM_START_MS || elapsed >= DENIA_SWARM_END_MS) return;
  for (const paper of papers) {
    const pose = deniaPaperPose(paper, elapsed);
    const size = paper.size * pose.scale * 112 / 84;
    if (pose.x < -size || pose.x > width + size || pose.y < -size || pose.y > height + size) continue;
    context.save();
    context.globalAlpha = paper.opacity;
    context.translate(pose.x, pose.y);
    context.rotate(pose.angle);
    context.scale(pose.fold, 1);
    if (paper.depth === 2) {
      const frame = frames[paper.depth];
      // Curved ribbons of the cached image suggest flexible paper rather than
      // stiff icons. Scaled overlap avoids hairline seams between bands.
      const slices = 12;
      for (let slice = 0; slice < slices; slice++) {
        const v = slice / slices;
        const shift = Math.sin(v * Math.PI * 2) * pose.curl * size;
        const nextShift = Math.sin((v + 1 / slices) * Math.PI * 2) * pose.curl * size;
        context.save();
        context.transform(1, 0, (nextShift - shift) / (size / slices), 1, shift, -size / 2 + v * size);
        const overlap = 1.5;
        context.drawImage(frame, 0, v * frame.height, frame.width, frame.height / slices + overlap * frame.height / size,
          -size / 2, 0, size, size / slices + overlap);
        context.restore();
      }
    } else {
      context.drawImage(frames[paper.depth], -size / 2, -size / 2, size, size);
    }
    context.restore();
  }
}

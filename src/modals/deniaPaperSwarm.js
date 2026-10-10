import { DENIA_SWARM_END_MS, DENIA_SWARM_START_MS } from "../shared/deniaSkillForm.js";

// A seeded, overlapping paper carpet. Only visible sprites are drawn; rotation
// frames are cached once so the dense cover does not create thousands of DOM nodes.
export function createDeniaPapers(width, height, { small = width <= 600 } = {}) {
  const minSize = small ? 34 : 44;
  const maxSize = small ? 56 : 76;
  const spacing = small ? 17 : 22;
  const papers = [];
  let seed = 173;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let y = -maxSize; y < height + maxSize; y += spacing) {
    for (let x = 0; x < width * 1.5; x += spacing) {
      papers.push({ x: x + random() * spacing, y: y + random() * spacing,
        size: minSize + random() * (maxSize - minSize), angle: Math.floor(random() * 12),
        drift: random() * 18 - 9, phase: random() * Math.PI * 2 });
    }
  }
  return papers;
}

export function createPaperFrames(image) {
  return Array.from({ length: 12 }, (_, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = 112;
    canvas.height = 112;
    const context = canvas.getContext("2d");
    context.translate(56, 56);
    context.rotate(index * Math.PI / 6);
    context.drawImage(image, -32, -42, 64, 84);
    return canvas;
  });
}

export function createPaperField(frames, width, height) {
  // A small seamless texture keeps preparation cheap too, including on phones.
  const papers = createDeniaPapers(256, 256, { small: width <= 600 });
  const tile = document.createElement("canvas");
  tile.width = 384;
  tile.height = 256;
  const tileContext = tile.getContext("2d");
  for (const paper of papers) {
    const size = paper.size * 112 / 84;
    for (const dx of [-tile.width, 0, tile.width]) {
      for (const dy of [-tile.height, 0, tile.height]) {
        const x = paper.x + dx - size / 2;
        const y = paper.y + dy - size / 2;
        if (x + size < 0 || x > tile.width || y + size < 0 || y > tile.height) continue;
        tileContext.drawImage(frames[paper.angle], x, y, size, size);
      }
    }
  }
  const field = document.createElement("canvas");
  field.width = Math.ceil(width * 1.5 + 112);
  field.height = Math.ceil(height + 112);
  const context = field.getContext("2d");
  context.fillStyle = context.createPattern(tile, "repeat");
  context.fillRect(0, 0, field.width, field.height);
  // Just 64 loose foreground papers tumble; the dense body uses eight cached
  // strips regardless of screen size or apparent particle count.
  const loose = Array.from({ length: 64 }, (_, index) => ({ ...papers[Math.floor(index * papers.length / 64)],
    x: ((index * .618) % 1) * width * 1.5, y: ((index * .381) % 1) * height }));
  return { field, loose };
}

export function drawDeniaPapers(context, frames, { field, loose }, width, height, elapsed) {
  context.clearRect(0, 0, width, height);
  if (elapsed < DENIA_SWARM_START_MS || elapsed >= DENIA_SWARM_END_MS) return;
  const progress = (elapsed - DENIA_SWARM_START_MS) / (DENIA_SWARM_END_MS - DENIA_SWARM_START_MS);
  const offset = -width * 1.5 + progress * width * 2.6;
  for (let index = 0; index < 8; index += 1) {
    const top = Math.floor(index * field.height / 8);
    const bottom = Math.floor((index + 1) * field.height / 8);
    const wave = Math.sin(index * .8 + progress * 5) * 18;
    context.drawImage(field, 0, top, field.width, bottom - top,
      offset - 56 + wave, top - 56, field.width, bottom - top);
  }
  for (const paper of loose) {
    const x = paper.x + offset + Math.sin(paper.phase + progress * 5) * 24
      + Math.sin(paper.y / height * Math.PI * 3) * 24;
    const y = paper.y + Math.sin(paper.phase + progress * 7) * paper.drift;
    const frameSize = paper.size * 112 / 84;
    if (x < -frameSize || x > width + frameSize || y < -frameSize || y > height + frameSize) continue;
    const rotation = (paper.angle + Math.floor(progress * 4)) % frames.length;
    context.drawImage(frames[rotation], x - frameSize / 2, y - frameSize / 2, frameSize, frameSize);
  }
}

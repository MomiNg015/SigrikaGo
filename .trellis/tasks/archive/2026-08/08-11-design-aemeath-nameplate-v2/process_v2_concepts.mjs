import sharp from "sharp";

const root = ".trellis/tasks/08-11-design-aemeath-nameplate-v2/concepts/v2-sigrika-feel";
const concepts = [
  { slug: "a-paper-flight-beacon", left: 40 },
  { slug: "b-dual-color-data-knot", left: 40 },
  { slug: "c-electronic-snowfluff-resonance", left: null }
];
const canvasWidth = 1125;
const canvasHeight = 240;
const maxSubjectWidth = 1045;
const maxSubjectHeight = 224;
const previewWidth = 750;
const previewHeight = 160;

async function processConcept({ slug, left: requestedLeft }) {
  const input = `${root}/key-removed/${slug}.png`;
  const candidate = `${root}/candidates/${slug}-1125x240.png`;
  const runtime = `${root}/runtime/${slug}-150x32.png`;
  const preview = `${root}/previews/${slug}-username.png`;

  const trimmed = await sharp(input)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
    .png()
    .toBuffer();
  const metadata = await sharp(trimmed).metadata();
  const scale = Math.min(maxSubjectWidth / metadata.width, maxSubjectHeight / metadata.height);
  const width = Math.max(1, Math.round(metadata.width * scale));
  const height = Math.max(1, Math.round(metadata.height * scale));
  const resized = await sharp(trimmed)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const centeredLeft = Math.round((canvasWidth - width) / 2);
  const left = requestedLeft ?? centeredLeft;
  const top = Math.round((canvasHeight - height) / 2);

  const finalBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();

  await sharp(finalBuffer).toFile(candidate);
  await sharp(finalBuffer)
    .resize(150, 32, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(runtime);

  const previewAsset = await sharp(finalBuffer)
    .resize(previewWidth, previewHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const usernameSvg = Buffer.from(`
    <svg width="${previewWidth}" height="${previewHeight}" xmlns="http://www.w3.org/2000/svg">
      <text x="210" y="103"
        font-family="Inter, Segoe UI, Microsoft YaHei, sans-serif"
        font-size="66" font-weight="800" letter-spacing="1"
        fill="#f8feff" stroke="rgba(3, 54, 74, 0.92)" stroke-width="3"
        paint-order="stroke fill">MOMING</text>
    </svg>
  `);
  await sharp({
    create: {
      width: previewWidth,
      height: previewHeight,
      channels: 4,
      background: { r: 16, g: 24, b: 39, alpha: 1 }
    }
  })
    .composite([
      { input: previewAsset, left: 0, top: 0 },
      { input: usernameSvg, left: 0, top: 0 }
    ])
    .png()
    .toFile(preview);

  return { slug, input: { width: metadata.width, height: metadata.height }, subject: { width, height, left, top } };
}

const results = [];
for (const concept of concepts) {
  results.push(await processConcept(concept));
}
console.log(JSON.stringify(results, null, 2));

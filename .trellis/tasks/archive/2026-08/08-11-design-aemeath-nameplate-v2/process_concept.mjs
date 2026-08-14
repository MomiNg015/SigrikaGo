import sharp from "sharp";

const taskRoot = ".trellis/tasks/08-11-design-aemeath-nameplate-v2";
const concepts = [
  {
    slug: "paper-signal-departure",
    textFill: "#0b4f6b",
    textStroke: "rgba(239, 254, 255, 0.92)"
  },
  {
    slug: "snowfluff-reply",
    textFill: "#f8feff",
    textStroke: "rgba(7, 70, 94, 0.9)"
  },
  {
    slug: "dual-frequency-voyage",
    textFill: "#f8feff",
    textStroke: "rgba(7, 70, 94, 0.9)"
  }
];

const canvasWidth = 1125;
const canvasHeight = 240;
const maxSubjectWidth = 1045;
const maxSubjectHeight = 224;
const previewWidth = 750;
const previewHeight = 160;

async function processConcept({ slug, textFill, textStroke }) {
  const input = `${taskRoot}/concepts/key-removed/${slug}.png`;
  const candidate = `${taskRoot}/concepts/candidates/${slug}-1125x240.png`;
  const runtime = `${taskRoot}/concepts/runtime/${slug}-150x32.png`;
  const preview = `${taskRoot}/concepts/previews/${slug}-username.png`;

  const trimmed = await sharp(input)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
    .png()
    .toBuffer();
  const trimmedMetadata = await sharp(trimmed).metadata();
  const scale = Math.min(
    maxSubjectWidth / trimmedMetadata.width,
    maxSubjectHeight / trimmedMetadata.height
  );
  const subjectWidth = Math.max(1, Math.round(trimmedMetadata.width * scale));
  const subjectHeight = Math.max(1, Math.round(trimmedMetadata.height * scale));
  const subject = await sharp(trimmed)
    .resize(subjectWidth, subjectHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const left = Math.round((canvasWidth - subjectWidth) / 2);
  const top = Math.round((canvasHeight - subjectHeight) / 2);
  const finalBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: subject, left, top }])
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
        fill="${textFill}" stroke="${textStroke}" stroke-width="3"
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

  return {
    slug,
    input: { width: trimmedMetadata.width, height: trimmedMetadata.height },
    subject: { width: subjectWidth, height: subjectHeight, left, top },
    candidate,
    runtime,
    preview
  };
}

const results = [];
for (const concept of concepts) {
  results.push(await processConcept(concept));
}

console.log(JSON.stringify(results, null, 2));

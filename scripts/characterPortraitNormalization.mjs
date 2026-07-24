import path from "node:path";
import sharp from "sharp";

export const PORTRAIT_CANVAS_SIZE = 900;
export const PORTRAIT_SAFE_SIZE = 792;
export const PORTRAIT_MARGIN = (PORTRAIT_CANVAS_SIZE - PORTRAIT_SAFE_SIZE) / 2;
export const PORTRAIT_MAX_FILE_BYTES = 2_000_000;

export function isRemotePortraitUrl(url) {
  return /^https?:\/\//i.test(String(url ?? "").trim());
}

export function isRepositoryPortraitUrl(url) {
  return String(url ?? "").startsWith("/assets/");
}

export function portraitUrlToFilePath(url, publicRoot) {
  if (!isRepositoryPortraitUrl(url)) {
    throw new Error(`Portrait URL must start with /assets/: ${url}`);
  }
  const root = path.resolve(publicRoot);
  const relativePath = String(url).slice(1).split("/").join(path.sep);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Portrait URL escapes public root: ${url}`);
  }
  return resolved;
}

export async function alphaBounds(input, { alphaThreshold = 0 } = {}) {
  const metadata = await sharp(input, { failOn: "error" }).metadata();
  if (!metadata.hasAlpha) throw new Error("Portrait must contain an alpha channel");

  const { data, info } = await sharp(input, { failOn: "error" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaIndex = info.channels - 1;
  const threshold = Math.max(0, Math.min(255, Math.floor(Number(alphaThreshold) || 0)));
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + alphaIndex] <= threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) throw new Error("Portrait has no visible pixels");
  return {
    left,
    top,
    right,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
    imageWidth: info.width,
    imageHeight: info.height
  };
}

export async function normalizePortraitBuffer(input, {
  canvasSize = PORTRAIT_CANVAS_SIZE,
  safeSize = PORTRAIT_SAFE_SIZE,
  alphaThreshold = 0
} = {}) {
  validateGeometry(canvasSize, safeSize);
  const existing = await validateNormalizedPortrait(input, {
    canvasSize,
    safeSize,
    alphaThreshold
  });
  if (existing.ok) {
    const margin = (canvasSize - safeSize) / 2;
    return {
      buffer: Buffer.from(input),
      sourceBounds: existing.bounds,
      placement: {
        left: existing.bounds.left,
        top: existing.bounds.top,
        width: existing.bounds.width,
        height: existing.bounds.height,
        margin
      }
    };
  }
  const bounds = await alphaBounds(input, { alphaThreshold });
  const content = await resizeVisibleContent(input, bounds, safeSize, alphaThreshold);
  const contentBounds = await alphaBounds(content, { alphaThreshold });
  const croppedContent = await sharp(content, { failOn: "error" })
    .extract({
      left: contentBounds.left,
      top: contentBounds.top,
      width: contentBounds.width,
      height: contentBounds.height
    })
    .png()
    .toBuffer();
  const width = contentBounds.width;
  const height = contentBounds.height;
  const margin = (canvasSize - safeSize) / 2;
  const left = Math.floor((canvasSize - width) / 2);
  const top = canvasSize - margin - height;

  const buffer = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: croppedContent, left, top }])
    .webp({ lossless: true, effort: 6 })
    .toBuffer();

  return {
    buffer,
    sourceBounds: bounds,
    placement: { left, top, width, height, margin }
  };
}

async function resizeVisibleContent(input, bounds, safeSize, alphaThreshold) {
  const initialScale = Math.min(safeSize / bounds.width, safeSize / bounds.height);
  let requestedWidth = Math.max(1, Math.round(bounds.width * initialScale));
  let requestedHeight = Math.max(1, Math.round(bounds.height * initialScale));

  for (let attempt = 0; attempt < 6; attempt += 1) {
    let pipeline = sharp(input, { failOn: "error" }).extract({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    });
    if (requestedWidth !== bounds.width || requestedHeight !== bounds.height) {
      pipeline = pipeline.resize(requestedWidth, requestedHeight, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3
      });
    }
    const content = await pipeline.ensureAlpha().png().toBuffer();
    const resizedBounds = await alphaBounds(content, { alphaThreshold });
    const longestEdge = Math.max(resizedBounds.width, resizedBounds.height);
    if (longestEdge === safeSize) return content;
    const correction = safeSize / longestEdge;
    requestedWidth = Math.max(1, Math.round(requestedWidth * correction));
    requestedHeight = Math.max(1, Math.round(requestedHeight * correction));
  }

  throw new Error(`Portrait alpha bounds did not converge to a ${safeSize}px safe box`);
}

export async function validateNormalizedPortrait(input, {
  canvasSize = PORTRAIT_CANVAS_SIZE,
  safeSize = PORTRAIT_SAFE_SIZE,
  maxFileBytes = PORTRAIT_MAX_FILE_BYTES,
  alphaThreshold = 0
} = {}) {
  validateGeometry(canvasSize, safeSize);
  const errors = [];
  const metadata = await sharp(input, { failOn: "error" }).metadata();
  if (metadata.format !== "webp") errors.push(`expected WebP, got ${metadata.format ?? "unknown"}`);
  if (metadata.width !== canvasSize || metadata.height !== canvasSize) {
    errors.push(`expected ${canvasSize}x${canvasSize}, got ${metadata.width}x${metadata.height}`);
  }
  if (!metadata.hasAlpha) errors.push("missing alpha channel");
  if (Buffer.byteLength(input) > maxFileBytes) {
    errors.push(`file exceeds ${maxFileBytes} bytes`);
  }

  let bounds = null;
  try {
    bounds = await alphaBounds(input, { alphaThreshold });
  } catch (error) {
    errors.push(error.message);
  }

  if (bounds) {
    const margin = (canvasSize - safeSize) / 2;
    const leftMargin = bounds.left;
    const rightMargin = canvasSize - bounds.right - 1;
    const topMargin = bounds.top;
    const bottomMargin = canvasSize - bounds.bottom - 1;
    if (Math.max(bounds.width, bounds.height) !== safeSize) {
      errors.push(`visible bounds must have a ${safeSize}px longest edge, got ${bounds.width}x${bounds.height}`);
    }
    if (Math.abs(leftMargin - rightMargin) > 1) {
      errors.push(`visible bounds must be horizontally centered, got margins ${leftMargin}/${rightMargin}`);
    }
    if (bottomMargin !== margin) {
      errors.push(`visible bounds must use ${margin}px bottom margin, got ${bottomMargin}px`);
    }
    if (topMargin < margin) {
      errors.push(`visible bounds exceed the ${safeSize}px safe box`);
    }
  }

  return { ok: errors.length === 0, errors, metadata, bounds };
}

function validateGeometry(canvasSize, safeSize) {
  if (!Number.isInteger(canvasSize) || canvasSize <= 0) {
    throw new Error("canvasSize must be a positive integer");
  }
  if (!Number.isInteger(safeSize) || safeSize <= 0 || safeSize > canvasSize) {
    throw new Error("safeSize must be a positive integer no larger than canvasSize");
  }
  if ((canvasSize - safeSize) % 2 !== 0) {
    throw new Error("canvasSize and safeSize must produce an integer safety margin");
  }
}

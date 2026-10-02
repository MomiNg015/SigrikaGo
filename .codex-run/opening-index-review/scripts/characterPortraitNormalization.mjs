import path from "node:path";
import sharp from "sharp";

export const PORTRAIT_CANVAS_SIZE = 900;
export const PORTRAIT_SAFE_SIZE = 792;
export const PORTRAIT_MARGIN = (PORTRAIT_CANVAS_SIZE - PORTRAIT_SAFE_SIZE) / 2;
export const PORTRAIT_MAX_FILE_BYTES = 2_000_000;
export const PORTRAIT_ANIMATION_QUALITY = 90;

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

export async function decodePortraitFrames(input) {
  const metadata = await sharp(input, { animated: true, failOn: "error" }).metadata();
  const pages = Math.max(1, Number(metadata.pages) || 1);
  const pageHeight = Number(metadata.pageHeight) || Number(metadata.height) || 0;
  const frames = [];

  for (let page = 0; page < pages; page += 1) {
    frames.push(await sharp(input, {
      page,
      pages: 1,
      failOn: "error"
    }).ensureAlpha().png().toBuffer());
  }

  return {
    metadata,
    pages,
    pageHeight,
    frames,
    delay: normalizeFrameDelays(metadata.delay, pages),
    loop: Number.isInteger(metadata.loop) ? metadata.loop : 0
  };
}

export async function alphaBoundsAcrossFrames(frames, { alphaThreshold = 0 } = {}) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error("Portrait must contain at least one frame");
  }

  const frameBounds = await Promise.all(frames.map((frame) => alphaBounds(frame, { alphaThreshold })));
  const imageWidth = frameBounds[0].imageWidth;
  const imageHeight = frameBounds[0].imageHeight;
  if (frameBounds.some((bounds) => (
    bounds.imageWidth !== imageWidth || bounds.imageHeight !== imageHeight
  ))) {
    throw new Error("Portrait animation frames must use the same canvas size");
  }

  const left = Math.min(...frameBounds.map((bounds) => bounds.left));
  const top = Math.min(...frameBounds.map((bounds) => bounds.top));
  const right = Math.max(...frameBounds.map((bounds) => bounds.right));
  const bottom = Math.max(...frameBounds.map((bounds) => bounds.bottom));
  return {
    left,
    top,
    right,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
    imageWidth,
    imageHeight
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
  const decoded = await decodePortraitFrames(input);
  const bounds = await alphaBoundsAcrossFrames(decoded.frames, { alphaThreshold });
  const resized = await resizeVisibleFrames(
    decoded.frames,
    bounds,
    safeSize,
    alphaThreshold
  );
  const contentBounds = resized.bounds;
  const width = contentBounds.width;
  const height = contentBounds.height;
  const margin = (canvasSize - safeSize) / 2;
  const left = Math.floor((canvasSize - width) / 2);
  const top = canvasSize - margin - height;

  const normalizedFrames = await Promise.all(resized.frames.map(async (content) => {
    const croppedContent = await sharp(content, { failOn: "error" })
      .extract({
        left: contentBounds.left,
        top: contentBounds.top,
        width,
        height
      })
      .png()
      .toBuffer();
    return sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: croppedContent, left, top }])
      .png()
      .toBuffer();
  }));

  const buffer = decoded.pages > 1
    ? await sharp(normalizedFrames, { join: { animated: true } })
      .webp({
        quality: PORTRAIT_ANIMATION_QUALITY,
        alphaQuality: 100,
        smartSubsample: true,
        effort: 4,
        delay: decoded.delay,
        loop: decoded.loop
      })
      .toBuffer()
    : await sharp(normalizedFrames[0], { failOn: "error" })
      .webp({ lossless: true, effort: 6 })
      .toBuffer();

  return {
    buffer,
    sourceBounds: bounds,
    placement: { left, top, width, height, margin },
    animation: {
      pages: decoded.pages,
      delay: decoded.delay,
      loop: decoded.loop
    }
  };
}

async function resizeVisibleFrames(frames, bounds, safeSize, alphaThreshold) {
  const initialScale = Math.min(safeSize / bounds.width, safeSize / bounds.height);
  let requestedWidth = Math.max(1, Math.round(bounds.width * initialScale));
  let requestedHeight = Math.max(1, Math.round(bounds.height * initialScale));

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const resizedFrames = await Promise.all(frames.map(async (frame) => {
      let pipeline = sharp(frame, { failOn: "error" }).extract({
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
      return pipeline.ensureAlpha().png().toBuffer();
    }));
    const resizedBounds = await alphaBoundsAcrossFrames(resizedFrames, { alphaThreshold });
    const longestEdge = Math.max(resizedBounds.width, resizedBounds.height);
    if (longestEdge === safeSize) {
      return { frames: resizedFrames, bounds: resizedBounds };
    }
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
  alphaThreshold = 0,
  requireAnimation = false
} = {}) {
  validateGeometry(canvasSize, safeSize);
  const errors = [];
  const decoded = await decodePortraitFrames(input);
  const metadata = decoded.metadata;
  if (metadata.format !== "webp") errors.push(`expected WebP, got ${metadata.format ?? "unknown"}`);
  if (metadata.width !== canvasSize || decoded.pageHeight !== canvasSize) {
    errors.push(`expected ${canvasSize}x${canvasSize} frames, got ${metadata.width}x${decoded.pageHeight}`);
  }
  if (!metadata.hasAlpha) errors.push("missing alpha channel");
  if (requireAnimation && decoded.pages < 2) {
    errors.push("expected an animated portrait with at least 2 frames");
  }
  if (Buffer.byteLength(input) > maxFileBytes) {
    errors.push(`file exceeds ${maxFileBytes} bytes`);
  }

  let bounds = null;
  try {
    bounds = await alphaBoundsAcrossFrames(decoded.frames, { alphaThreshold });
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

  return {
    ok: errors.length === 0,
    errors,
    metadata,
    bounds,
    animation: {
      pages: decoded.pages,
      pageHeight: decoded.pageHeight,
      delay: decoded.delay,
      loop: decoded.loop
    }
  };
}

function normalizeFrameDelays(delay, pages) {
  const values = Array.isArray(delay) ? delay : [delay];
  return Array.from({ length: pages }, (_, index) => {
    const candidate = Number(values[index] ?? values[0]);
    return Number.isFinite(candidate) && candidate >= 0 ? Math.round(candidate) : 100;
  });
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

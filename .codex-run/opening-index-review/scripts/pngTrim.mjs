import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const COLOR_TYPE_RGBA = 6;
const BIT_DEPTH_8 = 8;
const BYTES_PER_PIXEL = 4;

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

export function trimTransparentPng(buffer, { alphaThreshold = 0, padding = 0 } = {}) {
  const image = decodeRgbaPng(buffer);
  const bounds = transparentBounds(image, alphaThreshold);
  if (!bounds) return { buffer, changed: false, width: image.width, height: image.height, bounds: null };

  const pad = Math.max(0, Math.floor(Number(padding) || 0));
  const left = Math.max(0, bounds.left - pad);
  const top = Math.max(0, bounds.top - pad);
  const right = Math.min(image.width - 1, bounds.right + pad);
  const bottom = Math.min(image.height - 1, bounds.bottom + pad);
  const nextWidth = right - left + 1;
  const nextHeight = bottom - top + 1;

  if (left === 0 && top === 0 && nextWidth === image.width && nextHeight === image.height) {
    return { buffer, changed: false, width: image.width, height: image.height, bounds: { left, top, right, bottom } };
  }

  const pixels = Buffer.alloc(nextWidth * nextHeight * BYTES_PER_PIXEL);
  for (let y = 0; y < nextHeight; y += 1) {
    const sourceStart = ((top + y) * image.width + left) * BYTES_PER_PIXEL;
    const sourceEnd = sourceStart + nextWidth * BYTES_PER_PIXEL;
    image.pixels.copy(pixels, y * nextWidth * BYTES_PER_PIXEL, sourceStart, sourceEnd);
  }

  return {
    buffer: encodeRgbaPng({ width: nextWidth, height: nextHeight, pixels }),
    changed: true,
    width: nextWidth,
    height: nextHeight,
    bounds: { left, top, right, bottom }
  };
}

export function decodeRgbaPng(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new Error("PNG input must be a Buffer");
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error("Unsupported PNG: missing PNG signature");
  }

  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[10] !== 0 || data[11] !== 0 || data[12] !== 0) {
        throw new Error("Unsupported PNG: interlaced or non-standard compression/filter method");
      }
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== BIT_DEPTH_8 || colorType !== COLOR_TYPE_RGBA) {
    throw new Error(`Unsupported PNG: expected 8-bit RGBA, got bitDepth=${bitDepth} colorType=${colorType}`);
  }
  if (!width || !height || !idatChunks.length) throw new Error("Unsupported PNG: missing IHDR or IDAT");

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * BYTES_PER_PIXEL;
  const pixels = Buffer.alloc(width * height * BYTES_PER_PIXEL);
  let inputOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride));
    inputOffset += stride;
    unfilterRow(row, filter, pixels.subarray((y - 1) * stride, y * stride), BYTES_PER_PIXEL);
    row.copy(pixels, y * stride);
  }
  return { width, height, pixels };
}

export function encodeRgbaPng({ width, height, pixels }) {
  const stride = width * BYTES_PER_PIXEL;
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error("PNG dimensions must be positive integers");
  }
  if (!Buffer.isBuffer(pixels) || pixels.length !== stride * height) {
    throw new Error("RGBA pixel buffer does not match dimensions");
  }

  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const outputOffset = y * (stride + 1);
    scanlines[outputOffset] = 0;
    pixels.copy(scanlines, outputOffset + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = BIT_DEPTH_8;
  ihdr[9] = COLOR_TYPE_RGBA;
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function transparentBounds({ width, height, pixels }, alphaThreshold) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * BYTES_PER_PIXEL + 3] <= alphaThreshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right >= left && bottom >= top ? { left, top, right, bottom } : null;
}

function unfilterRow(row, filter, previousRow, bpp) {
  for (let index = 0; index < row.length; index += 1) {
    const left = index >= bpp ? row[index - bpp] : 0;
    const up = previousRow[index] ?? 0;
    const upLeft = index >= bpp ? previousRow[index - bpp] ?? 0 : 0;
    if (filter === 0) continue;
    if (filter === 1) row[index] = (row[index] + left) & 0xff;
    else if (filter === 2) row[index] = (row[index] + up) & 0xff;
    else if (filter === 3) row[index] = (row[index] + Math.floor((left + up) / 2)) & 0xff;
    else if (filter === 4) row[index] = (row[index] + paeth(left, up, upLeft)) & 0xff;
    else throw new Error(`Unsupported PNG filter type ${filter}`);
  }
}

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  return upDistance <= upLeftDistance ? up : upLeft;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function main() {
  const [, , inputPath, outputPath = inputPath] = process.argv;
  if (!inputPath) {
    console.error("Usage: node scripts/pngTrim.mjs <input.png> [output.png]");
    process.exitCode = 1;
    return;
  }
  const absoluteInput = path.resolve(inputPath);
  const absoluteOutput = path.resolve(outputPath);
  const result = trimTransparentPng(fs.readFileSync(absoluteInput));
  fs.writeFileSync(absoluteOutput, result.buffer);
  console.log(JSON.stringify({
    changed: result.changed,
    output: absoluteOutput,
    width: result.width,
    height: result.height,
    bounds: result.bounds
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

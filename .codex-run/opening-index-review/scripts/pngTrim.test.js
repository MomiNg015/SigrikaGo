import { describe, expect, it } from "vitest";
import { decodeRgbaPng, encodeRgbaPng, trimTransparentPng } from "./pngTrim.mjs";

describe("pngTrim", () => {
  it("trims transparent padding from an 8-bit RGBA PNG", () => {
    const width = 5;
    const height = 4;
    const pixels = Buffer.alloc(width * height * 4);
    setPixel(pixels, width, 2, 1, [255, 128, 64, 255]);
    setPixel(pixels, width, 3, 2, [20, 40, 60, 200]);

    const result = trimTransparentPng(encodeRgbaPng({ width, height, pixels }));
    const decoded = decodeRgbaPng(result.buffer);

    expect(result).toMatchObject({
      changed: true,
      width: 2,
      height: 2,
      bounds: { left: 2, top: 1, right: 3, bottom: 2 }
    });
    expect(decoded.width).toBe(2);
    expect(decoded.height).toBe(2);
    expect(pixelAt(decoded.pixels, decoded.width, 0, 0)).toEqual([255, 128, 64, 255]);
    expect(pixelAt(decoded.pixels, decoded.width, 1, 1)).toEqual([20, 40, 60, 200]);
  });

  it("keeps a fully transparent PNG unchanged", () => {
    const pixels = Buffer.alloc(2 * 2 * 4);
    const png = encodeRgbaPng({ width: 2, height: 2, pixels });
    const result = trimTransparentPng(png);

    expect(result.changed).toBe(false);
    expect(result.buffer).toBe(png);
    expect(result.bounds).toBeNull();
  });
});

function setPixel(pixels, width, x, y, rgba) {
  const offset = (y * width + x) * 4;
  for (let index = 0; index < rgba.length; index += 1) pixels[offset + index] = rgba[index];
}

function pixelAt(pixels, width, x, y) {
  const offset = (y * width + x) * 4;
  return Array.from(pixels.subarray(offset, offset + 4));
}

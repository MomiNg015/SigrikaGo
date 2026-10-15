import { describe, expect, it } from 'vitest';
import { portraitSilhouette } from './portraitSilhouette.js';

describe('portrait silhouette alpha', () => {
  it('fills internal translucent detail and holes while preserving exterior gaps', () => {
    const alpha = [
      0, 0, 0, 0, 0,
      0, 255, 180, 255, 0,
      0, 255, 0, 255, 0,
      0, 255, 130, 255, 0,
      0, 0, 0, 0, 0,
    ];
    const source = Uint8Array.from(alpha.flatMap((a) => [80, 120, 200, a]));
    const output = portraitSilhouette(source, 5, 5);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      expect(output[(y * 5 + x) * 4 + 3]).toBe(x > 0 && x < 4 && y > 0 && y < 4 ? 255 : 0);
    }
    expect(source[7 * 4 + 3]).toBe(180);
  });
  it('keeps transparent channels connected to the background open', () => {
    const source = Uint8Array.from([255, 0, 255, 255, 0, 255, 255, 0, 255].flatMap((a) => [0, 0, 0, a]));
    const output = portraitSilhouette(source, 3, 3);
    expect(output[4 * 4 + 3]).toBe(0);
    expect(output[3 * 4 + 3]).toBe(255);
  });
});

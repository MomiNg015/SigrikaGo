// Keep exterior transparency, but make the character and enclosed holes solid.
export function portraitSilhouette(rgba, width, height) {
  const count = width * height;
  const exterior = new Uint8Array(count);
  const queue = new Int32Array(count);
  let end = 0;
  const visit = (index) => {
    if (!exterior[index] && rgba[index * 4 + 3] < 128) {
      exterior[index] = 1;
      queue[end++] = index;
    }
  };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  for (let start = 0; start < end; start++) {
    const index = queue[start];
    const x = index % width;
    if (x > 0) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    if (index >= width) visit(index - width);
    if (index < count - width) visit(index + width);
  }
  const output = new Uint8Array(count * 4);
  for (let index = 0; index < count; index++) {
    output[index * 4] = output[index * 4 + 1] = output[index * 4 + 2] = 255;
    output[index * 4 + 3] = exterior[index] ? 0 : 255;
  }
  return output;
}

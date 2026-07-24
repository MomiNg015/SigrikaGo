# Animated WebP normalization findings

## Evidence

- `public/assets/characters/denia_color.gif`: 16 frames, 640×640 per frame, 70ms per frame, loop 0.
- `public/assets/characters/denia_color.webp`: 16 frames with matching dimensions, delay and loop metadata.
- `public/assets/characters/portraits/denia-candy.webp`: one 900×900 frame with no animation metadata.
- `normalizePortraitBuffer` opens inputs without `animated: true`, so Sharp decodes only the first page.

## Sharp behavior verified locally

- `sharp(path, { page: index, pages: 1 })` extracts a decoded frame.
- `sharp(frameBuffers, { join: { animated: true } }).webp({ delay, loop })` produces an animated WebP.
- A local probe recreated all 16 source frames and preserved the 70ms delays and loop 0.
- Sharp reports animated image `height` as all pages stacked vertically and `pageHeight` as the actual frame height; validation must use `pageHeight`.

## Chosen normalization model

- Compute the alpha union across decoded frames so one transform applies to every frame.
- Normalize each frame independently with that shared transform.
- Rejoin frames and preserve delay/loop.
- Validate the union geometry, per-frame canvas size and required animation metadata.


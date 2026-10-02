# Tighten mobile utility rows

## Requirements
- On portrait mobile, reduce the visual distance between the three home utility button rows by 8px each.
- Preserve the first row's position and all button/image dimensions and interaction effects.
- Keep desktop and unrelated WIP unchanged.

## Approach
Offset the second row by -8px and the third by -16px in the existing portrait owner. Preserve grid tracks and intrinsic image sizing so alignment changes cannot rescale assets or shift the first row through parent sizing.

## Acceptance
- Existing home/style tests pass.
- Only later row positions change; top row and dimensions remain identical.
- Update system design and generated HTML.

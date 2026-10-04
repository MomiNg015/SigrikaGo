# Existing paper and garment motif sources

Read-only asset inspection follows AGENTS.md and the handbook/CSS contracts. No production image or code was changed. Root owns implementation, documentation sync and visual verification.

## Minimal reusable sources

- `public/assets/mailbox/mail-body-paper-natural.webp` supplies existing natural paper grain. Reuse its central paper area at low opacity; do not introduce another paper bitmap.
- `public/assets/home/home-paper-grid.svg` supplies the existing irregular warm-ink grid. Its source is 144x144 and its strokes already have .19-.24 opacity; use a restrained shared layer rather than adding full-strength grids to every strip.
- No independent garment-emblem package was found in the current character, decoration, achievement, effect, home or title assets. `effects/changli-fire-phoenix.svg` and `changli-flame-sprite.svg` include colored gradients/glow filters and are poor direct background imports for this paper presentation.

## First three authentic garment motifs

The nine original full-body files and existing contact sheet were visually inspected. The three candidates below are especially legible in the supplied illustrations. Coordinates are manually estimated source-pixel rectangles `(x, y, width, height)` in the 832x1216 artwork; they are crop candidates, not a verified final extraction. Existing lossless handbook WebP images share that canvas and preserve source pixels.

| Character | Existing source | Garment detail | Candidate rectangle |
|---|---|---|---|
| Sigrika | `public/assets/characters/handbook-sprites/sigrika.webp` | White mountain/triangle band on the front coat panel | `(244, 640, 86, 31)` |
| Nabomo | `public/assets/characters/handbook-sprites/nabomo.webp` | Repeating gold triangles at the dark skirt hem | `(286, 628, 132, 49)` |
| Denia | `public/assets/characters/handbook-sprites/denia.webp` | Central gold leaf/teardrop ornament at the skirt hem | `(310, 665, 86, 51)` |

Crop rectangles include the underlying cloth color. A low-opacity monochrome treatment needs soft edge fading; simply stamping an opaque rectangular crop would add a visible patch. These should retain the original motif, not invent a different character emblem. Other characters can initially use the shared paper grain; complete nine bespoke motifs only after the first three read well.

## Placement and scale

- Desktop: one static motif in the expanded strip's empty side, away from the face/eye line and name; about 160-200px wide, 4-6% opacity. Clip it to the existing diagonal slice. Do not move or scale the portrait, add colored borders, or introduce glowing/shadow effects.
- Mobile: one fragment near the outer edge of the name side (right for left portraits, left for right portraits); about 90-110px wide, 3-4% opacity. Keep it away from the name's strongest strokes and use the unchanged source motif, without mirroring artwork.
- Unowned/missing-data slots: no real character motif, emblem or motif asset loading. Keep neutral shared paper, static silhouette/question placement where allowed, and the anonymous `暂无情报` exception. Baconbits can use only the shared paper grain for this first pass.
- This research did not crop/export assets, run a browser, or validate final rendered contrast. Root should visually inspect the first extraction before duplicating the treatment.

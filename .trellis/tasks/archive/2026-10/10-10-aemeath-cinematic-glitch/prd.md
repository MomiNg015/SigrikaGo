# Cinematic signal glitch

The user rejected readable code bars and asked for researched film/PV glitch language. Maxon Universe Glitch describes damaged footage and chromatic breakup; the viewed Motionstash Glitch Hit video demonstrates the picture itself tearing sideways with RGB fringes and block noise. The Creation Effects official demo could not play in this environment; do not claim to have viewed it.

Replace decorative glyph bands with live backdrop processing: horizontally displaced image slices, genuine separated color channels, brief fine signal noise and an irregular hit/recovery envelope. Keep the 1000ms trigger, 1120ms form replacement, 260ms burst, form persistence, disabled/reduced-motion guards and all board timing. No screen cloning, capture permissions, external video assets or new libraries. Chromium SVG backdrop filtering has been visually verified on the actual room before implementation.

## Acceptance
- [x] Original scene pixels visibly shear and split, with no readable code bars.
- [x] Short quiet/rupture/relock progression works on desktop and portrait mobile.
- [x] Lifecycle, cleanup, reduced motion, performance and image loading verified.
- [x] Preview, research links and docs updated; scoped commit preserves other WIP.

## Verification
13 form/lifecycle tests and 4 document tests pass. Lint, build and built CSS contracts pass. CSS inventory: 18 pass and two prior failures (899 bytes, 360px query). Actual pixel processing confirmed at 1440x900 and 390x844, mobile recording updated, pointer transparency and teardown checked. Full-window backdrop processing requires the portal root itself as filter surface; an inner filtered child sampled an empty stacking context, so that path was replaced before delivery.

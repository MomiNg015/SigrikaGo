# Desktop handbook alternating entry sample

## Goal
Build a reviewable prototype for the desktop handbook: the existing portrait strips enter alternately from above and below, in catalog order, when the window opens.

## Agreed scope
- Prototype only; reuse the real HouseModal, roster, theme and portrait framing.
- Move whole diagonal strips, alternating top/bottom, with a short stagger and no bounce.
- Provide replay and slow observation controls; allow normal hover and character details.
- Preserve the existing mobile layout and motion; support reduced motion.
- Use local fixture data; never save account changes or call the backend.

## Acceptance
- [x] Desktop strips alternate directions and settle within about 700ms.
- [x] Replay, close/reopen, hover and detail activation work without visual overflow.
- [x] Portrait phone layout stays unchanged and reduced motion skips translation.
- [x] Browser evidence and scoped lint pass; system-design entry links to the sample.

## Implementation
Standalone docs/design-samples/handbook-desktop-entry-2026-10-29 page. Sample-only CSS animates transform on .handbook-puzzle-piece, leaving production sources unchanged. Real images are decoded before the initial opening. Verify with Playwright on desktop and portrait phone; no mirrored unit tests are needed for this reversible prototype.

## Out of scope
Production rollout, mobile redesign, character ordering, art framing, account mutations and unrelated working-tree changes.

## Verification
- npm run lint passed.
- verify.mjs passed on 1440x900, 1920x1080, 390x844 and 360x640 with no page errors or API traffic.
- Visual review checked entry/settled frames and short-phone window controls.
- npm run docs:system-design passed.
- Toolbar colors/radius follow DESIGN.md; deterministic design hook is clean.

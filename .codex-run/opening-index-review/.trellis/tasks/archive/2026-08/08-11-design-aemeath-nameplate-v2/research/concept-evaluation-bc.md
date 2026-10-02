# 新增候选评估

## B — Snowfluff Reply / 雪绒回信

### Files

- Source: `concepts/source/snowfluff-reply.png`.
- Key removed: `concepts/key-removed/snowfluff-reply.png`.
- Candidate: `concepts/candidates/snowfluff-reply-1125x240.png`.
- Runtime: `concepts/runtime/snowfluff-reply-150x32.png`.
- Username preview: `concepts/previews/snowfluff-reply-username.png`.
- Validation: `concepts/snowfluff-reply-validation.json`.

### Checks

- Canvas: `1125 x 240`, RGBA, ratio `4.6875:1`.
- Alpha bounds: `86/8..1039/231`; margins `86/8/85/8`.
- Safe area: `x=315..975`, ratio `0.586667`.
- Runtime reading: pink and sky-blue winglets remain distinct; the small plane survives; white username begins at the exact `42px` inset without entering the left cluster.
- Structural reading: soft waveform edges and the folded reply corner distinguish B from A's straight slab and C's narrow dual routes.

## C — Dual-Frequency Voyage / 双频长航

### Files

- Source: `concepts/source/dual-frequency-voyage.png`.
- Key removed: `concepts/key-removed/dual-frequency-voyage.png`.
- Candidate: `concepts/candidates/dual-frequency-voyage-1125x240.png`.
- Runtime: `concepts/runtime/dual-frequency-voyage-150x32.png`.
- Username preview: `concepts/previews/dual-frequency-voyage-username.png`.
- Validation: `concepts/dual-frequency-voyage-validation.json`.

### Checks

- Canvas: `1125 x 240`, RGBA, ratio `4.6875:1`.
- Alpha bounds: `40/25..1084/215`; margins `40/25/40/24`.
- Safe area: `x=315..975`, ratio `0.586667`.
- Runtime reading: blue and pink paper-plane afterimages remain separable; the white username stays inside the calm deep-cyan carrier.
- Structural reading: the V-shaped launch crest, slender crossed routes, and converged arrow closure are visibly different from A and B.

## Shared gate

- Both validators pass with transparent corners and no geometry errors.
- The shared processing script passes `node --check`, and repository lint passes.
- The production Aemeath asset hash still matches `HEAD`.
- Both use pink and sky blue as dominant visible colors.
- No baked text, rank, title/badge slot, Go motif, trophy, bubble, rune, or generic esports emblem is present.
- Production Aemeath asset and exact-ID CSS remain unchanged until the user selects a concept.

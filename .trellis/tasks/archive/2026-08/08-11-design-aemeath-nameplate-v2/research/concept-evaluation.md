# 单版候选评估：纸信启航

## Files

- Built-in source: `concepts/source/paper-signal-departure.png`.
- Chroma-key removed: `concepts/key-removed/paper-signal-departure.png`.
- Delivery candidate: `concepts/candidates/paper-signal-departure-1125x240.png`.
- Runtime reduction: `concepts/runtime/paper-signal-departure-150x32.png`.
- Username preview: `concepts/previews/paper-signal-departure-username.png`.
- Validation: `concepts/paper-signal-departure-validation.json`.

## Deterministic checks

- Canvas: `1125 x 240`, RGBA, exact ratio `4.6875:1`.
- Alpha bounds: `left=40`, `top=14`, `right=1084`, `bottom=226`.
- Margins: `40/14/40/13`.
- Safe area: `x=315..975`, ratio `0.586667`.
- Transparent corners: yes.
- Validator result: pass, no errors.
- Processing script syntax: pass (`node --check`).
- Repository lint: pass (`npm run lint`).
- Production asset hash matches `HEAD`; the existing Aemeath PNG was not modified.

## Human review at runtime size

- The large paper-airplane silhouette and its main folds remain readable at `150 x 32`.
- The cyan electronic afterimage reads as an open launch burst rather than a circular badge.
- The center remains calm enough for the exact owner’s dark-teal username treatment.
- The username starts at the existing `42px` runtime inset and does not overlap the plane.
- The right tail is subordinate and dissolves into pixels plus one star point; it does not form a second equal endpoint.
- No baked text, rank, title slot, Go motif, trophy, bubble, rune, or generic esports emblem is present.
- The concept does not repeat the production asset’s stage fan, round snowfluff face, dual-plane endpoints, or full-width sharp speed panel.

## Selection gate

This remains a task-local concept. Do not overwrite the production Aemeath PNG or modify its exact-ID CSS until the user explicitly selects this artwork or requests a revision.

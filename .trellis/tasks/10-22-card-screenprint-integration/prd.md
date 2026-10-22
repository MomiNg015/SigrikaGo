# 正式接入功能卡片丝印

## Goal and authorization
The user approved the seven-role C sample and explicitly requested production integration. Promote the exact motifs, role mapping, size and corner placement to the ordinary Bright School UI across the approved eight window contexts. No further design choice is pending.

## Scope
- Public runtime SVG assets for identity, records, social, inventory, tactics, reading and honor.
- One bounded final CSS owner with explicit window/card selectors, preserving all card geometry, typography, animation and semantic state colors. Exclude corrupted theme and non-Bright-School surfaces. Character detail portals inherit the app shell normally.
- Reuse current production components; no API, business data, form behavior or persistence changes.
- Keep historical previews isolated from the new production styles and add a production-only preview entry for visual review.
- Update system-design entry/chapter, production contract, CSS inventory exact delta and meaningful integration checks. Preserve unrelated WIP.

## Acceptance
- [x] Approved motifs match sample assets and all eight runtime windows receive correct semantic assignments.
- [x] Desktop / 390 / 320px geometry, text, state colors and foreground art match approved sample; no overflow or asset failures.
- [x] Hover/selected/finished states retain texture and original semantic fills.
- [x] Corrupted and unthemed shells remain outside the texture owner; no global card wildcard.
- [x] Production build and CSS verification, relevant automated regression and lint pass.
- [x] Docs, exact scoped CSS baseline, screenshots and scoped commit complete.

## Implementation notes
Existing final profile paper styles use high specificity and important background shorthand. New shared paint rule must outrank those exact owners while setting background longhands only. Watch art belongs on `.wl-row::before`, not the row foreground. Portal rendering resolves to `.app-shell`. Ordinary geometry and left bookmark rails must be untouched.

## User steering
Rank cards must horizontally mirror the honor print and anchor at the lower left. Achievement cards retain the original lower-right honor print. Added an exact mirrored SVG variant (rank.svg) without mirroring any card content.

## Verification outcome
26 browser checks passed across eight windows at desktop, 390px and 320px. The two style contract suites passed 78 tests. Production build, compiled CSS, eight byte-exact distributed assets, portrait checks and production configuration checks passed. Full lint passed. Full-check limitations are documented in `docs/design-samples/academy-card-materials-2026-10-22/production-integration.md`: two default-timeout proxy tests passed with a diagnostic CLI timeout, and existing admin snapshot differs from local data. Neither unrelated implementation nor stored admin data was changed to force these gates green.

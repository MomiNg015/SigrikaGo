# 西格莉卡星落日灵技能演出美化

## Goal

Polish Sigrika's ordinary erase-point skill as a falling star revealing a sleepy Sunspirit (日灵). The user approved the previous audit's improvements and corrected the green residual artwork's identity; it is not a crater.

## Requirements

- Keep the existing star and green Sunspirit asset; do not create or replace artwork.
- Synchronize star contact, impact audio, burst and boundary at progress 0.58. Per user feedback, a distinct bright burst must happen before the Sunspirit appears at progress 0.76 (324ms later).
- Align and taper the star trail along its actual trajectory; scale visuals by board cell size on desktop and portrait mobile.
- Draw a short rune anticipation at the target and return sparse gold/mint stardust toward the sleepy Sunspirit after contact.
- Remove transient crater/scorch imagery. Use a brief gold-to-mint glow that yields to the unchanged Sunspirit artwork.
- Fade the visual boundary in at contact without changing game rules, authoritative points, interaction eligibility, or the existing 2000ms banner / 1800ms effect / 4000ms resolution schedule.
- Preserve reduced-motion and all-effects-off behavior, replay/observer compatibility, and cleanup.
- Update system-design entry, relevant asset/presentation documentation and generated HTML.

## Acceptance Criteria

- [x] No impact feedback before star contact; audio, DOM and Pixi use one shared phase.
- [x] Trajectory-aligned trail, rune cue and returning stardust are visible in frame review.
- [x] The final marker is clearly the existing sleepy Sunspirit, with no scorch/crater residue.
- [x] Center and corner casts work at desktop and 360/390/412 portrait board sizes; transient effects end transparent.
- [x] Erased boundary appears during presentation and hands off without a flash or gameplay mutation; adjacent existing invalid points remain correct.
- [x] Focused tests, lint, build/CSS contracts and documentation generation pass.

## Decision and Scope

The user's current message approves implementation of the prior audit and its two additive suggestions. No open preference questions remain. Use the current hybrid Pixi/DOM architecture; keep the established banner and gameplay duration, normal star palette, Sunspirit asset and other characters intact. No new dependencies, backend changes, generic theme overhaul, account data writes or unrelated WIP edits. Edge cases include corners, adjacent erased regions, reduced motion and disabled effects. Slow Pixi preparation remains covered by the existing preload/error contract rather than introducing a new global presentation clock in this focused change.

## Technical Notes

- Shared skill phase belongs in a small shared Sigrika presentation module consumed by catalog, renderer and Board, avoiding a skillPresentation/catalog import cycle.
- Renderer currently lives in boardSkillEffectRegistry.js; focused Sigrika renderer extraction is acceptable to keep authored drawing isolated and testable.
- Board owns the final DOM Sunspirit and SVG invalid-region boundary. Preserve its memoized point rendering and static resolved geometry.
- Existing unrelated edits: RoomScreen.jsx/test, tutorial test, mobile window-sticker header and action-panel hint CSS; .codex-run is pre-existing untracked QA material.

## Verification and Review State

Implementation is ready for continued visual review, with a scoped commit prepared after the second iteration. The interactive local preview uses the real Board component at `http://127.0.0.1:5173/.codex-run/sigrika-sunspirit-review/`.

- 154 focused tests across Board, renderer, timing/audio, CSS inventory and generated docs pass.
- Lint, production build, built-CSS contracts, portraits, admin snapshot and production config checks pass. System design HTML regenerated.
- Browser frame review covered desktop and portrait 360/390/412, center/corner targets, adjacent erased regions, pre-contact invisibility, cleanup, reduced motion and effects disabled. No page errors or horizontal overflow. Evidence: `.codex-run/sigrika-sunspirit-review/browser-results.json` and impact PNGs.
- Fixed two observed cascade issues: Bright School transform reset blocking marker settling, and later animation shorthand overriding reduced-motion boundary delay.
- Full `npm run check` reached 2564 tests. After fixing the changed sound cue assertion and regenerating docs, four unrelated pre-existing failures remain in HouseModal.test.js (599, 1008), ShopModal.test.js (728), and RoomScreen.test.js (945). Reviewer confirmed failing assertions and direct source owners match HEAD. Focused rerun log/results are stored with the preview; these unrelated files were preserved.
- Existing build warnings concern two unresolved public-asset placeholders and the ExcelJS chunk size; no new dependency or backend changes.

## Second visual iteration

User requested a stronger impact and explicit ordering: contact, burst, then Sunspirit. Added a bright gold-white core, eight-point flash, radial rays and thicker shock rings; separated marker reveal at 0.76 while preserving audio/boundary contact at 0.58 and total duration. Design-hook color findings refer to unchanged stone/confirmation styles in latest-touch-void.css and are out-of-scope false positives, not newly introduced palette drift; no suppression added.

Second-iteration validation: 89 focused tests, ESLint, production build and built-CSS checks pass. Desktop frame samples at 3000/3080/3270ms show zero Sunspirit opacity; 3460ms shows the creature after the burst. Portrait corner cast at 390px also keeps the creature hidden during impact and has no horizontal overflow or page errors. Previously reviewed unrelated full-suite failures remain outside scope. Existing test color literals flagged by the design hook are unchanged regression fixtures, also contextual false positives.

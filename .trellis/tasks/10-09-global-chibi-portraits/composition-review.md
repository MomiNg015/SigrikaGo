# Scene-specific portrait revision

## Decisions

- Outfit selection: padded full-body SVG with meet; no pupil-centred slice.
- Student ID: complete-head avatar centred in the miniature frame.
- Profile / ordinary battle: headwear-safe upper-body photo.
- Desktop team: centred proportional figures in the existing diagonal paper slices.
- Portrait-phone team: active member above two small numbered photos; hidden members never resolve an asset.
- Portrait-phone Q story: whole character above bounded dialogue, with stable expression scale and existing long-text movement.

## Root-cause retrospective

Category D/E: previous checks assumed image loading, proportional pixels and no overflow implied a good composition. Fixed eye anchors were reused across incompatible frames. Source avatars permanently removed headwear; narrow team masks removed facial features; tall mobile story sprites occupied the dialogue area.

A later mobile team fix initially lost to the final shared data-variant rule: equal specificity let the shared 50% top anchor win while the earlier translation reset still applied. The resolved mobile selector includes both variant and standard attributes under the slot. Regression checks measure real eye positions within the visible photo, not merely image/frame dimensions. Full-theme screenshots caught this before acceptance.

## Verification

- 33 full pages at 1440x900, 390x844 and 360x640 plus nine character photos at each size; manually reviewed representative pages and every character head. Supplementary 768x390 landscape screenshots.
- 73 unique browser cases passed across the full run and a six-case focused repair run.
- 3090 unit cases: 3088 passed in the broad run; stale generated documentation and justified CSS budget were repaired and targeted checks passed (37 cases). Earlier 124 targeted portrait/owner cases passed.
- Final lint, build, built-CSS, portrait normalization and admin snapshot checks passed. Documentation regenerated.
- Changes remain uncommitted; unrelated existing work retained.

Current evidence: `docs/design-samples/handbook-chibi/composition-review-2026-10-09/`.

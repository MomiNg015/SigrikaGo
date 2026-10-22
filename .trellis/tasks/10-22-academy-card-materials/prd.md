# Cross-window card material redesign

## Brief
The user rejected the previous corner-line samples as cheap and asked for an Arknights / Endfield informed redesign, expanded beyond profile windows. The prior three-sample requirement remains in force. Produce three isolated, reviewable directions with actual current player windows. Preserve the underlying product flows and card geometry; this is visual exploration, not production integration.

## Directions
- Academy imprint: oversized cropped existing StarTorch emblem and broad restrained ink fields.
- Industrial relief: original rendered matte relief material concentrated in a corner, inspired by the Endfield reference's dimensional terrain/material.
- Tactical screenprint: substantial solid geometry with localized print/dither breakup, avoiding thin orbital/coordinate line art.

## Scope
Real profile/self and social detail, friends companion, warehouse inspector/list, watch room cards, handbook character/skill detail. Also provide compact achievement/notice studies if the production fixtures permit. Every direction must be visible across multiple families, not only a written rollout table. Keep semantic status, buttons and typography legible. Desktop and portrait 390/320 px; default/empty and long-content checks.

## Evidence
User-provided local references at docs/design-samples/profile-reference-v2-2026-10-19/references/{arknights,endfield}.png, current PRODUCT.md / DESIGN.md and real modal styles. Official reference links: https://ak.hypergryph.com/ and https://endfield.gryphline.com/zh-tw . The palette can become more neutral in this isolated exploration because the user explicitly requested these references; do not impose new colors on production.

## Acceptance
- [x] Three materially different options with no repeated thin-line corner motif.
- [x] Eight actual window contexts selectable in each option.
- [x] Explicit single corner composition, scale variation, no full-card tiling.
- [x] Real browser screenshots inspected on desktop and portrait; controls and overflow checked.
- [x] Design notes, sources, generation prompt and system-design documentation synchronized.
- [x] Preserve all unrelated WIP; scoped commit only.

## QA inventory
Variant/window/size switches; texture off/baseline; profile modes, friend selection, warehouse selection, watch search, handbook scrolling. Check existing special skill/character art is preserved. No live account writes. Regression check visual geometry against untextured current components.

## Outcome
Three directions are available in eight production window components. Saved 24 desktop screenshots, 12 portrait screenshots and 12 card crops. Browser checks: 24 desktop + 48 portrait cases; 48 target-card rectangle comparisons against baseline with no differences; 16 empty/long-content cases at 320px without horizontal overflow. Eleven selection, reading and comparison controls exercised. Scoped lint passed. The earlier rejected sample is marked as superseded.

## Spec decision
No new production contract: the stylesheet is isolated to the sample document root and no production component or theme was edited. The existing portal behavior required placing the marker on the sample document root; documented in the sample README. Existing shared CSS specs are unrelated WIP and remain untouched. Sources, chosen deviations from the showroom palette and image-generation prompt are recorded in the sample directory.

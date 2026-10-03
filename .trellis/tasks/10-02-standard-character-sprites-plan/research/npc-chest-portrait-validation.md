# NPC chest portrait correction

## Confirmed presentation

Small home and teaching bubbles use chest-up standard portraits. Crop only the bottom; retain complete upper and lateral character contours. Anchor the crop bottom to the whole bubble, reserve enough width for the art, and leave space before the original dialogue text. Keep original bubble position/width, board and controls; text wraps naturally within the new standard-only column.

## Cause and correction

The prior frame was anchored to the 68/58px avatar slot, so its bottom floated above the bubble bottom. Enlarging it inside that narrow reservation cut hair/head ornaments and crowded text. The final standard reservation is 140/130px with 20/18px column gaps; a static slot lets the absolute frame anchor to the whole section. Full-source height stays 350/320px; the 112/102px bottom crop shows the same chest-up region. `overflow: visible` and a horizontally expanded clip retain side contours. Legacy portraits retain old reservations; image failures restore original image geometry, with the detached home placeholder retaining its wider column to prevent text/target positioning jumps.

Home uses a separate measured `dialogueHeight`, observing the inner dialogue alongside the existing panel. Preparation status and panel scroll limits do not determine the art bottom. A stronger home selector caps top protrusion at 12px and survives the later phone rule, clearing the existing 16px target gap.

## Verification

- ESLint: PASS.
- Focused unit/DOM/CSS contracts: 105 tests in 5 files PASS.
- Production-built story/NPC browser suite: 7 tests PASS, desktop 1280x900 and portrait 390x844/360x640. Original script lines, full resolution, fixed image scale, bottom alignment, at least 15px frame/text clearance, expanded horizontal clipping and unchanged layout when decoration is hidden.
- Production-built complete home tour: 3 tests PASS at 1440x1000, 390x844 and 360x640. All 24 original steps, target tracking/clearance, input interception and completion.
- Earlier browser failures were test timing (entrance scale and late font reflow); geometry checks now wait for the entrance and compare decoration visibility in one synchronous browser evaluation. Initial home phone clearance failure exposed an equal-specificity override; the home winner was strengthened and all tours passed.
- Exact CSS change: +683 normalized bytes in the existing owner; no new CSS files, colors, important declarations, motion or breakpoint family. Baseline adds only this owned delta and preserves unrelated WIP.
- Read-only review checked all three chest-up alpha contours against the actual source images: left contours stay within the viewport, and the widest Sigrika right contour leaves roughly 18px before text. Home fallback preserves the placeholder and rendered mobile selector priority.
- Production app build and built-CSS contracts: PASS.

Screenshots use actual components with local fixture data. `C:/Users/Moming/.codex/visualizations/2026/10/02/01a0fbc7-ae53-71a3-90eb-82bdaae98b51/npc-portrait-fix/` contains desktop/mobile battle and home evidence. Logs and browser output are under `.tmp/npc-anchor-*`. No plot content, authored expressions, progression, API, database or character images changed.

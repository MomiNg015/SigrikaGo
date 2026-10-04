# 部员纪念册背景与落款精修

## Goal

Implement the user's accepted visual direction from the current desktop/mobile handbook audit: a restrained member memento page with themed paper gradients, real character ornament watermarks and refined name signatures. The user has approved implementation with “那你改一下吧”.

## Requirements

- Preserve the current ordered diagonal strips, portrait eye lines and sizes, fixed desktop crop, one-way horizontal hover travel and direct owned-detail activation.
- Owned backgrounds use paper white with locally stronger character color that fades into the name/blank side; mobile mirrors the fade with the alternating portrait side.
- Use real existing asset details for a quiet decorative watermark in the empty side, fading slightly stronger on preview. Earlier explicit user permission to crop supplied standing artwork applies to extracting these details; do not invent emblems, generate new character art or duplicate heads as background.
- Names retain the verified Chinese font, transparent background, desktop lower-right preview-only placement and mobile opposite-side resting visibility. Add only a restrained short signature rule; no badges, heavy borders, glow or shadows.
- Paper texture may reuse the existing natural letter-paper bitmap at low opacity. Maintain clear ink contrast.
- Unowned and missing-intel slots remain achromatic, anonymous, disabled and static, without owned-only ornaments or ornamental identity details.
- Preserve existing scrolling, decoration tab, portrait/costume/candy precedence, full-body details, corruption isolation and deferred sortie selection.
- Scope CSS to the bounded handbook owners; document any required split and inventory delta.

## Acceptance Criteria

- [x] Desktop resting/expanded and mobile alternating strips visibly show the approved paper and signature composition.
- [x] First/middle/last desktop art dimensions and crop remain constant across preview; motion stays in one direction.
- [x] Mobile at 360x640 and 390x844 remains readable, horizontally contained and scrollable through the final row.
- [x] Unowned and missing-intel states retain their anonymous static rendering without ornament detail.
- [x] Existing handbook DOM/helper/CSS and focused browser checks pass, plus lint, production build and built CSS checks.
- [x] Update docs/system-design.md, render its HTML, record asset provenance and relevant spec knowledge.

## Results

Implementation agent ran eight related suites: 168 assertions passed, with only the expected pre-registration CSS inventory count failure; the checking agent re-ran the five CSS suites after the actual inventory delta was registered and all146 assertions passed. Full repository lint passed. Existing handbook Playwright suite15/15 passed; all four fresh screenshot viewports report zero horizontal overflow and no page errors, with no locked-slot ornament/name markup. Vite production build and built CSS contracts passed. Three ornament exports were re-encoded in memory and matched their tracked PNG bytes exactly, with verified source dimensions/crop/alpha and total8327 bytes. Current source uses a separate bounded paper owner and no portrait-geometry/input changes.

## Approach and boundaries

Decorative background layers are separate from the original art wrapper so they cannot affect portrait geometry or event state. Reuse scoped theme tokens and the existing neutral seams. Avoid changes to the outer modal, detail layout, selection, roster, catalog or motion formula.

## Research References

- research/assets.md — available source artwork and ornament/paper choices.
- Current audit captures: `.tmp/handbook-strips/1440-1024-rest.png`, `1440-1024-expanded.png`, `390-844-rest.png`.

## Validation

Use the existing production-component handbook fixture on local Vite. Capture desktop 1440x1024 and 1440x768; phone 390x844 and 360x640, all-owned and partial ownership. Existing focused browser suite covers input, anonymous locked states and fixed framing. This task is visual polish; no mirrored unit tests for paint-only rules beyond maintaining existing relevant CSS contracts.

## Open Questions

None: direction and implementation authorization are explicit in the preceding user turns.

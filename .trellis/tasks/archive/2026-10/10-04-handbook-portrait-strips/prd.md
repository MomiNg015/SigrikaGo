# Handbook diagonal portrait strips

## Goal

Replace the normal handbook's irregular ensemble puzzle with a continuous composition inspired by the existing team-match portrait slices. The user finds the puzzle awkward and requests an ordered desktop row and mobile column with expansion to reveal more of each portrait.

## Requirements

- Use the original catalog display order supplied to the handbook, including backend sortOrder. Do not keep the puzzle's custom portrait order and do not reorder by ownership.
- Desktop: ten diagonal slices joined from left to right. Fine-pointer hover expands the current slice's width and smoothly compresses its neighbors. Keyboard focus offers the same preview; activation opens existing details.
- Mobile: slices run from top to bottom, with slanted joins. Touch users tap to expand the current slice's height; the expanded slice offers a clear detail action. Fine-pointer hover on a narrow viewport may also expand height. Expansion should remain reachable inside the existing handbook scroller.
- Resting slices prioritize readable faces; expansion reveals a full-body or coherent bust composition using the supplied art. Preserve aspect ratio and independently tune mobile framing. Avoid body/face stretching and jumping on copy changes.
- Keep small paper seams, no colored outlines, and restrained matte character-color backgrounds. Remove the prior radial highlights and saturated pink hover override. Use width/height expansion rather than the prior lift/rotate transform.
- Retain ownership silhouettes and question marks; unowned Baconbits stays anonymous. Retain custom/costume/candy art priority, effect badges, pagination beyond ten and the isolated corrupted handbook presentation.
- Keep the current full-body detail carrier and its existing copy/voice/music/wardrobe operations. Character selection remains deferred, as previously requested; no account writes or new mode-selection work.

## Acceptance criteria

- [x] The production HouseCharacterGrid uses continuous diagonal slices in catalog order on both viewports.
- [x] Desktop hover/focus increases width and narrow-view expansion increases height; neighboring slices remain clickable and the board has no overflow.
- [x] Touch expansion and explicit details action work without changing the selected account character.
- [x] Actual images are verified at 1440x1024, 1440x768, 390x844 and 360x640, including first/last slice, locked portraits and portrait/detail transitions.
- [x] Reduced motion preserves expansion behavior without animated movement.
- [x] Relevant behavior tests, lint, build and stylesheet contracts pass; docs/system-design.md and frontend contracts describe current behavior.

## Decisions and boundaries

User supplied the composition and expansion direction directly; no additional preference confirmation is needed. Mobile uses tap-to-expand because hover is unavailable on touchscreens. Empty/extra/custom roster cases remain supported. This pass does not redesign other handbook tabs, detail copy or character selection, and does not recolor original character artwork.

## Technical context

Read the existing team portraits in src/styles/room/team-portraits.css and the current HouseCharacterGrid/handbook portrait adapter. Findings are saved in research/strip-layout.md. Current polygon geometry tests must be replaced or retired with the obsolete runtime geometry rather than preserving dead tangram implementation solely for historical assertions.

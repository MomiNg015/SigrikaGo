# Generate Crater Board Icons

## Goal

Generate several transparent-background crater icon candidates for Sigrika erased board points so the user can choose a better visual match for the board.

## What I already know

* The user wants imagegen-generated transparent-background crater icons.
* The existing erased-point visual is CSS on .point.erased, not an existing raster asset.
* Board persistent point-local visuals must remain pointer-transparent and tied to point DOM styling.

## Assumptions (temporary)

* First generated candidates were too standalone-icon-like; revise toward board-surface scorch/crater marks that look embedded in warm wood.
* Use chroma-key generation plus local alpha removal per imagegen transparent workflow.

## Requirements (evolving)

* Produce multiple transparent PNG crater candidates that fit a Go-board intersection and read as shallow damage on the board surface, not a separate badge/item.
* Keep the icon low-profile at small point sizes, with warm brown/amber tones close to the board texture and minimal magical accents.
* Store generated candidates in the workspace for review.

## Acceptance Criteria (evolving)

* [ ] Three crater PNG candidates exist with alpha channels.
* [ ] Candidates have transparent corners and no visible chroma-key fringe.
* [ ] Final paths and prompts are reported to the user.

## Definition of Done

* Assets generated and validated.
* System design docs updated only if a production asset/reference is introduced.
* No unrelated dirty files included.

## Out of Scope

* Replacing the in-game erased-point CSS before the user chooses a preferred candidate.

## Technical Notes

* Existing styles: src/styles/room/board/points-preview.css and latest-touch-void.css.

## Iteration Notes

* User requested a more anime-style crater with fewer details: cleaner silhouette, simpler color blocks, fewer cracks/textures, and better board compatibility.

* User requested true top-down view: near-circular/flat board decal, no perspective ellipse, no side highlights, no raised object volume.

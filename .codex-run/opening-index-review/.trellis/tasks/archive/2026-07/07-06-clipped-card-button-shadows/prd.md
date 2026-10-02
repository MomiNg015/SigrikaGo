# Fix clipped card and button shadows

## Goal

Resolve the visual bug shown in the supplied screenshots where card/button elevation shadows are clipped at container edges. Preserve the existing Bright School visual language and avoid unrelated redesign.

## What I already know

* The screenshots show card/button shadows cut off along vertical edges on a graph-paper Bright School surface.
* The requested scope is to audit and fix all instances of the same visible clipping issue, not just one cropped element.
* Project instructions require frontend issues to cover both mobile and desktop unless specifically scoped otherwise.
* Existing uncommitted work is present before this task and must be preserved.

## Requirements

* Find the rendered card/button surfaces whose shadows are clipped in the supplied screenshots.
* Include the follow-up surfaces reported after the first pass: the rightmost house manual character card, the right side of leaderboard rows, the right side of warehouse rows, the lower edge of the shop left information panel, and the right side of friend-list rows.
* Fix the clipping at the layout/container level when possible, so the existing shadow treatment can render fully.
* Cover mobile and desktop variants of the affected surfaces.
* Keep the current colors, border radius, shadow style, and interaction language unless a local adjustment is necessary to prevent clipping.
* Do not include unrelated existing WIP in this task's edits.

## Acceptance Criteria

* [x] The affected card/button shadows are no longer clipped at container edges.
* [x] The fix applies to all same-class occurrences discovered in the relevant surface.
* [x] Mobile and desktop layouts are checked.
* [x] Targeted tests or contract checks are updated when they already cover the affected CSS/DOM contract.
* [x] System-design docs are updated only if the fix changes an existing documented UI/theme fact.

## Definition of Done

* Relevant Trellis frontend specs are read before editing.
* Targeted verification is run for the changed files.
* `npm run docs:system-design` is run if docs are changed.
* Existing unrelated dirty files remain preserved.

## Out of Scope

* Redesigning the Bright School card/button style.
* Changing the information architecture or component content.
* Cleaning unrelated CSS debt.

## Technical Notes

* Supplied screenshots: `C:/Users/Moming/AppData/Local/Temp/codex-clipboard-82722dfe-687d-4b86-9c11-2e2f9028a61a.png`, `C:/Users/Moming/AppData/Local/Temp/codex-clipboard-9d5596c7-dd2f-4e01-aad0-3f7a6c866c59.png`.
* Memory notes indicate similar SigrikaGo CSS/layout work should be narrow, preserve Bright School visuals, and update CSS contract baselines if verification reports measured drift.
* Verification artifacts: `research/home-shadow-mobile.png`, `research/home-shadow-desktop.png`, `research/home-shadow-visual-check.json`, `research/shadow-surfaces-desktop.png`, `research/shadow-surfaces-mobile.png`, and `research/shadow-surfaces-computed.json`.

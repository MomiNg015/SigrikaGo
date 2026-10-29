# Tutorial continuation and focus refinement

## Goal
Remove the extra outline around tutorial action buttons, retaining the existing dimmed surroundings and bright target as the guide.

## Scope
Remove the pink target ring and suppress outward keyboard focus outlines on tutorial controls; keep cap geometry, press feedback, ordinary game controls and target gating. The header story-history icon also uses no extra focus frame. Existing target-point guide is unchanged.

## Acceptance
- [x] Guided actions, answer choices and header history show no outer focus outline.
- [x] Desktop and portrait target brightness/press feedback remain intact.
- [x] Existing design facts and generated HTML are synchronized; unrelated WIP is preserved.

## Decision
This is a direct visual correction with no blocking requirements questions. Reuse the current tutorial CSS owner; no new tests are needed for the reversible style change. Verify rendered focus states and existing CSS contracts.

## Accepted follow-up
When continuation is required, retain all five keys and replace the counting key with Continue (Play icon); only that key is enabled. Single continue-only script options use this slot too; actual answer choices alone replace the whole area. Preserve manual-wait, preview skip, choice routing, disabled overlays and duplicate-click protection.

- [x] Continue replaces the counting slot, never invokes counting, restores after advancing and ignores duplicate clicks.

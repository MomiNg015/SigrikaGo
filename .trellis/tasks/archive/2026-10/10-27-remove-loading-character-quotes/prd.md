# Remove loading character quotes

## Goal
Remove per-character descriptive loading lines from all shared loading screens. Preserve portraits, motion, progress, tips, and explicit functional labels such as tutorial transition copy. Keep existing admin data for compatibility.

## Acceptance
- [x] Shared loading screens omit character quotes and their empty title row.
- [x] Existing progress, portrait rotation, tips and explicit labels still pass their focused tests.
- [x] Update design documentation, regenerate HTML and preserve unrelated WIP in a scoped commit.

## Scope
Shared AssetPreloadScreen rendering and existing affected assertions only; no loading/network behavior or visual redesign.

# Restore login loading screen

## Goal
Restore the existing random hopping character and progress bar after login, with the current brush-label tips rendered smaller below the bar.

## Requirements
- Reuse AssetPreloadScreen random character selection, current catalog, portrait prewarming, hopping motion and real progress.
- Keep the brush Tip label and reduce tip typography to 14px desktop / 13px portrait mobile.
- Preserve corrupted-player presentation and other loading surfaces.
- Preserve startup readiness behavior; no new loading assets or dependencies.

## Acceptance Criteria
- [x] Login route renders a character and the original progress bar.
- [x] Tips rotate and appear below the bar without duplicated Tip prefixes.
- [x] Desktop and portrait layouts fit, including long tips and reduced motion.
- [x] Relevant tests, lint, build and generated system-design documentation pass.

## Scope and approach
Use a small LoginAssetPreloadScreen adapter and an opt-in brush tip style in the shared loader. Existing character selection and failure handling remain authoritative. No new loading design, auth changes, or unrelated WIP edits. User request settles the layout; no blocking questions.

## Verification
- 30 targeted tests passed across login/shared loader, routes and site-entry preload.
- Full ESLint, production build, built CSS contracts and system-design HTML generation passed. Build retained asset-reference and chunk-size warnings.
- Browser: complete theme at 1440x900, 390x844, 360x640 and 320x568 (long tip); loaded full portraits, hopping animation, below-bar tips, 14px/13px typography and no horizontal overflow. Reduced motion disables hopping.
- Visual evidence: `.codex-run/restore-login-loading/`.
- Existing unrelated worktree changes preserved; no commit created.

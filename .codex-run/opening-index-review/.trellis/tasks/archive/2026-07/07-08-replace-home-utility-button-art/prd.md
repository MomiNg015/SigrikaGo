# Replace Home Utility Button Art

## Goal

Replace the six Bright School home utility button artworks with user-provided PNG drawings converted to WebP, while preserving the existing home utility dock semantics, layout, and interaction behavior on desktop and mobile.

## Requirements

- Convert the six provided PNG assets under `C:/codex/image/main/` to WebP.
- Replace the existing runtime files under `public/assets/home/home-utility-*.webp`.
- Keep PNG source copies beside the WebP runtime assets for the documented source-file contract, preserving each drawing's original proportions.
- Preserve the current `HomeUtilityDock` button semantics: native buttons, `aria-label`s, decorative images, and icon/title fallback nodes.
- Preserve the existing mobile grid layout and touch behavior; desktop may use proportional display scaling plus small per-entry translate/rotate offsets for a casual sticker arrangement.

## Asset Mapping

- `Recruit_btn.png` -> `public/assets/home/home-utility-recruitment.webp`
- `store_btn.png` -> `public/assets/home/home-utility-shop.webp`
- `Storage_btn.png` -> `public/assets/home/home-utility-warehouse.webp`
- `Rankings_btn.png` -> `public/assets/home/home-utility-leaderboard.webp`
- `Spectate_btn.png` -> `public/assets/home/home-utility-watch.webp`
- `Friends_btn.png` -> `public/assets/home/home-utility-friends.webp`

## Acceptance Criteria

- [ ] The six runtime WebP assets exist and are converted from the provided PNG files.
- [ ] The matching PNG source copies are updated in `public/assets/home/`.
- [ ] The button artwork is not non-uniformly stretched or squashed.
- [ ] Desktop utility buttons use non-uniform sticker-like placement without changing button semantics or mobile layout.
- [ ] Existing tests that assert the home utility image paths still pass.
- [ ] System-design documentation reflects that these are user-drawn source assets rather than generated placeholder art.

## Definition of Done

- Focused tests pass for the home utility dock and preload asset path coverage.
- `npm run docs:system-design` is run after documentation updates.
- Unrelated dirty worktree files are left untouched.

## Out of Scope

- Changing utility button order, labels, click handlers, hover/press motion, layout sizing, or the home stage composition.
- Replacing non-utility home assets such as the match entry, handbook entry, or player plaque.

## Technical Notes

- Existing runtime paths are referenced by `src/home/components/HomeUtilityDock.jsx`, `src/shared/assetRegistry.js`, and tests in `src/home/HomeScreen.test.jsx` / `src/shared/preloadAssets.test.js`.
- Bright School image-only utility button contracts are documented in `.trellis/spec/frontend/quality-guidelines.md` and `docs/system-design.md`.

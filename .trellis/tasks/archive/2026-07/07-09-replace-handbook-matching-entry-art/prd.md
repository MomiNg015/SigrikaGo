# Replace Handbook and Matching Entry Art

## Goal

Replace the Bright School home member handbook and matching entry images with the supplied artwork, encoded as WebP and trimmed to the non-transparent alpha bounds so the runtime entry buttons do not carry unused horizontal or vertical empty space.

## Requirements

- Use `C:/codex/image/main/BOOKNEW.png` for the member handbook entry.
- Use `C:/codex/image/main/pipei_new.png` for the matching entry.
- Trim fully transparent outer rows and columns from each source image.
- Replace the existing runtime WebP assets at `public/assets/home/book-entry.webp` and `public/assets/home/fantasy-match-entry.webp`.
- Keep the retained PNG source copies in the same directory aligned with the WebP dimensions.
- Preserve the existing component paths, accessibility semantics, preload registry paths, and desktop/mobile layout CSS contracts.
- Update system-design documentation for the new asset dimensions and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] `book-entry.png` and `book-entry.webp` have dimensions `705x850`.
- [ ] `fantasy-match-entry.png` and `fantasy-match-entry.webp` have dimensions `2374x1960`.
- [ ] Home screen markup continues to reference `/assets/home/book-entry.webp` and `/assets/home/fantasy-match-entry.webp`.
- [ ] Focused home/preload tests pass.
- [ ] `npm run docs:system-design` has been run after documentation edits.

## Definition of Done

- Tests or focused verification cover the changed asset dimensions and WebP validity.
- Documentation reflects the new runtime asset sizes.
- Existing unrelated WIP remains untouched.

## Technical Approach

Use the existing `scripts/pngTrim.mjs` alpha-trim helper for source PNG cropping. Use the locally installed `ffmpeg` encoder for transparent WebP output because ImageMagick/cwebp is not installed in this environment.

## Out of Scope

- Redesigning the home layout, hover motion, preload registry paths, or matching/handbook component behavior.
- Replacing other home utility assets.

## Technical Notes

- Existing consumers are `src/home/components/HomeImageEntries.jsx` and `src/shared/assetRegistry.js`.
- Existing regression coverage lives in `src/home/HomeScreen.test.jsx` and `src/shared/preloadAssets.test.js`.
- The relevant docs entry is `docs/system-design/05-assets-audio-preload.md`, with generated output in `docs/system-design.html`.

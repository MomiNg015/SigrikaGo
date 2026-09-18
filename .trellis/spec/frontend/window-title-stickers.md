# Campus Window Title Stickers

## Visual and font contract

Ordinary Bright School home utility windows use ruled cream paper stickers with a white cut edge, thin brown outline, a small lower-right fold and a visible compact cast shadow. The paper has faint blue rules and a subtle warm tonal wash. The user rejected illustrated flowers, stars, stationery clusters and brush lettering; do not reintroduce these embellishments, subtitles, counts or helper copy.

Logical size tiers are 168x76, 220x80 and 272x84, with mobile scale 0.8. The image extends 52% of its height above the window, 20px left on desktop and 18px on mobile. Backdrop gutters protect the full image and shadow. `--window-sticker-available-height` subtracts 76px plus safe areas and is shared by shell and content owners; avoid repeating incompatible viewport-height budgets in individual windows.

All title lettering uses the actual `public/assets/fonts/LXGWMarkerGothic-Regular.ttf` (霞鹭) font. The runtime fallback uses `--font-window-title`, which maps to that same font. `scripts/generate-window-title-stickers.mjs` renders the simple paper graphic with the local font and exports transparent PNG and lossless WebP at 3x resolution. Do not approximate the font through image generation.

## Ownership

- `src/shared/windowTitleStickers.js` owns fixed titles, dimensions and asset paths. `WindowTitleSticker` keeps one semantic heading and exposes the text fallback until the image loads or when it fails.
- The title image belongs to the non-scrolling `.window-sticker-host`. Its header must not establish an intermediate positioning context. Inner content owns scrolling and control-shadow gutters.
- A header with an exterior title must not retain the old padded text-title row: use an 8px host top inset, a 44px minimum header row and 4px bottom padding. Sticker-window close, refresh and back icon buttons share a compact 36px square; other header buttons share the 36px height while retaining their text width. Mobile information-center action columns also use 36px; absolute close buttons are inset 6px from the top and 16px from the right, preserving visible clearance from the border. The resume sticker heading is absolutely positioned outside document flow with `width: 100%`; its full-shell containing block preserves the original artwork dimensions under the shared percentage max-width guard. Its action row centers inside an 8px shell inset and a 56px minimum header, with 44px achievement, personalization, wallet and square close controls in that order; never restore the former 28px mobile title spacer. The final owner is `mobile-adaptive/window-sticker-resume-header.css`.
- Only `.theme-bright-school:not(.is-sigrika-corrupted)` presents the sticker. Shop descendants, IRIS, dynamic names, narrative and match lifecycle headings are excluded.
- Shared `UserProfileCard` and `HouseReplayDialog` default `titleStickers` to false. Home callers opt in explicitly; room callers retain the original heading markup.
- Nested profile confirmation backdrops must remain fixed to the viewport. The dossier's broad relative-positioning rule for children must not capture them.
- `mobile-adaptive/window-title-stickers.css` owns placement and safe-area sizing; `window-title-sticker-content.css` owns content scroll geometry. Both load before the final corruption owner.

## Validation

Check 320x568, 390x844, 800x600 and desktop: complete title bounds, header controls, native scrolling, pressed shadows, nested overlay coverage, close/return/focus restoration, image failure, room opt-out and special-theme opt-out. Asset tests verify both formats and actual alpha margins. Update the system-design entry and chapters 05/06, then regenerate HTML.

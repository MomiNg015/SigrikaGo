# Campus Window Title Stickers

## Visual and font contract

Ordinary Bright School home utility windows use restrained cream paper labels with a thin brown border and a compact paper shadow. The user rejected the illustrated flowers, stars, stationery clusters and brush lettering. Do not reintroduce these embellishments, subtitles, counts or helper copy.

All title lettering uses the actual `public/assets/fonts/LXGWMarkerGothic-Regular.ttf` (霞鹭) font. The runtime fallback uses `--font-window-title`, which maps to that same font. `scripts/generate-window-title-stickers.mjs` renders the simple paper graphic with the local font and exports transparent PNG and lossless WebP at 3x resolution. Do not approximate the font through image generation.

## Ownership

- `src/shared/windowTitleStickers.js` owns fixed titles, dimensions and asset paths. `WindowTitleSticker` keeps one semantic heading and exposes the text fallback until the image loads or when it fails.
- The title image belongs to the non-scrolling `.window-sticker-host`. Its header must not establish an intermediate positioning context. Inner content owns scrolling and control-shadow gutters.
- Only `.theme-bright-school:not(.is-sigrika-corrupted)` presents the sticker. Shop descendants, IRIS, dynamic names, narrative and match lifecycle headings are excluded.
- Shared `UserProfileCard` and `HouseReplayDialog` default `titleStickers` to false. Home callers opt in explicitly; room callers retain the original heading markup.
- Nested profile confirmation backdrops must remain fixed to the viewport. The dossier's broad relative-positioning rule for children must not capture them.
- `mobile-adaptive/window-title-stickers.css` owns placement and safe-area sizing; `window-title-sticker-content.css` owns content scroll geometry. Both load before the final corruption owner.

## Validation

Check 320x568, 390x844, 800x600 and desktop: complete title bounds, header controls, native scrolling, pressed shadows, nested overlay coverage, close/return/focus restoration, image failure, room opt-out and special-theme opt-out. Asset tests verify both formats and actual alpha margins. Update the system-design entry and chapters 05/06, then regenerate HTML.

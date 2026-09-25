# Campus Window Title Stickers

## Visual and font contract

Ordinary Bright School home utility windows use ruled cream paper stickers with a white cut edge, thin brown outline, a small lower-right fold and a visible compact cast shadow. The paper has faint blue rules and a subtle warm tonal wash. The user rejected illustrated flowers, stars, stationery clusters and brush lettering; do not reintroduce these embellishments, subtitles, counts or helper copy.

Logical size tiers are 168x76, 220x80 and 272x84, with mobile scale 0.8. The image extends 52% of its height above the window, 20px left on desktop and 18px on mobile. Backdrop gutters protect the full image and shadow. `--window-sticker-available-height` subtracts 76px plus safe areas and is shared by shell and content owners; avoid repeating incompatible viewport-height budgets in individual windows.

All title lettering uses the actual `public/assets/fonts/LXGWMarkerGothic-Regular.ttf` (霞鹭) font. The runtime fallback uses `--font-window-title`, which maps to that same font. `scripts/generate-window-title-stickers.mjs` renders the simple paper graphic with the local font and exports transparent PNG and lossless WebP at 3x resolution. Do not approximate the font through image generation.

## Ownership

- `src/shared/windowTitleStickers.js` owns fixed titles, dimensions and asset paths. `WindowTitleSticker` keeps one semantic heading and exposes the text fallback until the image loads or when it fails.
- The title image belongs to the non-scrolling `.window-sticker-host`. Its header must not establish an intermediate positioning context. Inner content owns scrolling and control-shadow gutters.
- The team lineup dialog must itself be `position: relative`; constrain its backdrop track to `minmax(0, 1fr)` and its width to the available track, including sticker gutters. Verify the title stays on-screen and repeated member selection cannot scroll the backdrop horizontally. `tests/e2e/team-match.spec.js` checks 1280px desktop and 390/360px portrait.
- A header with an exterior title must not retain the old padded text-title row: use an 8px host top inset, a 52px minimum header row, 12px bottom padding and 10px margin before the next content row. Sticker-window close, refresh and back icon buttons share a compact 36px square; other header buttons share the 36px height while retaining their text width. Mobile information-center action columns also use 36px; absolute close buttons are inset 6px from the top and 16px from the right, preserving visible clearance from the border. The resume sticker heading is absolutely positioned outside document flow with `width: 100%`; its full-shell containing block preserves the original artwork dimensions under the shared percentage max-width guard. Its action row centers inside an 8px shell inset and a 56px minimum header, with 44px achievement, personalization, wallet and square close controls in that order; never restore the former 28px mobile title spacer. The final owner is `mobile-adaptive/window-sticker-resume-header.css`.
- Only `.theme-bright-school:not(.is-sigrika-corrupted)` presents the sticker. Shop descendants, IRIS, dynamic names, narrative and match lifecycle headings are excluded.
- Shared `UserProfileCard` and `HouseReplayDialog` default `titleStickers` to false. Home callers opt in explicitly; room callers retain the original heading markup.
- Nested profile confirmation backdrops must remain fixed to the viewport. The dossier's broad relative-positioning rule for children must not capture them.
- `mobile-adaptive/window-title-stickers.css` owns placement and safe-area sizing; `window-title-sticker-content.css` owns content scroll geometry. Both load before the final corruption owner.

## Player window bookmark tabs

- Approved hosts: Resume, Settings, Achievements, Leaderboard, Watch, Friends and Announcements. Home social profiles opt in only with `titleStickers`; in-room profiles, room docks and admin controls stay inline. Do not revive unused ShopTabs/Gacha entry points.
- `WindowBookmarkTabs({ children, className, ...props })` preserves existing inline buttons outside an opted-in ordinary Bright School host. Its portal targets the closest dialog only; an unmarked nested dialog must never attach its tabs to an outer marked host.
- Keep button IDs, controls, callbacks, pending guards and selection under the profile owner's control. Use Up/Down and Home/End on the vertical rail; leave legacy inline keyboard handlers unchanged. Observe app theme classes and restore inline placement on corruption/theme changes.
- Bookmark labels hide inline SVG/image icons and decorative unread dots; selection callbacks and unread list data remain intact. Nested label text must explicitly inherit regular weight (400) with font synthesis disabled, because theme span rules can otherwise override the parent weight. Draw only the paper outline; label text uses the actual LXGW font through `--font-window-title`. Keep reduced-motion fallback and visible keyboard focus.
- Keep unread data and existing callbacks; Watch tabs intentionally show only mode names without room counts. Adapt inner grid tracks after portal relocation; keep inner content scrollable and bookmark rails independent. Bound minimum shell height by the safe viewport; labels never wrap: one horizontal line on desktop and one vertical column on phones. Recruitment item selection stays inside its action footer as a labelled button group with pressed state; it is not a tab surface and must not opt into bookmarks. Friends lists align their natural-height rows at the start so sparse lists do not stretch.
- Size bookmark hosts from all tab boxes, row gaps, rail padding/insets and shell borders through `--window-bookmark-required-height`, capped by the safe viewport. Observe tab/rail resizing and font readiness, recompute when children change, and remove the variable on theme opt-out/unmount. Do not measure `scrollHeight` as intrinsic demand: it includes spare rail space and prevents shrinking. Scroll the rail only when the viewport cannot fit all tabs. Browser coverage verifies desktop, tall/short portrait, tab-count changes and resizing back to desktop.
- The backdrop must constrain its grid column with `minmax(0, 1fr)` before resolving the window's percentage max-width. Reserve the full left rail plus its shadow. Scroll the mobile resume body independently from the rail; verify the final record remains reachable at 320x568.
- `WindowBookmarkTabs.dom.test.jsx` covers relocation, callbacks, selection, pending state, keyboard and theme opt-outs. Existing resume/profile tests continue to cover data loading and stale responses.

## Window title validation

Check 320x568, 390x844, 800x600 and desktop: complete title bounds, header controls, native scrolling, pressed shadows, nested overlay coverage, close/return/focus restoration, image failure, room opt-out and special-theme opt-out. Asset tests verify both formats and actual alpha margins. Update the system-design entry and chapters 05/06, then regenerate HTML.

## Empty results

Use `WindowEmptyState` for active player-window empty results, keeping existing copy and using compact mode inside record/decorations or narrow list panes. The shared late CSS owner clears retired frames/pseudo-elements and draws one aria-hidden static paper sketch in normal Bright School. Do not route loading or errors through the empty-result component. Watch hides its table when there are no rooms, and must not display an empty success state after a request error.

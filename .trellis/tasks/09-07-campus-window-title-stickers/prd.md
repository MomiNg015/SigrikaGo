# Campus window title stickers

## Accepted scope
- Implement 23 text-inclusive title stickers for ordinary Bright School home utility windows and their fixed-title subwindows.
- Exclude shop and its descendants, IRIS, dynamic names, body subheadings, confirmation questions, match lifecycle and story surfaces. Shared social profile/replay consumers require explicit home opt-in; room consumers retain their current presentation.
- Latest user correction: the illustrated stickers were too ornate and did not fit the project. Replace them with plain cream paper labels and a thin dark brown border. Remove illustrations and flourishes. All lettering must use the project's actual LXGWMarkerGothic-Regular.ttf (霞鹭), with no simulated handwritten substitute. Keep current wording and avoid additional labels/counters.
- Desktop size tiers 144x64, 192x68 and 240x72; mobile scale 0.8. Art overlaps the top edge by one third and the left edge by 8px, rotated -2deg. Preserve safe-area gutters, all controls, scroll ownership, focus and fallback semantic headings.
- Deliver transparent PNG and WebP in the project. Export the simple code-native paper graphic and exact local font through a reproducible canvas script; verify alpha and exact Chinese wording. First validate handbook, announcement and a long nested picker title in real components, then expand coverage.

## Validation
- Browser checks at 320x568, 390x844, 800x600 and 1440x900: no clipped art or controls, stable scrolling, no transient scrollbars, nested overlays cover parent art.
- Test image failure fallback, accessible heading names, keyboard closing/focus restoration and opt-in exclusions.
- Update system-design entry and relevant chapters, generate HTML and run npm run check.
- Preserve all pre-existing work recorded under ignored .tmp/title-sticker-baseline; commit only this task's changes on codex/campus-home-handbook-polish. No push.

## Verified result
- Replaced the rejected artwork with 23 restrained paper labels, all typeset using the actual local 霞鹭 font. Runtime WebP totals 73,920 bytes; every PNG/WebP has tested transparent margins.
- Browser layout audit: 23 windows at four viewport sizes, plus social profile/challenge entries at all four sizes (100 checks), passed. Real screenshots are under ignored `.tmp/title-stickers-<surface>-<width>.png`.
- Browser interactions passed: native roster scrolling, pressed controls without scrollbar chrome, nested picker Escape/focus restoration, failed-image fallback in the actual title font, room profile/report opt-out and corrupted-theme opt-out.
- Fixed owner conflicts found during QA: profile nested backdrops captured by relative positioning, narrow resume controls overlapping the title, constrained outer shells retaining content inside scroll owners, and theme resets overriding the fallback span's font.
- Related component/asset tests and the full 354-file / 2512-test suite passed. Production build and built-CSS gates passed. HTML generation was retried after transient Windows file access failure; final full check is recorded in session output.
- Design hook warnings about existing literal colors in legacy test expectations are pre-existing test strings; this task adds no CSS color literal or animation family. Other in-progress work remains outside this commit.

# Campus window title stickers

## Accepted scope
- Implement 23 text-inclusive title stickers for ordinary Bright School home utility windows and their fixed-title subwindows.
- Exclude shop and its descendants, IRIS, dynamic names, body subheadings, confirmation questions, match lifecycle and story surfaces. Shared social profile/replay consumers require explicit home opt-in; room consumers retain their current presentation.
- Latest user correction: the illustrated stickers were too ornate and did not fit the project. Replace them with plain cream paper labels and a thin dark brown border. Remove illustrations and flourishes. All lettering must use the project's actual LXGWMarkerGothic-Regular.ttf (霞鹭), with no simulated handwritten substitute. Keep current wording and avoid additional labels/counters.
- Desktop size tiers 168x76, 220x80 and 272x84; mobile scale 0.8. Art overlaps the top edge by 52% and the left edge by 20px (18px on mobile), rotated -2deg. Preserve safe-area gutters, all controls, scroll ownership, focus and fallback semantic headings.
- Deliver transparent PNG and WebP in the project. Export the simple code-native paper graphic and exact local font through a reproducible canvas script; verify alpha and exact Chinese wording. First validate handbook, announcement and a long nested picker title in real components, then expand coverage.

## Validation
- Browser checks at 320x568, 390x844, 800x600 and 1440x900: no clipped art or controls, stable scrolling, no transient scrollbars, nested overlays cover parent art.
- Test image failure fallback, accessible heading names, keyboard closing/focus restoration and opt-in exclusions.
- Update system-design entry and relevant chapters, generate HTML and run npm run check.
- Preserve all pre-existing work recorded under ignored .tmp/title-sticker-baseline; commit only this task's changes on codex/campus-home-handbook-polish. No push.

## Initial verified result
- Replaced the rejected artwork with 23 restrained paper labels, all typeset using the actual local 霞鹭 font. Runtime WebP totals 73,920 bytes; every PNG/WebP has tested transparent margins.
- Browser layout audit: 23 windows at four viewport sizes, plus social profile/challenge entries at all four sizes (100 checks), passed. Real screenshots are under ignored `.tmp/title-stickers-<surface>-<width>.png`.
- Browser interactions passed: native roster scrolling, pressed controls without scrollbar chrome, nested picker Escape/focus restoration, failed-image fallback in the actual title font, room profile/report opt-out and corrupted-theme opt-out.
- Fixed owner conflicts found during QA: profile nested backdrops captured by relative positioning, narrow resume controls overlapping the title, constrained outer shells retaining content inside scroll owners, and theme resets overriding the fallback span's font.
- Related component/asset tests and the full 354-file / 2512-test suite passed. Production build and built-CSS gates passed. HTML generation was retried after transient Windows file access failure; final full check is recorded in session output.
- Design hook warnings about existing literal colors in legacy test expectations are pre-existing test strings; this task adds no CSS color literal or animation family. Other in-progress work remains outside this commit.

## Paper-depth refinement
- The user requested larger stickers, more overhang, a less plain background and clearer shadows. Keep LXGW and the restrained campus direction; add faint blue paper rules, white cut edges, a small lower-right fold, a warm paper wash and a compact cast shadow.
- Increase size tiers to 168x76 / 220x80 / 272x84 and top overhang to 52%; desktop/mobile left offsets become -20px / -18px. Share the safe-area-aware viewport height budget across all title hosts and their existing content owners.
- Extend asset verification to require transparent canvas edges, so the new shadow fades fully before the exported image boundary.
- Follow-up correction: reduce the unused space between the outside title and the dashed divider. The handbook divider/content move up 20px; comparable headers use an 8px shell inset, 44px minimum row and 4px bottom padding, with top-aligned 44px close controls. Preserve the resume action/wallet clearance.
- The updated header geometry passed all 100 browser viewport/window checks. Asset alpha-edge, semantic fallback, nested focus restoration and native scrolling checks pass. The generated HTML design hook flags the pre-existing documentation template palette/Consolas and quoted historical CSS descriptions; these are documentation false positives, not new player UI styles, and no ignore rules were added.

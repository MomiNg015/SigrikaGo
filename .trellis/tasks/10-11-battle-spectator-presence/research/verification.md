# Desktop transparent-info clipping correction

- Root cause: player-info outer bounds were subtracted from the paint mask even though ordinary desktop player columns are transparent. This produced a straight vertical cut through spectators.
- Keep those bounds for placement-center avoidance; remove them only from ordinary desktop painting. Stack portrait-wrap, player-meta and player-clock-panel above spectator art, with a narrowly scoped z-index override for the stronger paper-name rule. Do not stack the parent or trap floating skills. Opaque special-duel and mobile masks remain unchanged.
- Regression verifies paint coverage through a transparent column edge, foreground child layers, unstacked parent, opaque special-duel masking and functional inputs. Screenshots: transparent-info-desktop.png and transparent-info-detail.png. Source-image edges at the viewport can still be naturally occluded as requested.
- 8 component/layout tests pass. Existing 8 browser scenarios pass; the added desktop regression and original desktop scenario both pass in the final targeted run. Lint/build pass. Existing CSS debt remains 889 bytes plus the unrelated 360px breakpoint failure. This owner adds exactly 392 normalized bytes and one targeted important declaration.

---

# Same-screen correction — clean controls and exposed faces

- User explicitly rejected extending the page and scrolling to see spectators. No spectator spacer, extra page height or separate scroller was added; fixed 80% artwork and compact 8px info/dock gap remain.
- The paint/hit mask now excludes complete action-bar and mobile dock rectangles, including their padding, frame and button gaps. Placement favors exposed faces and avoids control cuts through the upper body.
- Bottom-edge paper tags clamp inward below their character center, render above overlapping artwork and open their own user. Seeded placement excludes tags from other viewers center hit points; both entry types suppress clicks after a scroll/drag. Full source art uses contain without an internal crop or fade; UI/window edge occlusion remains intentional.
- 76 related tests and 8 browser tests pass (same-screen-related.log, same-screen-browser.log): 320/360/390px, 0/1/6/20 viewers, exact fixed dimensions, viewport-bounded tags, full-dock input mask, every center correctly addressed, social actions, stable snapshots and gestures. Lint, production build and built-CSS pass; system-design HTML regenerated.
- Screenshots: same-screen-mobile-390-6.png, same-screen-mobile-320-20.png, same-screen-desktop-1440.png under .codex-run/battle-presence. Captured from actual components/theme with fixed fixture data, not a live multiplayer session. Crowded 20-person views intentionally overlap; tests establish presence/input, not full-body visibility or subjective appearance.
- CSS budget contains only this owner cumulative delta versus revision-4-before: +227 normalized bytes, +15 targeted important declarations, -1 hex color. Style contracts: 113 pass / 2 pre-existing failures (889-byte CSS debt and the unrelated match-mode-title-layout 360px breakpoint). Neither baseline debt nor unrelated breakpoint was suppressed. Changes remain uncommitted.

---

# Revision 4 — full artwork, paper tags, compact dock

Latest explicit user correction supersedes revision 3's cropped/faded art, variable crowd size, plain names and half-dock spacer.

- Full image source rendered with contain, no per-portrait mask, clipping or fade. Fixed 80% frames: mobile 144x160, desktop 192x232, independent of crowd count. Existing UI/window occlusion remains.
- Username tags reproduce battle-character-label's paper/background/border/hard-shadow/title-font/tilt treatment and attach beneath each full portrait.
- Removed the spectator spacer DOM row; the mobile self-info/dock gap is 8px. Four normal content rows; no space added for observers.
- 76 related tests passed (full-art-related.log). 8 browser tests passed (full-art-browser-final.log), covering 320/360/390px with 0/1/6/20 viewers, exact image dimensions, no internal mask, paper tag styles and attachment, compact gap, clickable centers, social interactions, stable positions, reduced motion and short-phone scrolling.
- Lint, production build, built-CSS contracts and system-design HTML generation passed. Existing broad-gate failures were not changed or suppressed; changes remain uncommitted. CSS budget adjusted only by the local LF-normalized -296 bytes and -1 hex color.
- Final screenshots: full-art-mobile-390-6.png, full-art-mobile-320-20.png and full-art-desktop-1440.png in .codex-run/battle-presence. Isolated real component/theme fixture, not live multiplayer server verification.

---

# Revision 3 — composition and name readability

- Replaced center-only sampling with visible-area/upper-body checks, non-overlapping name slots, adaptive scale and local crowd scoring. Narrow edge slivers are no longer placement candidates. Full-window free-space paint clipping remains intact (filtering its tiny fragments would introduce artificial horizontal holes).
- Added a soft 8px lower-art fade where the name must fit before a viewport/UI boundary. Names stay centered on their own character. Long labels truncate; profiles and accessible triggers retain complete names.
- Fixed actual image geometry: intrinsic grid tracks plus the stronger Bright School image height rule previously let the image exceed the calculated figure. Images now have definite absolute dimensions.
- Layout results are memoized by roster information and measured geometry. A smaller-size search runs only when a crowded arrival cannot otherwise be placed; existing viewers remain stable. Completely occupied short viewports show characters after natural room scrolling exposes usable space.
- Final related tests: **76 / 76 passed** (8 files, polish-related-final.log). Final browser matrix: **8 / 8 passed** (polish-browser-final.log), including actual image size, name non-overlap, 320/360/390px with 0/1/6/20 viewers, direct profiles, social actions, and short-screen gestures.
- Lint, production build, built CSS and generated system-design HTML passed. Final style contracts: 75 passed / 2 known pre-existing failures (CSS byte debt and unrelated 360px breakpoint). Only this owner's LF-normalized +347 bytes were added to the budget; the existing 889-byte debt remains. The broader repository gate is not green; no commit/archive was made.
- Screenshots: polished-mobile-390-6.png, polished-mobile-320-20.png, polished-mobile-390-20.png and polished-desktop-1440.png in .codex-run/battle-presence. These are real component/theme fixtures with fixed data, not live multiplayer evidence.

---

# Revision 2 — free window scattering

The user rejected the initial orderly gallery and specified center anchors anywhere in free window space, random -30 to +30 degree rotation, larger art, plain text names with no card chrome, partial occlusion by functional UI, and approximately half-dock spacing on phones. This revision supersedes the original gallery layout below.

- Related logic/component tests: **75 / 75 passed** (8 files); includes the new window subtraction, seeded placement, stable centers and disjoint hit-region tests.
- Browser: **8 / 8 passed** in `scatter-browser-final.log`. 320/360/390px each covers 0/1/6/20 viewers. Actual figure-box centers match anchors, every anchor hits its own profile, functional surfaces stay unobstructed, text has no background/border/shadow, the 38px gap matches the 76px action area, and short screens scroll from the portrait layer.
- Lint and production build passed (`scatter-lint.log`, `scatter-build.log`). The pre-existing broad-gate failures recorded below are unchanged and are not suppressed.
- Screenshots: `scatter-mobile-320-6.png`, `scatter-mobile-360-6.png`, `scatter-mobile-390-6.png`, the corresponding `-20.png` crowds, and `scatter-desktop-1440.png` under `.codex-run/battle-presence/`. Component fixtures remain isolated; no live multiplayer backend is claimed.

---

## Historical first implementation verification (layout superseded)

# Implementation verification — 2026-10-11

## Scope

Member list removed from live battle composition. Player name cards and spectator figures open direct profiles. Optional profile callbacks preserve friend/blacklist addition and removal with confirmation/restrictions. The mobile area reserves 128px between information and actions and scrolls internally. Desktop figures stay below the player information in the side columns. Existing spectator projection and admission are unchanged.

## Passed

- `npm test -- src/room/spectatorPresence.test.js src/room/SpectatorGallery.dom.test.jsx src/room/useRoomProfiles.dom.test.jsx src/room/RoomScreen.test.js src/room/PlayerInfo.test.js src/room/PlayerInfo.dom.test.jsx src/room/layout/useMobileDockBaseline.test.jsx src/modals/UserProfileCard.dom.test.jsx src/styles/styleContract.test.js`: **152 / 152**.
- `npx playwright test --config tests/e2e/spectator-presence.config.js`: **7 / 7**. Each 320/360/390px case covers 0/1/6/20 users and reaches all twenty buttons through inner scrolling. Also checks non-overlapping names, fixed controls, stable snapshots/arrivals, reduced motion, direct profiles, four social mutations, self restrictions, special system records, outfit fallback and desktop board separation.
- `npm run lint`, `npm run build`, `npm run check:built-css`, `npm run check:portraits`, `npm run check:admin-snapshot`, production configuration validation and `npm run docs:system-design`: passed. Build retains its existing large-chunk advisory.

## Broader gate and baseline proof

`npm run check` was executed. Its full test pass recorded 3238 passing / 5 failing tests before the final CSS import contract update. The own import assertion was corrected and passes in the final targeted suite. Four remaining failures were rerun against both the final workspace and an isolated copy restored from the pre-implementation snapshots; the same four fail in both:

1. CSS budget: pre-change bytes 1664847 vs budget 1663958, already 889 bytes over. The task adds exactly 4611 bytes and budgets exactly that delta, preserving the existing 889-byte discrepancy.
2. Unregistered `(max-width: 360px)` in `mobile-adaptive/match-mode-title-layout.css`.
3. Warehouse candy-result assertion expects the retired portrait path instead of the current avatar.
4. Character detail candy-art assertion expects the previous figure class.

No unrelated failures were suppressed or silently rebudgeted. The full repository gate is **not green**. No code commit or task archive was made; implementation and evidence remain in the working tree alongside the pre-existing WIP.

## Visual evidence and limitations

Actual rendered components and project artwork, with isolated fixed data and intercepted social API responses; **not real-server multiplayer end-to-end evidence**. Portrait/mobile screenshots were opened and visually inspected. Dedicated fixture Vite proxying is disabled.

- `.codex-run/battle-presence/mobile-390-6.png`: mobile six-viewer first screen.
- `.codex-run/battle-presence/mobile-320-6.png`, `mobile-360-6.png`: narrower phones.
- `.codex-run/battle-presence/mobile-390-20-scrolled.png`: final viewers reached inside the fixed area.
- `.codex-run/battle-presence/mobile-390-0.png`: identical empty reserved area.
- `.codex-run/battle-presence/mobile-profile.png`: direct user details.
- `.codex-run/battle-presence/mobile-special.png`: special duel with system record entry.
- `.codex-run/battle-presence/desktop-1440.png`: desktop side-column presence.

Logs: `related-final.log`, `browser-final.log`, `full-check.log`, `baseline-tests.log`, `remaining-gate-failures.log`, `build.log`, `built-css.log` under `.codex-run/battle-presence/`.

## Interruption diagnosis

The session trace had no new tool execution from approximately 13:53:53 to 15:42:59 CST, about 109 minutes. Local Responses retry logs also recorded five `request timed out` retries after the complaint. This supports a stalled request/stream rather than two hours of continuous implementation. The available logs do not distinguish a client issue from local networking or service-side trouble, and do not establish the cause of the user's failed supplementary message submission.

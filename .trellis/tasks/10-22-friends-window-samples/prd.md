# Friends window review and three visual samples

## Goal
Review the current friends window and provide three distinct, interactive visual directions using the existing Bright School identity.

## Approved follow-up: production integration
The user selected direction 3 on 2026-10-22, explicitly retaining the existing left-side Friends/Blacklist bookmark tabs. This supersedes the initial sample-only boundary below. Integrate the companion roster and detail panel into FriendsModal; retain real API/socket actions, global username lookup, title sticker, shared UserIdentity and appearance resolution. Desktop uses a split pane; portrait mobile uses a scrollable roster above a compact action panel. Tabs and shell exterior gutters remain owned by existing bookmark components. Verify selection, empty/mutated lists, unavailable duel actions, nested focus restoration, theme fallbacks and narrow phone layout. Update design/spec docs and perform a scoped commit excluding pre-existing WIP.

The user further requested substantial hard shadows and hover/press feedback consistent with the main game UI. Friend rows use opaque paper, ink borders and short hard shadows; fine-pointer hover lifts slightly and press sinks while shortening the shadow. The companion panel retains static paper depth. Disabled actions never lift, reduced motion removes transitions, and scroll padding must contain the full shadow at both ends.

## Production acceptance
- [x] Production companion view preserves the existing left-side bookmark rail and real social actions.
- [x] Per-tab selection, disappearance fallback, pending mutation guards and focus restoration have DOM regressions.
- [x] Shared identity/nameplate and equipped portrait resolution are preserved in both panes.
- [x] Six desktop/portrait dimensions plus hover/press/reduced-motion browser tests pass (7 tests).
- [x] System design and frontend contracts describe the approved behavior; CSS expansion is measured and registered.
- [x] Run repository checks and record limits: lint, portrait checks, build, built CSS and deployment configuration passed; 7 browser regressions passed. Full tests initially had 3 failures (3308 passed); regenerated docs passed their 4-test rerun and all 4 proxy integration tests passed with a 15-second timeout. Admin snapshot remains stale in siteSettings/characters; no unrelated data was exported.
- [ ] Stage and commit only this task without absorbing existing WIP.

## Requirements
- Keep production source unchanged. Add an isolated design sample under docs/design-samples/friends-window-2026-10-22.
- Use actual bundled title art, LXGW font and character portraits, with explicitly labelled fictional sample users.
- Compare clean roster, club cards, and roster/companion split layouts, retaining friends/blacklist, username search, profile, duel and removal flows as local demonstrations.
- Preserve search semantics: lookup a username, not filtering the current friends list.
- Include desktop and portrait mobile preview and a current-component baseline.
- Keep dangerous actions secondary and require local confirmation.
- Update system-design entry and regenerate HTML, preserving existing unrelated changes.

## Assumptions and decisions
User requested samples, so design selection happens after concrete previews are delivered. No production integration, backend calls, additional social features or generated art are needed. Existing brand and UI conventions answer the styling questions.

## Acceptance criteria
- [x] All three directions render with real assets at desktop, 390px, 360px and 320px portrait widths.
- [x] Tabs, lookup, menus, local profile/duel/confirmation dialogs, empty states and reset work.
- [x] No browser console errors, clipped primary controls or horizontal overflow.
- [x] Screenshots and concise review document are retained.
- [x] Scoped lint and documentation generation pass.

## Delivery and validation
The comparison page and 16 viewport screenshots are in docs/design-samples/friends-window-2026-10-22. verify.mjs passed 19 viewport/interaction groups plus gallery checks, with no browser errors, broken assets or API requests. Scoped ESLint passed using the repository rule configuration without changing eslint.config.js. System design HTML was regenerated. No new production contract was introduced, so no spec change is required. Files remain uncommitted; production integration is outside this request.

## Scope and technical notes
Read FriendsModal, FriendsList, FriendsToolbar, friends base/mobile CSS, production window-surfaces fixture, PRODUCT.md and DESIGN.md. Current mobile uses status/avatar/name/gear in one row with 32px avatar. Search opens a profile through a global username endpoint. User identity can include achievement nameplates. Review must not imply that the existing empty-state screenshot is a populated-list capture.

## Future and edge cases
Preserve nameplate space and long names; show online, playing and offline states; disabled duel actions explain availability. All prototype changes stay in memory and can be reset. The production variant remains a read-only rendering with sample data.

## Out of scope
Production integration, network requests, server changes, real friend mutations, commit and unrelated WIP.

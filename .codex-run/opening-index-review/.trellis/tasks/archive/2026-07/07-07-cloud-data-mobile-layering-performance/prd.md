# Cloud Deployment Data Sync, Mobile Layering, and Motion Performance

## Goal

Fix three production-facing regressions reported after deploying SigrikaGo to a cloud server: non-user admin-managed data should deploy with the same defaults as the local project, mobile floating controls should always appear above the panel that opened before them, and hover/motion effects should remain visually unchanged while running smoothly in production.

## What I Already Know

* User reports that after cloud deployment, admin data outside the user section reverts to defaults, forcing repeated manual re-entry.
* User expects local project non-user admin data to be the deployment source of truth; user data must remain excluded.
* User reports mobile home menu panel is hidden behind the home main background panel.
* User reports mobile battle room utility menu and chat history popover are hidden behind other panels.
* User remembers a previous contract: the most recently opened floating surface should be on top.
* User requires performance fixes without changing the visible motion effect.
* User confirmed scope option 1: include every non-user admin configuration/content that is safe to use as project deployment defaults, including the System Settings tab.
* Existing deployment snapshot workflow exists: `npm run admin:snapshot` writes `server/adminDefaultSnapshot.js`.
* `server/serverStartup.js` runs `seedAdminDefaultConfig` before built-in character/shop/default site-setting seeds.
* `scripts/export-admin-default-snapshot.mjs` currently exports `siteSettings`, `characters`, `decorations`, `shopItems`, `gachaPools`, `achievementRewardAssets`, `achievements`, and `musicTrackSettings`.
* Local DB count check shows those exported categories currently match snapshot counts.
* Local DB also contains admin-managed tables not currently included in the snapshot: `StoryScript` count 3, `AnnouncementEntry` count 2, `OnboardingStoryScript` count 1, and `MailboxBatch` count 2.
* Existing CSS has focused mobile menu and chat surfaces: `home-mobile-menu`, `room-mobile-menu`, `room-mobile-menu-panel`, `chat-widget`, and `chat-popover`.
* Existing room tests already assert mobile menu/chat CSS hooks, so this task should strengthen the contract rather than only patch a visual symptom.

## Assumptions

* "Other admin data" means all admin-created or admin-edited non-user configuration/content that is safe to ship as project defaults, not audit logs, reports, game records, feedback, live rooms, user inventories, mailbox send history, or other user/live state.
* Deployment should seed missing cloud rows from a committed local snapshot without overwriting cloud rows that already exist.
* The mobile layering regression is likely caused by stacking context boundaries (`transform`, `filter`, `overflow`, or low local `z-index`) rather than a single missing high number.
* Production hover jank may come from expensive paint effects, filters, oversized shadows, non-promoted layers, or main-thread work while animations run.

## Requirements

* Data sync:
  * Expand the durable admin default snapshot to cover all safe non-user admin-managed content needed after deployment.
  * Include System Settings (`SiteSetting`) in the snapshot and seed path.
  * Include safe content/admin configuration currently missing from the snapshot, at minimum `StoryScript`, `AnnouncementEntry`, `OnboardingStoryScript`, and mailbox template/batch configuration if the repo model proves it is not user delivery history.
  * Keep users and live/user-generated state excluded from the snapshot.
  * Preserve existing cloud rows during startup seeding; only create missing deployment defaults unless a specific overwrite policy is explicitly chosen.
  * Provide tests that prove exported categories are seeded and excluded categories are not included.
* Mobile layering:
  * Home mobile folded menu panel must render above the home main background panel.
  * Room mobile folded utility menu panel must render above room panels.
  * Room chat popover/history window must render above room panels.
  * The layer model must encode the "later opened floating surface appears above earlier/base panels" contract.
  * Fixes must cover mobile and desktop surfaces where the same contract exists, unless a surface is truly mobile-only.
* Performance:
  * Preserve existing visual motion semantics and timing.
  * Optimize animation rendering so hover effects use compositor-friendly properties where possible.
  * Avoid layout-thrashing and avoid adding JS-driven animation unless necessary.
  * Verify on production build or equivalent browser profiling path, not only unit tests.
* Documentation:
  * Because this touches deployment behavior, data model seeding, UI layering, and performance contracts, update `docs/system-design.md` or the relevant `docs/system-design/` chapters and regenerate `docs/system-design.html` with `npm run docs:system-design`.

## Acceptance Criteria

* [ ] A fresh cloud-like database seeded from the committed snapshot contains the local non-user admin-managed defaults, excluding users.
* [ ] Snapshot export includes safe admin content currently missing from `ADMIN_DEFAULT_CONFIG`, or the PRD explicitly records why a category is excluded.
* [ ] Startup seeding creates missing snapshot rows without overwriting existing admin-edited cloud rows.
* [ ] Focused tests cover snapshot export and seed behavior for every newly included category.
* [ ] On mobile home, opening the folded menu makes every menu action visually and interactively above the home main panel.
* [ ] On mobile room, opening the folded utility menu and chat popover makes those surfaces visually and interactively above board/action/chat panels according to the active-open contract.
* [ ] Tests guard the relevant z-index/stacking contract and any CSS import-order assumptions.
* [ ] Hover and open/close motion keeps the same visible design while avoiding expensive repaint sources where feasible.
* [ ] `npm run check` passes, including docs generation.

## Out of Scope

* Migrating or copying existing production user accounts, user inventory, game history, reports, feedback, audit logs, persisted rooms, or mailbox delivery history.
* Redesigning the mobile home or room UI.
* Changing animation style, duration, or visible feedback unless a specific effect is proven impossible to keep smooth.

## Technical Notes

* Branch: `codex/comprehensive-issues`.
* Task directory: `.trellis/tasks/07-07-cloud-data-mobile-layering-performance`.
* Relevant data files inspected:
  * `scripts/export-admin-default-snapshot.mjs`
  * `server/adminDefaultSeed.js`
  * `server/adminDefaultSeed.test.js`
  * `server/adminDefaultSnapshot.js`
  * `server/serverStartup.js`
  * `prisma/schema.prisma`
* Relevant UI files inspected:
  * `src/home/components/HomeHeader.jsx`
  * `src/styles/themes/bright-school/mobile/home-shell/top-strip-menu.css`
  * `src/room/header/RoomHeader.jsx`
  * `src/room/ChatBox.jsx`
  * `src/styles/themes/bright-school/mobile/room/shell-header-menu/menu-buttons.css`
  * `src/styles/themes/bright-school/mobile/room/shell-header-menu/menu-panel.css`
  * `src/styles/themes/bright-school/mobile/final-fixes.css`
  * `src/styles/themes/bright-school/component-repairs/chat.css`
  * `src/home/HomeScreen.test.jsx`
  * `src/room/RoomScreen.test.js`
* Prior memory indicates earlier admin snapshot work existed and was later rolled back in another context; current code now contains `admin:snapshot` and `adminDefaultSeed`, so this task should verify current state instead of assuming the old rollback state still applies.
* Prior memory for admin settings bugs says to trace the full persistence/consumer path and verify after reload/deploy-like startup.

## Open Questions

* None currently blocking; remaining category boundaries should be derived from schema/code inspection before implementation.

## Decision (ADR-lite)

**Context**: Cloud deployment currently relies on committed admin defaults for some non-user tables, but local admin-managed content can still be absent from the snapshot and then fall back to built-in defaults on a fresh server database.

**Decision**: Treat local non-user admin-managed configuration/content as the deployment source of truth. Expand the snapshot/export/seed flow to include all safe project-default admin content, including System Settings, while continuing to exclude users, audit logs, reports, feedback, game records, persisted rooms, user inventories, mailbox delivery history, and other live/user-generated state.

**Consequences**: The implementation must classify each admin table intentionally, add tests for newly included and excluded categories, and regenerate the committed snapshot from local DB. This is broader than a one-table fix, but it directly addresses the repeated cloud reset problem instead of requiring manual re-entry after deployment.

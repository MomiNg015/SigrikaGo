# Mailbox System

## Goal

Add an in-game mailbox so players can receive one-way administrator messages and administrator-granted items. The player entry should live in the top-right home action area as an icon button, and the admin console should gain a mailbox management surface for sending mail to a specific user or all users.

## Confirmation

User approved the MVP requirements and proposed frontend approach on 2026-06-22.

## What I Already Know

* Player-facing mailbox is receive-only: users can receive text messages or items from administrators.
* Home entry belongs in the existing top-right icon button area; mobile home currently folds top actions into a menu.
* Admin console already uses tab-based navigation and `adminApi("/...")` routes.
* Backend uses Express route modules, Prisma with SQLite, and admin-only routes under `/api/admin`.
* User assets currently exist in both legacy string fields and structured rows; item quantities are exposed through `publicUser(user).ownedItems`.
* Existing inventory grants should preserve `syncStructuredUserAssets` consistency.
* Admin changes that affect user state usually write `AdminAuditLog`.
* Project instructions require `docs/system-design.md` updates and `npm run docs:system-design` for architecture, runtime behavior, API, data model, asset, theme, deploy, or technical-debt changes.

## Assumptions To Validate

* A mail can contain text only, item only, or both text and item.
* Item mail should not grant the item until the user explicitly claims it. Confirmed: use manual claiming.
* A user's visible mailbox capacity of 20 means the server must enforce a maximum of 20 retained mail rows per user.
* Confirmed capacity behavior: when a new mail would exceed 20 rows for a recipient, the server should first auto-delete the oldest safe-to-delete mail. Safe-to-delete means already read and with no pending claimable attachment. If no safe mail exists, delivery to that recipient fails or is skipped.
* Global mail should create per-recipient mailbox rows so each user has independent read/claim/delete state. Updated decision: admin can choose whether a global mail is sent only to current users or also applies to future users.

## Open Questions


## Requirements (Evolving)

* Add a home top-right mailbox icon button on desktop.
* Add a mobile-accessible mailbox entry alongside existing top actions.
* Add a player mailbox modal/list with received mail.
* Add admin mailbox UI for composing and sending mail to one user or all users.
* Admin global send flow includes a choice: send to existing users only, or mark the global mail as eligible for future users.
* Future-user global mail requires a reusable global mail definition/template plus registration-time or first-mailbox-open delivery logic.
* Each global recipient gets an independent mailbox row with its own read, claim, and deletion state.
* The home mailbox icon shows a count badge for unread or pending-claim mail.
* Mailbox badge state refreshes by polling and on mailbox open; MVP does not require WebSocket real-time push.
* Users can read mail, claim attachments, and delete mail.
* Users cannot delete mail that still has an unclaimed attachment.
* Admin targeted send uses a username search/selector rather than manual user ID entry.
* The recipient selector should show enough context to reduce mis-sends, such as username and account status.
* Mail content uses required title and body fields, with at most one optional attachment.
* Mail list/detail must show sent time. MVP does not require expiration time or claim time display.
* Admin mailbox page shows recent send history with delivery result summary.
* Send history includes sender/admin, sent time, target type, attachment summary, delivered count, skipped count, and future-user eligibility when applicable.
* Enforce at most 20 mail entries per user.
* When delivering to a full mailbox, auto-delete the oldest read mail whose attachment is absent or already claimed before inserting the new mail.
* Do not auto-delete unread mail or mail with an unclaimed attachment.
* If a full mailbox has no safe deletion candidate, reject or skip delivery for that recipient and surface the result to the admin sender.
* Item attachments are manually claimed by the user from the mailbox; sending a mail does not immediately mutate user assets.
* Claiming an item attachment must be idempotent: already-claimed mail cannot grant the same attachment again.
* MVP attachment types are inventory item quantities and coins.
* Coin attachments are manually claimed and must write `UserProgressLedger` entries using a mailbox-specific reason/ref so admin-granted currency remains traceable.
* Item attachments are manually claimed into `ownedItems` and synchronized to structured `UserItem` rows.
* Support administrator-authenticated backend APIs for sending mail.
* Support player-authenticated backend APIs for listing, reading, and handling received mail.
* Preserve admin auditability for mail sends.

## Acceptance Criteria (Evolving)

* [ ] A logged-in player can open mailbox from the home top-right action area on desktop.
* [ ] A logged-in player can open mailbox from the mobile home action/menu flow.
* [ ] A player can see up to 20 received mails with text and attachment status.
* [ ] Delivery to a full mailbox auto-cleans the oldest read/settled mail when possible.
* [ ] Delivery never auto-deletes unread mail or unclaimed attachment mail.
* [ ] Delivery reports recipients skipped because their mailbox is full and has no safe cleanup candidate.
* [ ] An admin can send a text mail to one selected user.
* [ ] An admin can send a text mail to all existing users.
* [ ] Admins can choose whether a global mail applies to future users.
* [ ] New users receive only global mails that were explicitly marked as future-user eligible.
* [ ] The home mailbox icon shows a badge when unread or claimable mail exists.
* [ ] Badge data refreshes on mailbox open and through periodic polling without requiring WebSocket push.
* [ ] Users can mark mail read by opening/viewing it.
* [ ] Users can delete read mail that has no pending attachment.
* [ ] Users cannot delete mail while it has an unclaimed attachment.
* [ ] Admins can search users by username and select a recipient for targeted mail.
* [ ] Targeted mail submission sends to the selected user's stable `userId`.
* [ ] Admin send form validates title and body.
* [ ] A mail can include at most one attachment: item quantity or coins.
* [ ] Player mailbox displays mail time in list and/or detail view.
* [ ] MVP does not expire mail or attachments by time.
* [ ] Admin mailbox page shows recent send history.
* [ ] Send history records delivery success and skipped-recipient counts.
* [ ] An admin can include supported item attachments when sending mail.
* [ ] An admin can attach either item quantities or coins in MVP.
* [ ] Item attachments are granted only when the recipient explicitly claims them.
* [ ] Re-claiming an already claimed attachment does not duplicate the reward.
* [ ] Coin claims update the user's coin balance and write a progress ledger row.
* [ ] Mail APIs reject non-admin send attempts.
* [ ] Mail sends are audited.
* [ ] User asset updates remain consistent with structured user asset rows.
* [ ] System design docs are updated and rendered.

## Definition Of Done

* Tests added or updated for backend mail behavior and frontend mailbox/admin flows where appropriate.
* `npm test`, `npm run build`, and `npm run docs:system-design` pass.
* `docs/system-design.md` and/or relevant `docs/system-design/` chapters reflect the new data model, API behavior, admin workflow, and UI entry points.

## Technical Notes

* Likely frontend files: `src/home/components/HomeHeader.jsx`, `src/app/useOverlayState.js`, `src/app/App.jsx`, `src/app/AppRoutes.jsx`, `src/app/AppOverlays.jsx`, new `src/modals/MailboxModal.jsx`, admin tab wiring in `src/admin/AdminShell.jsx` and `src/admin/AdminConsole.jsx`.
* Likely backend files: new `server/mailbox.js`, new route wiring in `server/index.js`, admin routes in `server/adminRoutes.js` or a dedicated admin mailbox module, Prisma schema and migration/push artifacts.
* Existing item grant patterns are in `server/shop.js`, `server/items.js`, `server/recruitment.js`, and `server/userAssets.js`.
* Existing admin audit helper is `server/adminAudit.js`.

## Proposed Frontend Approach

* Add `mailbox` to the central overlay state so the mailbox behaves like existing home modals such as shop, warehouse, friends, recruitment, settings, and message board.
* Add a desktop mailbox icon button to the existing `HomeHeader` top-right action group, using a Lucide mail-style icon and a count badge for unread or claimable mail.
* Add the same mailbox action to the mobile `HomeHeader` menu so mobile and desktop have equivalent access.
* Add a small mailbox summary state in `App`: fetch `/api/mailbox/summary` after login, on home refresh, on mailbox open, and on a periodic interval similar to recruitment badge polling.
* Create `MailboxModal` under `src/modals/`:
  * left/list area: newest mails first, title, sent time, unread marker, attachment marker, claimed state.
  * detail area: title, body, sent time, attachment summary, claim/delete actions.
  * empty, loading, and error states.
  * deletion disabled for mail with unclaimed attachment.
  * claim button disabled while claiming and after claimed.
* Use existing toast patterns for claim/delete success or error, and call `updateUser` after successful claim so coins/items refresh without a full reload.
* Add an admin `mailbox` tab in `AdminShell` and `AdminConsole`.
* Create `AdminMailbox` under `src/admin/`:
  * compose panel with target mode segmented control: selected user, all current users, all current plus future users.
  * username search/selector for selected-user mode.
  * title/body fields, attachment type selector, item selector or coin amount input.
  * submit loading state and delivery result summary.
  * recent send history table with sent time, admin, target type, attachment summary, delivered/skipped counts, and future-user eligibility.
* Keep styles split by existing conventions: admin-specific layout in `src/styles/admin/` and mailbox modal styles under the modal/commerce style layers as appropriate, with desktop and mobile rules both covered.

## Out Of Scope (Temporary)

* User-to-user mail.
* Replies or conversation threads.
* Rich text, images, or file attachments.
* Push notifications outside the running web app.

# Announcement And Changelog Feature

## Goal

Add an in-game announcement center that lets players read game announcements and update logs from the lobby, while letting administrators create, edit, and remove both content types from the admin console.

## What I Already Know

* The player entry should be a button in the top-right toolbar area.
* On desktop this maps to `src/home/components/HomeHeader.jsx` under `.topbar-actions`.
* On mobile the same top-right tools collapse into `HomeHeader`'s mobile menu, so the announcement entry needs mobile parity there too.
* Clicking the player entry should open an announcement window with a minimum height.
* The announcement window needs two tabs: `公告` and `更新日志`.
* The `公告` tab should feel like a news list: each row has title and time, and clicking a row opens that announcement's full content.
* The `更新日志` tab should also use a list/detail pattern like announcements, rather than a single long text box.
* Both announcements and changelog content must be editable from backend admin UI, including create, edit, and delete.
* Announcement and changelog bodies should support a constrained Markdown-lite format rather than arbitrary HTML or rich text.
* The project should not expose an unauthenticated visitor mode for this feature.
* The app already has a top-level overlay registry in `src/app/overlayRegistry.js`, centralized modal rendering in `src/app/AppOverlays.jsx`, and overlay state via `src/app/useOverlayState.js`.
* The app already has admin routing and tab patterns through `src/admin/AdminConsole.jsx`, `src/admin/AdminShell.jsx`, `server/adminRoutes.js`, and `src/api/client.js`.
* Existing admin CRUD-style behavior generally uses `adminApi`, focused admin tab components, Prisma models, server-side validation, and `AdminAuditLog` entries for admin changes.
* Public/authenticated player APIs are mounted from `server/index.js`; public site settings are already exposed under `/api/site-settings`, while many player content APIs require auth.
* This feature changes app behavior, admin surfaces, API/data model, and documentation, so implementation must update `docs/system-design.md` or the relevant `docs/system-design/` article and run `npm run docs:system-design`.

## Assumptions (Temporary)

* The player announcement window should be available to logged-in players from the home lobby only.
* The announcement list and changelog can initially be server-backed with newest-first ordering and no realtime push.
* Admin deletion should be modeled as soft-delete/unpublish instead of hard deletion, to preserve auditability and avoid accidental public content loss.
* Player unread/new indicators require per-user read state for published announcement and changelog content.
* The first implementation should support both desktop and mobile layouts rather than treating mobile as a later fix.
* The UI should reuse existing modal, toolbar, tab, admin table/form, and toast patterns instead of introducing a separate design language.

## Requirements (Evolving)

* Player lobby toolbar includes an announcement entry on desktop and mobile.
* Announcement entry is not added to room-view controls or other non-lobby screens in this MVP.
* Player announcement modal has tabs for `公告` and `更新日志`.
* Player announcement/changelog APIs and UI require an authenticated player session.
* There is no anonymous announcement/changelog entry point, anonymous read API, or anonymous unread-state branch in this MVP.
* Player announcement modal uses a medium-large desktop dialog and a near-fullscreen mobile layout.
* Desktop player announcement modal is roughly 720-840px wide, has a stable minimum height around 520px, and caps height around 80vh.
* Mobile player announcement modal occupies most of the viewport with safe margins, and parent list content scrolls inside the modal rather than expanding the page.
* Announcement list displays title and first publish time.
* Selecting an announcement opens a sibling second-level detail popup above the announcement window, matching the user `详细信息` popup pattern rather than replacing or covering content inside the parent announcement panel.
* Changelog is managed as individual entries in admin, with each entry carrying title, first publish time, last edited time, body, and draft/published/soft-deleted state.
* Player `更新日志` tab lists published changelog entries like news items, sorted newest first by first publish time, with title and first publish time.
* Selecting a changelog entry opens a sibling second-level detail popup above the announcement window, matching the same separate-window pattern as announcement details.
* Closing the detail modal returns the player to the original announcement/changelog list without closing the parent announcement window.
* Announcement and changelog body rendering supports a Markdown-lite whitelist: paragraphs, preserved line breaks, unordered lists, bold text, and `http`/`https` links.
* Markdown-lite rendering must not support raw HTML, scripts, embedded images, or non-http link protocols.
* Player toolbar entry shows a simple red dot when published announcement or changelog content has not been read by the current user.
* Inside the announcement window, the `公告` tab and `更新日志` tab each show their own red dot when that tab has unread published entries.
* Individual unread announcement/changelog rows show a small red dot plus a subtle visual emphasis, so players can identify which entries are unread.
* Unread badge summaries refresh when the player enters the lobby, opens the announcement modal, and after an entry is marked read by opening its detail.
* The MVP does not use realtime push or periodic polling to refresh unread badges while a player idles in the lobby.
* Only opening an announcement or changelog entry's second-level detail modal marks that specific entry as read for the current user.
* Entering a tab/list or opening the parent announcement window does not mark unread entries as read.
* Publishing a new announcement/changelog entry creates unread state for eligible players.
* Editing content that is already published does not make previously read entries unread again.
* Republish after unpublish preserves the original first publish time and does not create a new unread event for players who already read the entry.
* Unpublished entries are hidden from player lists; republishing an entry restores visibility using its original first publish time.
* For a user, only entries first published after that user's account creation time can count as unread.
* Entries published before a user's account creation remain visible in lists but do not create red dots for that new user.
* Player lists sort and display by first publish time, not last edited time.
* Detail modals may show last edited time as secondary metadata when it differs from first publish time.
* Announcement entries support pinning; pinned published announcements appear before unpinned announcements, then each group sorts newest first by first publish time.
* Changelog entries do not support pinning and remain sorted newest first by first publish time.
* Player announcement modal always opens on the `公告` tab by default.
* Player announcement and changelog tabs each load the first 20 entries initially and append older entries through a `加载更多` action.
* Player list pagination preserves the tab's defined order: pinned announcements first, then unpinned announcements; changelog entries by first publish time newest first.
* Empty player tabs show lightweight empty states: `暂无公告` for announcements and `暂无更新日志` for changelog.
* Player list/detail loading failures show an inline error state with a `重试` action and do not close the announcement modal.
* A failed `加载更多` request keeps already loaded rows visible and lets the player retry loading more.
* Admin content supports draft/published visibility and soft-delete/unpublish behavior.
* Admin delete actions soft-delete announcement/changelog entries and remove them from normal admin/player lists, but the MVP does not expose a deleted-content restore UI.
* Admin delete actions require a normal confirmation dialog that shows the entry title and warns that deleted content becomes invisible to players and has no restore entry in the MVP.
* Admin management lives under one `公告管理` admin navigation tab.
* The `公告管理` admin tab has internal `公告` and `更新日志` sub-tabs that share CRUD patterns.
* Admin announcement/changelog sub-tabs default to showing all non-deleted entries, including both draft and published entries.
* Admin lists show a status label for each entry and provide `全部` / `已发布` / `草稿` filters.
* Admin lists do not include title/body search in this MVP.
* Admin console can add, edit, and delete announcement content.
* Admin console can add, edit, and delete changelog content.
* Changelog entries use one required title field and do not include a separate version label/version number field in this MVP.
* Admin editors use explicit action buttons instead of a status dropdown as the only publish control.
* New and draft entries expose `保存草稿` and `发布` actions.
* Published entries expose `保存修改` and `取消发布` actions.
* Admin editors do not auto-save drafts in this MVP.
* Admin draft saves require a non-empty trimmed title but allow an empty body.
* Admin publish actions require a non-empty trimmed title and non-empty trimmed body.
* Announcement and changelog titles are limited to 80 characters.
* Announcement and changelog bodies are limited to 10,000 characters.
* Admin validation for announcement/changelog content must run on the server, with matching frontend inline feedback where practical.
* Admin announcement/changelog editors include a Markdown-lite preview that uses the same safe rendering rules as player detail modals.
* Admin editor layout shows edit and preview side by side on desktop, and uses an edit/preview switch on mobile or narrow layouts.
* Frontend implementation must handle desktop and mobile separately where layout differs.
* Interactions must provide clear pressed/loading/error feedback and preserve keyboard/focus accessibility.

## Open Questions

* None. Requirements confirmed; implementation may start.

## Acceptance Criteria (Evolving)

* [ ] Logged-in players can open the announcement window from the right-side home toolbar on desktop.
* [ ] Logged-in players can open the announcement window from the mobile top-right tools menu.
* [ ] Unauthenticated requests to player announcement/changelog APIs are rejected.
* [ ] The feature does not add an anonymous visitor announcement/changelog UI path.
* [ ] The announcement entry does not appear in room-view controls.
* [ ] Announcement modal renders with a stable minimum height and does not collapse when either tab has little content.
* [ ] On desktop, the announcement modal renders as a medium-large dialog roughly 720-840px wide with about 520px minimum height and an 80vh height cap.
* [ ] On mobile, the announcement modal renders as a near-fullscreen dialog with internal scrolling for lists, while entry details render in their own viewport-contained second-level popup.
* [ ] Announcement modal opens on the `公告` tab by default every time.
* [ ] `公告` tab lists announcement title and first publish time, with pinned published announcements above unpinned announcements and newest-first ordering within each group.
* [ ] `公告` tab initially loads up to 20 entries and can append older entries with `加载更多` when more results exist.
* [ ] Empty `公告` tab shows `暂无公告`.
* [ ] Clicking an announcement opens a sibling second-level detail popup with its full title, first publish time, optional last edited time, and content; the detail popup is not rendered as an inline replacement or cover inside the parent announcement panel.
* [ ] Announcement detail body scrolls internally when content is long and keeps primary close/navigation controls reachable.
* [ ] `更新日志` tab lists published changelog entries with title and first publish time, sorted newest first by first publish time, with no pin controls.
* [ ] `更新日志` tab initially loads up to 20 entries and can append older entries with `加载更多` when more results exist.
* [ ] Empty `更新日志` tab shows `暂无更新日志`.
* [ ] Clicking a changelog entry opens a sibling second-level detail popup with its full title, first publish time, optional last edited time, and content; the detail popup uses the same separate-window pattern as announcement details.
* [ ] Changelog detail body scrolls internally when content is long and keeps primary close/navigation controls reachable.
* [ ] Closing the detail modal returns to the parent announcement window and preserves the selected tab/list context.
* [ ] Player list/detail load failures show inline error text and a `重试` action without closing the modal.
* [ ] Failed `加载更多` requests keep already loaded rows visible and allow retrying.
* [ ] Announcement and changelog detail bodies render Markdown-lite with paragraphs, line breaks, unordered lists, bold text, and safe `http`/`https` links.
* [ ] Raw HTML and unsupported Markdown-lite content render safely as text or are ignored, without using arbitrary `dangerouslySetInnerHTML`.
* [ ] Admin announcement/changelog editors provide a Markdown-lite preview that matches player detail rendering.
* [ ] Admin editor preview appears side by side with the editor on desktop and behind an edit/preview switch on mobile or narrow screens.
* [ ] Admin users manage changelog as separate versioned entries rather than one global text blob.
* [ ] The announcement toolbar entry shows a red dot when the current user has any unread published announcement or changelog entry.
* [ ] The `公告` tab and `更新日志` tab each show a red dot when that specific content type has unread entries.
* [ ] Unread announcement/changelog rows show a row-level red dot and subtle emphasis in the player lists.
* [ ] Unread summaries refresh when a player enters the lobby.
* [ ] Unread summaries refresh when a player opens the announcement modal.
* [ ] Unread summaries refresh after opening an unread entry detail marks that entry as read.
* [ ] Opening an unread announcement detail marks only that announcement entry as read for the current user.
* [ ] Opening an unread changelog detail marks only that changelog entry as read for the current user.
* [ ] Opening the parent announcement window or switching tabs does not mark unread entries as read.
* [ ] Red dots clear only after all unread entries in the relevant scope have been opened in detail.
* [ ] First publishing a new announcement or changelog entry can make that entry unread for players.
* [ ] Editing an already-published announcement or changelog entry does not re-trigger unread status for players who already read it.
* [ ] Unpublishing a published entry hides it from player lists without deleting it.
* [ ] Republishing a previously published entry preserves its original first publish time.
* [ ] Republishing a previously published entry does not mark it unread again for players who already read it.
* [ ] Newly registered users can see historical published announcement/changelog entries without those historical entries creating unread red dots.
* [ ] Unread calculation ignores entries whose first published time is earlier than the current user's account creation time.
* [ ] Admin users can save content as draft/published and unpublish or soft-delete content without hard-removing audit history.
* [ ] Admin delete actions show a confirmation dialog before soft-delete.
* [ ] Delete confirmation includes the entry title and explains that deleted content becomes invisible to players and has no admin restore entry in this MVP.
* [ ] Soft-deleted announcement/changelog entries disappear from normal admin/player lists.
* [ ] Admin UI does not expose deleted-content restore controls in this MVP.
* [ ] Admin console contains one `公告管理` navigation tab, not separate sidebar entries for announcements and changelog.
* [ ] The `公告管理` tab provides internal sub-tabs for `公告` and `更新日志`.
* [ ] Admin `公告` and `更新日志` sub-tabs default to all non-deleted entries.
* [ ] Admin lists show draft/published status labels and support `全部` / `已发布` / `草稿` filters.
* [ ] Admin announcement/changelog lists do not show title/body search controls in this MVP.
* [ ] Admin users can create, edit, and remove announcements.
* [ ] Admin users can toggle pinned state for announcements.
* [ ] Admin users can create, edit, and remove changelog content.
* [ ] New and draft admin editor states provide separate `保存草稿` and `发布` actions.
* [ ] Published admin editor states provide `保存修改` and `取消发布` actions.
* [ ] Saving a draft does not make content visible to players or create unread state.
* [ ] Saving a draft with a non-empty title and empty body is allowed.
* [ ] Saving a draft with an empty title is rejected with a clear validation message.
* [ ] Publishing a draft is the explicit first-publish action that can make content visible and unread for eligible players.
* [ ] Publishing an entry with an empty title or empty body is rejected with a clear validation message.
* [ ] Admin editor validation rejects announcement/changelog titles longer than 80 characters.
* [ ] Admin editor validation rejects announcement/changelog bodies longer than 10,000 characters.
* [ ] Frontend admin editor shows clear length feedback for title/body limits.
* [ ] Admin content changes are validated server-side and return clear errors.
* [ ] Admin content changes are audit logged.
* [ ] Relevant frontend, backend, and system-design docs are updated.
* [ ] `npm run docs:system-design` is run after system design docs change.

## Definition Of Done

* Tests added or updated for player API, admin API, and key UI behavior where practical.
* `npm test`, `npm run build`, and `npm run docs:system-design` pass, or any failure is documented with exact cause.
* System design documentation reflects new routes, data models, admin tab, and player overlay ownership.
* Desktop and mobile player layouts are verified.

## Out Of Scope (Temporary)

* Realtime push notifications for new announcements.
* Periodic polling for announcement/changelog unread summaries while a player idles in the lobby.
* Scheduled publishing unless explicitly selected during requirements.
* Unauthenticated visitor access to announcement/changelog content.
* Anonymous announcement/changelog read APIs.
* Anonymous unread-state handling.
* Announcement entry inside room-view controls.
* Single global changelog text blob.
* Player changelog rendered as one merged long-text stream.
* Loading all player announcement/changelog entries in one initial request.
* Traditional numbered pagination inside the player announcement modal.
* Closing the player announcement modal automatically on load failure.
* Blank-only player empty states.
* Toast-only player list/detail load errors without inline retry.
* Compact-only player announcement modal layout for both desktop and mobile.
* Fullscreen player announcement modal layout on desktop.
* Inline split-pane detail inside the parent announcement window.
* Expanding detail content inside list rows.
* Numeric unread count badges for this MVP.
* `NEW` text labels for row-level unread state.
* Tab-only unread indicators without row-level unread state.
* Clearing unread state by opening the parent announcement window.
* Clearing unread state by entering a tab/list without opening details.
* Re-notifying all players on every edit to already-published content.
* Re-notifying all players when an already-published entry is unpublished and republished.
* Refreshing first publish time on republish.
* Content-change-aware republish unread rules for this MVP.
* Treating all historical published entries as unread for newly registered users.
* Sorting player lists by last edited time.
* Pinning changelog entries.
* Dedicated changelog version label/version number field in this MVP.
* Requiring semantic version numbers for changelog entries.
* Admin deleted-content filter/view for this MVP.
* Admin restore operation for soft-deleted announcement/changelog entries.
* Deleting announcement/changelog entries without confirmation.
* Requiring typed-title confirmation for normal announcement/changelog deletion.
* Admin title search for announcement/changelog lists in this MVP.
* Admin body/full-text search for announcement/changelog lists in this MVP.
* Separate top-level admin sidebar tabs for announcements and changelog.
* Separate admin sublists for draft and published content.
* Defaulting admin lists to published-only content.
* Admin autosave draft behavior in this MVP.
* Using only a status dropdown plus generic save button for publishing/unpublishing.
* Empty-title drafts.
* Publishing empty-body announcement/changelog entries.
* Announcement/changelog titles longer than 80 characters.
* Announcement/changelog bodies longer than 10,000 characters.
* Placing announcement/changelog CRUD inside existing system settings.
* Rich WYSIWYG editor unless explicitly selected during requirements.
* Raw HTML, images, embedded media, scripts, and non-http links in announcement/changelog content.
* File/image attachments unless explicitly selected during requirements.

## Decision (ADR-lite)

**Context**: The first scope choice needed to balance simple admin-managed content with player-facing visibility of new updates.

**Decision**: Build the fuller MVP: draft/published content, soft-delete/unpublish, and per-user unread/new indicators for announcement and changelog content. Do not include realtime push, scheduled publish, rich text, or attachments by default.

**Consequences**: The implementation needs extra read-state storage and badge refresh behavior, but avoids a later data-model rewrite for unread notifications.

**Context**: The second scope choice determined whether the announcement entry should also affect active room UI.

**Decision**: Keep the player entry in the home lobby toolbar only, with desktop and mobile parity. Do not add announcement controls to active room screens.

**Consequences**: The MVP avoids disturbing the battle-room interaction surface and keeps the implementation focused on lobby overlays.

**Context**: The changelog shape needed to satisfy admin create/edit/delete requirements and the user's later preference to make update logs list-based.

**Decision**: Store changelog as admin-managed entries. Render them for players as a news-like list in the `更新日志` tab, with click-through detail for each entry.

**Consequences**: Admin operations and unread state can target individual changelog entries, and player behavior stays consistent across the `公告` and `更新日志` tabs.

**Context**: Content formatting needed to balance readable operational posts with the project's existing safety posture around admin-configured text.

**Decision**: Support Markdown-lite for announcement and changelog bodies: paragraphs, preserved line breaks, unordered lists, bold text, and `http`/`https` links only. Do not support raw HTML or a rich text editor.

**Consequences**: Admin authors can format readable notices without introducing arbitrary HTML rendering. Implementation should use a constrained parser similar in spirit to `HomeFooter`'s safe link parser, with dedicated tests for escaping and unsupported protocols.

**Context**: The player detail flow needed to decide whether list items expand in place, render split-pane detail, or open another modal.

**Decision**: Clicking an announcement or changelog list item opens a sibling second-level detail popup above the parent announcement window, matching the user detail popup pattern. Closing the detail popup returns to the same tab and list context without replacing or covering content inside the parent announcement panel.

**Consequences**: The UI gets a clear reading surface for long Markdown-lite content, at the cost of managing nested modal focus and mobile close behavior carefully.

**Context**: The unread indicator needed to communicate new content without competing with existing mailbox count badges.

**Decision**: Use simple red dots: one aggregate dot on the lobby toolbar entry and one dot on each tab that has unread content. Do not show numeric unread counts in the MVP.

**Consequences**: The toolbar stays visually light, while the parent modal still tells players which content type contains new entries.

**Context**: The unread-clearing rule needed to match the chosen nested detail flow.

**Decision**: Mark a content entry as read only when the player opens that entry's second-level detail modal. Opening the parent announcement window or switching tabs does not clear unread state.

**Consequences**: Red dots keep their meaning as "unread full content exists," and read-state updates can target one content row at a time.

**Context**: The admin navigation needed to support two related content types without overcrowding the existing admin sidebar.

**Decision**: Add one `公告管理` admin tab. Inside it, use sub-tabs for `公告` and `更新日志`, sharing the same CRUD/list/drawer patterns where practical.

**Consequences**: Admin navigation stays compact, while announcements and changelog remain operationally distinct inside the feature surface.

**Context**: Published content can later be edited for small corrections, and the user chose not to disturb players again for those edits.

**Decision**: Only the first publish transition for an entry creates unread state. Editing an entry that is already published does not make it unread again for players who previously read it.

**Consequences**: Minor corrections do not create repeated red dots. Important post-publication corrections would require creating a new entry in this MVP.

**Context**: New users can access historical posts, but red dots should represent new content relevant to their account lifetime.

**Decision**: Entries first published before a user's account creation time do not count as unread for that user. They remain visible in announcement/changelog lists.

**Consequences**: New players are not forced through old operational history, while the announcement center still preserves historical content.

**Context**: Player list time semantics needed to align with unread behavior and avoid edits changing historical order.

**Decision**: Player lists display and sort by first publish time. Detail modals may show last edited time as secondary metadata if it differs.

**Consequences**: Minor edits do not reorder player lists or imply a new unread event, while details can still expose that a post was corrected.

**Context**: Announcement content may include operationally urgent posts, while changelog entries should preserve release chronology.

**Decision**: Support pinning only for announcements. Changelog entries do not support pinning.

**Consequences**: Admins can keep important notices visible without distorting the update-log timeline.

**Context**: Opening behavior needed to balance predictability with unread hints.

**Decision**: Always open the player announcement modal on the `公告` tab by default.

**Consequences**: Players get stable, predictable entry behavior. Unread red dots still indicate when the changelog tab also has unread content.

**Context**: Announcement and changelog history can grow over time, but the player modal should stay lightweight.

**Decision**: Load the first 20 entries per tab and append older entries through a `加载更多` action.

**Consequences**: The modal avoids large initial payloads while keeping navigation simpler than numbered pagination.

**Context**: Deletion needed to preserve audit history without expanding the admin surface into lifecycle recovery tools.

**Decision**: Use soft-delete for announcement/changelog deletion, but do not expose deleted-content restore controls in the MVP.

**Consequences**: Normal admin and player lists stay clean, while audit/history remains available for technical recovery if needed later.

**Context**: Admin authors need to confirm how Markdown-lite content will render without introducing a rich text editor.

**Decision**: Include a Markdown-lite preview in announcement/changelog editors. Use side-by-side edit and preview panes on desktop, and an edit/preview switch on mobile or narrow layouts.

**Consequences**: Authors can verify formatting before publishing while the implementation keeps one constrained renderer shared with player detail views.

**Context**: Changelog metadata needed to decide whether the product requires explicit version labels.

**Decision**: Use a required title field only for changelog entries. Do not add a separate version label or version number field in the MVP.

**Consequences**: Admin creation stays lightweight. If a post needs version text, the author can include it in the title; a dedicated version field can be added later if release management becomes stricter.

**Context**: Republish behavior needed to distinguish a temporary visibility toggle from a genuinely new content notification.

**Decision**: Preserve the original first publish time when a published entry is unpublished and later republished. Do not create a new unread event for players who already read that entry.

**Consequences**: Temporary unpublishing does not reorder historical content or create duplicate red dots. New notifications still require creating a new entry.

**Context**: Admin users need to manage both published posts and drafts without losing track of unpublished work.

**Decision**: Default admin announcement/changelog lists to all non-deleted entries, show draft/published status labels, and provide `全部` / `已发布` / `草稿` filters.

**Consequences**: Drafts remain visible by default while admins can still narrow the list when needed.

**Context**: The player announcement window needs enough space for news-style lists and long detail content without taking over the desktop lobby.

**Decision**: Use a medium-large desktop modal, roughly 720-840px wide with about 520px minimum height and an 80vh height cap. On mobile, use a near-fullscreen modal with internal scrolling for list and detail content.

**Consequences**: Desktop keeps the announcement center as an overlay, while mobile preserves readable space and stable controls for long content.

**Context**: Tab-level red dots show that unread content exists, but players still need to identify the specific unread rows.

**Decision**: Show a row-level unread red dot and subtle emphasis on unread announcement/changelog rows. Do not use `NEW` text labels.

**Consequences**: The unread system stays visually consistent and lets players clear entries intentionally by opening specific details.

**Context**: Admin publish and save actions have different side effects for visibility, first publish time, and unread state.

**Decision**: Use explicit editor actions. New and draft entries show `保存草稿` and `发布`; published entries show `保存修改` and `取消发布`. Do not use autosave or a status dropdown as the only publish control in the MVP.

**Consequences**: Admin intent is clear, and implementation can attach unread/visibility side effects only to explicit publish/unpublish actions.

**Context**: Admin filtering needed to balance useful management tools with MVP surface area.

**Decision**: Do not include title or body search in admin announcement/changelog lists for this MVP. Keep the status filters only.

**Consequences**: The admin list stays lighter to implement, with title/body search available as a later enhancement if content volume requires it.

**Context**: Drafting and publishing have different completeness requirements.

**Decision**: Use lenient draft validation and strict publish validation. Draft saves require a non-empty title and may have an empty body; publish actions require both title and body to be non-empty after trimming.

**Consequences**: Admins can create placeholders and continue later, while player-visible content cannot be published empty.

**Context**: Admin-authored content needs bounded field sizes to protect API payloads, list layout, and modal reading performance.

**Decision**: Limit announcement/changelog titles to 80 characters and bodies to 10,000 characters.

**Consequences**: The limits leave enough room for normal game notices and update logs while preventing unusually large posts from degrading the UI.

**Context**: The product does not have a meaningful unauthenticated visitor mode, and unread state depends on player identity.

**Decision**: Require authenticated player sessions for all player announcement/changelog UI and APIs. Do not add anonymous visitor access or anonymous read-state branches.

**Consequences**: The feature stays aligned with the existing player model, and unread calculations can consistently rely on the current user.

**Context**: Unread badges need to stay reasonably accurate without adding background traffic or realtime delivery in the MVP.

**Decision**: Refresh unread summaries when the player enters the lobby, opens the announcement modal, and after an entry is marked read from its detail view. Do not use realtime push or periodic lobby polling.

**Consequences**: Badge state updates at natural interaction points. Newly published content may not appear for an already-idle player until the next refresh event, which is acceptable for this MVP.

**Context**: Player-facing announcement content can be empty or fail to load, and the modal should not collapse or disappear in either case.

**Decision**: Use lightweight empty states for empty tabs and inline error states with `重试` actions for player list/detail load failures. Failed `加载更多` keeps already loaded rows visible.

**Consequences**: Players get clear feedback and can retry in place without losing modal context.

**Context**: Admin deletion is soft-delete, but the MVP deliberately does not expose a restore UI, so accidental deletion still has operational cost.

**Decision**: Require a normal delete confirmation dialog that shows the entry title and explains that deleted content becomes invisible to players and cannot be restored from the admin UI in this MVP. Do not require typed-title confirmation.

**Consequences**: Admins get a clear safety checkpoint without making routine content maintenance overly heavy.

## Technical Notes

* Likely player files: `src/home/components/HomeHeader.jsx`, `src/home/HomeScreen.jsx`, `src/app/AppRoutes.jsx`, `src/app/overlayRegistry.js`, `src/app/AppOverlays.jsx`, and a new modal under `src/modals/`.
* Likely admin files: `src/admin/AdminConsole.jsx`, `src/admin/AdminShell.jsx`, a new admin tab component under `src/admin/`, and shared `adminComponents.jsx` patterns.
* Likely server files: `server/adminRoutes.js`, a new focused server module for announcement/changelog validation and serialization, possibly `server/publicRoutes.js` or a new authenticated content router.
* Likely data file: `prisma/schema.prisma`, with Prisma client generation if models change.
* Existing safe-link reference: `src/home/components/HomeFooter.jsx` parses only `[label](https://example.com)` style footer links and lets React escape other text.
* Relevant specs: `.trellis/spec/frontend/index.md`, `.trellis/spec/backend/index.md`, `.trellis/spec/guides/cross-layer-thinking-guide.md`.

# Existing recruitment, inventory, and mailbox flow

## Recruitment timer authority

* `RecruitmentTask.readyAt` is the server-authoritative completion time.
* The frontend polls/reloads the task and schedules its ready transition from `readyAt`, so updating that field survives refresh and reconnect.
* A development-only `POST /api/recruitment/fast-forward` path already shortens ordinary pending recruitment to 5 seconds without consuming inventory. It is hidden in production and provides a narrow seam to replace with the real consumable behavior.
* Special cinematic recruitment is intentionally excluded from the current development fast-forward action and has its own presentation/recovery timing contract.

## Inventory and catalog behavior

* Consumable quantities are stored in the user's `ownedItems` count map.
* Built-in recruitment items are defined in `src/shared/recruitment.js`, mirrored into `ShopItem` rows, and rejected from generic warehouse use with “请在招募窗口使用这个道具”.
* A hidden built-in recruitment item pattern already exists: it can remain absent from the player shop while still having catalog metadata for inventory and mail surfaces.
* The new clock is a recruitment utility rather than an item that starts a recruitment. The catalog must distinguish starter items from waiting-stage utility items so it does not appear in the idle recruitment-item selector.

## Mail delivery

* Mail item attachments add quantities directly to `ownedItems` when claimed.
* The admin mailbox item selector is populated from admin `ShopItem` catalog rows.
* Therefore a hidden/non-purchasable catalog row is enough to make the clock selectable for future mail distribution without exposing it in the player shop.

## Likely implementation seam

* Extend the recruitment-domain item metadata with an explicit usage role, or add a parallel recruitment utility catalog.
* Replace the development-only fast-forward endpoint behavior with an authenticated, transactional use operation that checks the active task and inventory, decrements exactly one clock, and sets `readyAt` to `min(currentReadyAt, now + 3s)`.
* Return the updated task and user/inventory state together so the countdown, badge state, warehouse quantity, and refresh behavior remain consistent.

## Files inspected

* `server/recruitment.js`
* `server/recruitmentRoutes.js`
* `server/items.js`
* `server/shop.js`
* `server/mailbox.js`
* `src/shared/recruitment.js`
* `src/modals/RecruitmentModal.jsx`
* `src/modals/recruitment/useRecruitmentCatalog.js`
* `src/admin/AdminMailbox.jsx`
* `src/modals/warehouse/WarehouseItemGrid.jsx`

# Recruitment Cinematic Contract

## Scenario: Fixed-result Aemeath recruitment presentation

### 1. Scope / Trigger

- Trigger: changing the Aemeath memorial-ticket recruitment payload, player-mail attachment presentation, `RecruitmentCinematicOverlay`, `useRecruitmentCatalog`, cinematic timing/assets, or the recruitment cinematic CSS owner.
- This flow spans shared metadata, server payload serialization, mailbox catalog projection, client recovery/display-deadline state, a body-level portal, and authoritative server `readyAt`; normal presentation completion must never be treated as an interrupted request.

### 2. Signatures

- Server payload `task.cinematic` is either `null` or `{ id, theatricalCountdownMs, spriteImageUrl, spriteSheetUrl, flightSoundUrl, flashSoundUrl }`.
- `AEMEATH_RECRUITMENT_TIMING` owns `taskDurationMs`, `darkenAtMs`, `flightAtMs`, `hoverAtMs`, `glowAtMs`, `concealedSwapAtMs`, and `unlockAtMs`.
- `useRecruitmentCatalog()` owns separate `cinematicPlaybackTaskId`, `cinematicCompletedTaskId`, and `presentationReadyAt` state.
- `shouldRecoverInterruptedCinematic({ task, cinematicPlaybackTaskId, cinematicCompletedTaskId })` returns whether the interruption endpoint should run.
- `cinematicPresentationReadyAt(task, receivedAt)` anchors a newly created presentation to client receipt; `presentationReadyRecruitmentTask(task)` changes only the client view to ready at that display deadline.
- Player mailbox item attachments expose `{ type, itemId, itemName, imageUrl, quantity, claimed }`; `MailboxModal` renders art/name/quantity and never uses `itemId` as player copy.
- Recruitment settings expose fixed-result copy under `fixedItemTexts[itemType] = { scopeLabel, resultText }`. The player status projection may expose the effective `scopeLabel`, but must not expose the configured result line before the task resolves.
- `src/styles/commerce/recruitment/cinematic.css` owns the application lock, dimmer, sprite/image presentation, flight path, glow, and full-screen flash; `modal-shell.css` remains the ordinary modal layout owner.

### 3. Contracts

- Starting a freshly created cinematic task clears the completed id and sets the playback id to that task id.
- Normal unlock first records `cinematicCompletedTaskId = task.id`, then clears the playback id. The client view remains pending until `presentationReadyAt`; normal completion must not call `/api/recruitment/interrupt-cinematic` or mutate the server timestamp.
- Recovery runs only for a pending cinematic task whose id matches neither the active playback id nor the completed id. Fresh remount, page hiding, offline, page exit, or an uncompleted overlay cleanup may use the interruption endpoint to shorten `readyAt`.
- A fresh cinematic display deadline is `receivedAt + taskDurationMs`, not the stale server-relative `remainingMs`. This preserves the five-second tail under mobile response latency; the earlier server `readyAt` still exclusively authorizes claim.
- The theatrical countdown remains client-presentational until `concealedSwapAtMs`; after that point it reads `presentationReadyAt` and continues without pausing. At zero, the client view changes to ready in the same timer callback instead of waiting for a refetch.
- The dimmer starts with the first `999:00` frame. The flash center must equal the settled sprite/countdown target, not the viewport center, and must be fully opaque while the sprite disappears and the countdown switches to five seconds.
- `flashSoundUrl` is preloaded on overlay mount and plays at `concealedSwapAtMs`, when the flash is fully white, rather than at the earlier `glowAtMs` expansion start. The current asset is `/assets/music/aemeath-recruitment-full-white-burst.ogg`; interruption cleanup cancels its pending timer.
- `spriteSheetUrl` takes presentation priority when non-empty. The current `1536×1872` WebP uses `8×9` cells: row 1 supplies eight right-flight frames and row 3 supplies four wave frames. When the sheet slot is empty, `spriteImageUrl` remains the static or animated WebP fallback.
- Portrait recruitment item rules may hide the item-name span, but must preserve `.recruitment-item-icon` and quantity.
- A fixed-result item reads `scopeLabel` from the persisted recruitment config for its catalog/confidence copy and snapshots the configured `resultText` into `RecruitmentTask.responseText` when recruitment starts. Empty admin values normalize back to the shared defaults.
- The idle selection card renders `scopeLabel` only when it differs from `confidenceText`; fixed-result items use the red confidence line as the single visible copy instead of duplicating the same sentence in black and red.
- A quantity-zero recruitment action reads `数量不足`; it must not use the ambiguous generic label `不可用`.
- The one-time welcome-mail toast uses the dedicated light-green `mail` tone. A claimed mailbox attachment action stays gray in default, hover, focus, and active states, including under Bright School late theme overrides.
- Mailbox list projection resolves item names/images from the `ShopItem` catalog with built-in recruitment metadata as fallback. Missing metadata falls back to generic `道具`, never the internal English id. The Aemeath ticket uses `/assets/items/aemeath-flight-snow-memorial-ticket.webp`, a tightly cropped transparent `512×436` source whose colored bounds fill the shared item slots without non-uniform scaling.

### 4. Validation & Error Matrix

- Fresh task + active playback id -> play the full cinematic and keep interaction locked.
- Normal cinematic completion while server task is still pending -> unlock interaction, keep counting down, do not POST interruption.
- Slow start response -> locally anchor a complete 11.25-second presentation, show about four seconds after unlock, then enter ready exactly at displayed zero without another network wait.
- Pending cinematic found on a fresh mount -> POST interruption once recovery is visible/online, then show the ordinary ready phase.
- Page hidden/offline/unmounted before completion -> release BGM duck and interaction lock, request interruption with keepalive where supported.
- `spriteSheetUrl` configured -> render atlas flight/wave frames; empty sheet plus image URL -> render the image fallback; both empty -> keep the timing/flash safe without a sprite.
- Flash growth -> its early local orb, settled sprite center, and CSS target coordinates match; `concealedSwapAtMs` stays fully opaque so the visible countdown cannot expose the large numeric jump.
- Full-white burst sound -> OGG/Vorbis asset is present and playback is scheduled at `concealedSwapAtMs`; interrupted presentation before that point cancels the timer.
- Item attachment with a catalog row -> show image, localized name, and quantity; built-in Aemeath attachment without a catalog row -> show the built-in memorial-ticket WebP and localized name; unknown item -> show generic `道具` rather than `itemId`.

### 5. Good/Base/Bad Cases

- Good: `finishCinematic()` records the completed task id before clearing `cinematicPlaybackTaskId`, so the recovery effect stays dormant until `readyAt`.
- Good: presentation readiness is a local view transition at a receipt-anchored deadline, while `/api/recruitment/claim` continues enforcing the earlier server `readyAt`.
- Good: sprite-frame animation is isolated from the outer transform path, allowing a later animated WebP replacement without rewriting movement or timing.
- Base: interrupted presentation intentionally shortens `readyAt` and still requires the player to click the ordinary reveal action.
- Bad: treating every pending task without an active playback id as interrupted; normal unlock clears that id too and would prematurely enter ready.
- Bad: scheduling the mobile ready refresh from response `remainingMs`; request latency makes the visible timer reach zero before the delayed refresh.
- Bad: centering the flash at `50% 50%` or rendering `attachment.itemId` as the player-facing attachment label.
- Bad: growing `modal-shell.css` with presentation keyframes or hiding every mobile item-button `span`, including the icon owner.

### 6. Tests Required

- `src/modals/RecruitmentModal.test.js` asserts theatrical-to-display-deadline switching, client receipt anchoring, immediate presentation-ready projection, flash target wiring, sprite-sheet/image slots, lock wiring, and recovery truth table.
- `server/mailbox.test.js` asserts item catalog metadata projection plus the built-in memorial-ticket WebP fallback; `src/modals/MailboxModal.test.jsx` asserts the memorial-ticket image/localized-name/quantity rendering and internal-id absence.
- `src/modals/RecruitmentModal.test.js` verifies the shared ticket URL and committed RIFF/WebP signature so recruitment, Warehouse, and mailbox keep one asset owner.
- `src/modals/RecruitmentModal.test.js` verifies the committed burst asset's `OggS` signature, stable shared URL, and concealed-swap timer wiring.
- `server/recruitment.test.js` asserts the fixed Aemeath result, 11.25-second `readyAt`, theatrical countdown, image/sheet/sound payload slots, and explicit interruption behavior.
- `server/recruitment.test.js` also round-trips `fixedItemTexts` through persistence, verifies the effective player catalog copy, and verifies that a new task snapshots the configured Aemeath line. `src/admin/AdminRecruitmentSettings.test.jsx` saves both fields and reloads them from the admin API.
- `src/styles/styleContract.test.js` asserts `recruitment.css` imports `cinematic.css`, the modal shell remains separate, and portrait rules preserve the icon selector.
- Chromium visual QA should inspect the light memorial-ticket surface, dimming before flight, flight-to-wave frame change, a local flash orb centered on the settled sprite, fully white concealed swap, portrait fit, and the portrait mailbox attachment row without overflow.
- Run `npm run check` after cross-layer changes.

### 7. Wrong vs Correct

Wrong:

```js
function finishCinematic() {
  setCinematicPlaybackTaskId("");
  // Recovery now sees a pending cinematic without active playback and interrupts it.
}
```

Correct:

```js
function finishCinematic() {
  setCinematicCompletedTaskId(task.id);
  setCinematicPlaybackTaskId("");
}
```

Wrong:

```js
window.setTimeout(refresh, task.remainingMs + 400);
// remainingMs was measured before the response crossed a slow mobile network.
```

Correct:

```js
const presentationReadyAt = cinematicPresentationReadyAt(task, Date.now());
window.setTimeout(() => {
  setTask(presentationReadyRecruitmentTask(task));
}, new Date(presentationReadyAt).getTime() - Date.now());
```

Wrong:

```jsx
<span>{attachment.itemId}</span>
```

Correct:

```jsx
<AttachmentArt attachment={attachment} />
<span>{attachment.itemName || "道具"}</span>
<span>x{attachment.quantity}</span>
```

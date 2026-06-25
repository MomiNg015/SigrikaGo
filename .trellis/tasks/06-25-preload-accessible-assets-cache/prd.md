# Preload Accessible Assets With Cache

## Goal

Make the first visit perform the expensive asset loading work, then let later visits read unchanged assets quickly from browser cache. Login preload should cover the current user's accessible home-screen resources, and battle preload should cover the current match's actually reachable resources, so fast UI navigation does not expose unloaded images, BGM, voices, or effects.

## What I Already Know

* The production target can be constrained: the user's server is 2 CPU cores, 2 GB RAM, and 3 Mbps bandwidth.
* Current login preload only waits for critical first-screen images and interaction SFX; BGM, voices, shop/effect imagery, and most music are deferred.
* Current login deferred audio is large: local inspection found about 193 files and 77 MiB when all music and voices are considered.
* Current default home BGM is `/assets/music/main_bgm.ogg`, about 1.9 MiB locally, and it is currently deferred.
* Current battle preload uses `battlePreloadAssets()` and sends `room:preload-ready` after `preloadLoginAssets()` finishes.
* Current battle preload includes room character portraits, all runtime effect images, match success sound, interaction SFX, battle BGM, both players' skill BGM, derived skill BGM, both players' skill voices, and both players' system voices.
* Existing preload implementation times out individual asset tasks and ignores failures so users are not permanently trapped.
* Static asset caching currently needs review in `server/staticAssets.js`.
* Project instructions require updating `docs/system-design.md` and regenerating `docs/system-design.html` for behavior/deployment changes.

## Requirements

### Login/Home Preload

* Login preload must load the current user's accessible home-screen resources, not every backend-configured resource.
* "Accessible" means the current user can actually see or enter that resource in the frontend.
* Login preload must cover resources reachable within about three clicks from the home screen, especially character details and playable/previewable BGM for owned/default resources.
* Login preload must include the full audio for default-unlocked and user-owned BGM tracks.
* Login preload must not include full audio for unpurchased music products, because unpurchased BGM cannot be previewed.
* Login preload must include all product-display resources for the shop/product page.
* Login preload must include user-visible character/detail resources, house/member manual resources, warehouse/item resources, recruitment resources, equipped achievement/title/badge/nameplate assets, and home screen public assets where these are reachable/visible to the user.
* Gacha pool resources are out of this task because the user said the current product has no gacha pool.
* Login preload must use frontend-side manifest derivation, not a new backend preload-manifest API.
* Login preload may request lightweight metadata APIs before deriving the asset manifest, but those metadata requests must have timeouts and must not permanently block entering the app.
* Login preload has no total soft upper time limit.
* Individual assets still have a timeout; timed-out assets are treated as skipped for the current preload pass.
* After entering the home screen, skipped/failed resources should be retried in the background without a global user-facing progress banner.
* Missing resources should keep existing local fallback/placeholder behavior at their specific UI location.
* Login preload concurrency should be 4.
* Background retry concurrency should be 2.
* Do not add new stage text or detailed phase labels to the preload screen.

### Battle Preload

* Battle preload must load resources for this room's two players, current game mode, and resources that can actually trigger in this match.
* Battle preload must include room player portraits, current board/theme/effect resources needed by the match, current match battle BGM, relevant skill BGM, relevant skill voices, relevant system voices, and equipped stone/board resources where applicable.
* Modes with skills disabled, such as gomoku, must not preload skill BGM, skill voices, or skill effects.
* Battle preload still uses the client ready flow, but individual asset timeouts can let the client report ready and continue retrying missing resources after entering the room.
* Server-side preload ready timeout should be 90 seconds.
* Battle preload concurrency should be 4.
* Background retry concurrency should be 2.
* Do not add new stage text or detailed phase labels to the battle preload screen.

### Caching

* First visit can take longer because assets may download from zero.
* Later visits should be fast when the user has not cleared browser cache and asset URLs have not changed.
* Static `/assets/**` responses should use long-lived browser cache headers.
* Resource content changes must change the URL or file name, for example through a versioned file name or query parameter.
* Built-in static assets should follow versioned URL/file naming when content changes.
* Admin-configured resources should also follow "new file/URL for new content"; this task records the contract but does not implement a full admin upload versioning system.
* Do not add IndexedDB, Cache Storage, or a service worker in this task unless HTTP caching cannot meet the requirement.

## Acceptance Criteria

* [ ] Login preload manifest includes owned/default music audio and excludes unpurchased music audio.
* [ ] Login preload manifest includes all visible shop product images/resources.
* [ ] Login preload manifest includes current-user-accessible character, house/manual, warehouse/item, recruitment, home, and visible achievement equipment assets.
* [ ] Login preload metadata requests have bounded timeouts and fallback manifests.
* [ ] Login preload waits for the expanded manifest with concurrency 4 and no total soft limit.
* [ ] Timed-out/skipped resources are retried in the background after entering the home screen with concurrency 2.
* [ ] Battle preload excludes skill audio/effects in skill-disabled modes.
* [ ] Battle preload uses concurrency 4 and skipped resources are retried in the room background.
* [ ] Server room preload ready timeout is 90 seconds.
* [ ] Static assets under `/assets/**` are served with long-lived caching appropriate for versioned resource URLs.
* [ ] Tests cover manifest membership, exclusion rules, timeout/fallback behavior, battle mode filtering, and preload timeout constant behavior.
* [ ] System design docs describe the preload/caching contract and `npm run docs:system-design` has been run.

## Out Of Scope

* Full admin upload versioning system.
* Service worker, Cache Storage, or IndexedDB asset cache.
* New backend preload manifest API.
* New preload page phase labels or visible global background-loading progress after entering home/room.
* Loading unpurchased music full audio.
* Gacha pool resource preloading.
* Dynamic historical data such as replay details, watch room snapshots, leaderboard rows for other users, reports, feedback, audit logs, or analytics.

## Technical Approach

* Extend frontend manifest derivation in `src/shared/preloadAssets.js` rather than creating a backend manifest endpoint.
* Add lightweight metadata collection in `useStartupPreload()` only where needed to know visible product/user assets, with bounded request timeouts.
* Keep `preloadLoginAssets()` as the generic loader, but support the new concurrency constants and background retry flow.
* Update `battlePreloadAssets()` to consider game mode skill enablement before including skill-related resources.
* Update server preload timeout constant from 60 seconds to 90 seconds.
* Update static asset serving cache headers for `/assets/**`.
* Update docs and focused tests.

## Decision Notes

* Current-user-accessible resources are prioritized over backend-wide all resources.
* Unpurchased music products can show product imagery but cannot download or preview full audio.
* Failed or timed-out resources must not permanently block the app; they should retry in the relevant screen after entry.
* HTTP browser cache is the chosen caching layer for this task.
* Asset content changes must use a changed URL so long cache headers remain safe.

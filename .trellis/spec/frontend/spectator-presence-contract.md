# Battle Spectator Presence

## Scope and entry points
- `RoomBattleStage` renders `SpectatorGallery` for `showPeoplePanel && !isReplay`, including special live duels. Local tutorials opt out; system/story logs retain their existing entry.
- Player `PlayerInfo.onOpenUser` and spectator buttons open `useRoomProfiles`. Bots cannot open profiles; self profiles retain read-only social restrictions.
- `UserProfileCard` accepts optional `onRemoveFriend` / `onRemoveBlacklist`. Existing consumers retain their previous disabled relationship labels unless they provide the removal callbacks. Room consumers supply both; friend removal requires confirmation and blacklisting a friend is disabled.

## Roster and appearance
- Authoritative input is `room.spectators[].user`; deduplicate user IDs and exclude both `room.players[].user.id` values, even when the viewer role changes after settlement.
- `selectedCharacter` plus `equippedCostumes` resolves the public appearance through `resolveCharacterPortrait`. Missing outfit art falls back to the same character default; unknown characters or failed defaults use a neutral icon, never an unrelated character.
- Do not change spectator admission, limits or hidden game projections to implement presentation.

## Window-space position, occlusion and motion
- Latest user revision supersedes plain text names, the extra spectator spacer and the adaptive/faded artwork experiment. Do not restore those treatments.
- Render the complete image with object-fit:contain, no internal clip or mask/fade. Fixed frames are exactly 80% of revision 2: mobile 144x160 and desktop 192x232. Crowd count never changes these sizes. The center anchors the static seeded [-30,30] degree rotation. Functional UI and viewport boundaries may still naturally occlude art.
- Usernames use paper tags matching battle-character-label: bright-paper, bright-border, 1px border, 2px hard shadow, font-window-title and -5 degree tilt. Tags attach below the portrait; full names remain in the profile trigger and details.
- All viewers must remain in the current viewport; never add page height or a spectator scroller. Prefer exposed faces and allow natural viewport/body occlusion. Clamp bottom-edge tags inward below the portrait center, above overlapping artwork; each tag directly opens its own user. Placement excludes labels from other viewers' center hit points. Keep label and art gesture suppression consistent.
- Mobile layout has four max-content rows (opponent/board/self/dock), with the existing compact 8px gap. Do not reserve a spectator row or move the dock with crowd count.
- Occupied control surfaces are the complete .action-bar and .room-direct-actions rectangles, including padding, gaps and frames. Never mask only individual buttons: that lets spectators paint through the control panel. Placement also penalizes upper-body intersection with controls.
- Desktop player-info bounds reserve placement centers only. Paint excludes solid surfaces, never the whole transparent player column. Elevate only portrait-wrap, player-meta and player-clock-panel above presence; leave player-info without a new stacking context so floating skill panels retain their layer. Mobile and opaque special-duel masking remain unchanged.
- spectatorFreeRects keeps the complete disjoint window-space mask. placeSpectators(entries, freeRects, previous, viewport) favors art/tag visibility and separation with fixed sizes, prioritizes roomy free regions, and preserves valid existing centers. Never cut artwork to improve a placement score.
- spectatorHitPolygon partitions overlapping hit regions by nearest center. Paint and hit share the solid-surface mask so board/controls remain interactive; desktop player content naturally covers both at its higher layer.
- Keep the portal inside the room scroll owner, batch resize/scroll/structural measurement with RAF, and ignore gallery DOM mutations. Memoize placement by roster information and geometry.
- Definite absolute image dimensions must beat Bright School height:auto. Verify rendered image size, not only its wrapper.
- First roster is static; new users fade once for 220ms, reduced-motion disables it. Preserve slot ownership/cache rules and suppress profile opening after dragging or scrolling.

## Async profile boundary
- `useRoomProfiles({ roomKey, user, token, characters, onOpenReplay })` returns `{ openProfile, profileLayer }`.
- Closing, changing rooms or tokens, and unmounting invalidate pending reads. A slower prior selection cannot replace the current profile. Failed reads expose retry and close.
- Reuse `/api/users/:id/profile` and `/api/social/{friends|blacklist}/:id`, including existing POST/DELETE business rules; no new API or private data projection.

## Verification
- Pure tests: roster deduplication, exclusion, vacancy collision prevention, bounded cache reuse, first/new/rejoining animation, appearance fallback.
- DOM tests: fallback chain, gesture suppression, stable DOM, stale requests, retry, self/bot restrictions, no-tab dock measurement.
- Browser: 320/360/390 portrait with 0/1/6/20 users, half-dock spacing, center anchoring, every center independently clickable, complete uncropped art and paper name tags, desktop window scattering, social add/remove round trips, special logs and reduced motion.
- Run `npx playwright test --config tests/e2e/spectator-presence.config.js`. Its dedicated Vite config disables API proxying; fixed component fixtures and intercepted social responses are not real-server multiplayer evidence.

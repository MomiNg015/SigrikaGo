# Costume portrait framing data flow

## Existing flow

- `Costume` stores portrait URLs and is projected through `toCostumePayload()`.
- `publicUserAssets()` includes complete equipped costume payloads.
- `toRoomPlayer()` snapshots costume id and portrait URLs into room players.
- `roomResultPersistence` copies costume id and portrait URL into `GameRecord`.
- `resolveCharacterPortrait()` selects snapshot, equipped, or base portrait URL.
- Wardrobe, shop, and detail surfaces currently render the same URL with different owner geometry.

## Required additions

- Add bounded integer framing fields to `Costume`, runtime legacy schema guards, admin drafts/forms, admin default snapshot, and player payloads.
- Add black/white framing snapshot fields to `GameRecord`, persistence, replay summary/detail projections, and room restore/view paths.
- Preserve the current URL-only resolver and add a presentation resolver so existing consumers can migrate incrementally without duplicating precedence logic.
- Apply presentation transforms through a shared helper only to equipped-character portrait owners.

## Risk controls

- Defaults of 100/0/0 make legacy and non-costume portraits behaviorally identical.
- Shop/detail/admin art remains untransformed.
- Match snapshots prevent backend admin edits from changing historical framing.

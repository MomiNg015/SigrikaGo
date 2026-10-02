# Add Qiuyuan Zhouwo Skill BGM

## Goal

Add QiuYuan's purchasable second skill BGM, named "肘我", so it can be sold through the shop music category and selected from QiuYuan's character-detail music player after purchase.

## Requirements

- Add the supplied `zhouwo_loop.ogg` as a public music asset.
- Register a new skill music track for `qiuyuan` with id `qiuyuan-skill-zhouwo`, display name `肘我`, and purchasable ownership behavior.
- Convert the supplied JPG to a centered-crop WebP shop image and attach it to the built-in `qiuyuan-skill-zhouwo` music shop item.
- Keep the current character-level skill music selection model for this task.
- Document how future Aemeath derived-skill purchasable BGMs should replace either the base skill default or a specific derived-skill default.

## Acceptance Criteria

- [ ] `qiuyuan-skill-zhouwo` is present in `MUSIC_TRACKS` as a QiuYuan skill track.
- [ ] The new track is not default unlocked, is purchasable, and plays `/assets/music/qiuyuan_zhouwo_loop.ogg` as a single looping track.
- [ ] Owned users can see/select `qiuyuan-skill-zhouwo` through existing skill music option helpers.
- [ ] The built-in shop music item for `qiuyuan-skill-zhouwo` uses `/assets/items/qiuyuan-zhouwo.webp`.
- [ ] Login/battle preload helpers include the new audio source when appropriate.
- [ ] System design docs describe the new track and the future scoped replacement rule for Aemeath derived skills.

## Definition of Done

- Focused unit tests pass for the shared music library and preload assets.
- `npm run docs:system-design` regenerates the system design HTML.
- `npm run build` passes unless blocked by unrelated existing worktree changes.

## Technical Approach

Use the existing static music catalog and shop ownership model. The shop already validates music purchases against `MUSIC_TRACKS[item.targetId]`, so no new purchase API shape is required.

For Aemeath, keep current behavior now: base skill selection remains character-scoped, while fixed derived-skill music is driven by `skillPreview.musicTrackId`. If a future purchasable track needs to replace a derived skill default, extend selection storage to a scoped key such as `aemeath:voyage-star` or an equivalent nested shape, with backward compatibility for existing `musicSelections.skill[characterId]` values.

## Out of Scope

- No database migration for scoped derived-skill music selections in this task.
- No automatic shop-item seed is added unless existing seed/catalog code requires it.
- No UI redesign for grouping base and derived skill music options.

## Technical Notes

- Relevant files: `src/shared/musicLibrary.js`, `src/shared/musicLibrary.test.js`, `src/shared/preloadAssets.test.js`, `server/shop.js`, `server/musicSelection.js`, `docs/system-design.md`, `docs/system-design/05-assets-audio-preload.md`.
- Source asset: `C:/codex/musicsour/cBgm/qiuyuan/zhouwo_loop.ogg`.

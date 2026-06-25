# Aemeath Voyage Star Derived Skill

## Goal

Add Aemeath's derived skill "Voyage Star" after "Little Ai Attack" resolves a hidden hand. The derived skill replaces the skill slot for the rest of the game, has configurable display text and overclock cost through the existing character admin flow, uses a dedicated fixed BGM, and plays a Pixi sword-and-whiteout board effect before revealing the resolved board state.

## Requirements

- When Aemeath successfully resolves `hidden-hand`, create a persisted public derived skill slot for that player:
  - Name defaults to `远航星`.
  - Uses defaults to `1`.
  - It replaces the visible skill slot after hidden-hand preview resolution returns to `playing`.
  - Opponent and spectators can see the derived skill slot and use count, but not the hidden hand location.
- The derived skill remains visible as `远航星 · 1` but disabled if the source hidden hand is exposed or removed before use.
- After Voyage Star is used, keep the derived skill visible as `远航星 · 0` and disabled.
- Voyage Star may only be used by the current player on their own turn, outside skill preview and extra-turn lock states.
- Voyage Star uses board-surface confirmation like ChangLi; the client does not send a target intersection.
- Voyage Star centers on the persisted source hidden hand if it is still the player's unexposed hidden hand.
- Voyage Star effect:
  - Erase the center point and its orthogonal 1-line neighbors, skipping invalid/out-of-board points.
  - Only points actually erased by this action are used as the source set for the second removal ring.
  - Remove stones on erased points.
  - Remove every stone on the orthogonal 1-line neighbors of those erased points, deduplicated.
  - Remove own, opponent, neutral, exposed hidden-hand, and unexposed hidden-hand stones alike.
  - Black/white removals count as skill removals through existing capture-credit ownership; neutral removals do not count for either player.
  - Removing hidden hands does not emit the "hidden hand discovered" notice; history should still record hidden-hand removals.
  - After erasing points, resolve zero-liberty cleanup with skill-removal counters.
  - Clear ko, do not change turn, and do not increment move number.
- Voyage Star overclock cost is configurable through admin and defaults to `5`.
- Admin character editing:
  - Keep the base skill overclock input for Little Ai Attack.
  - Add a derived skill editing area for Voyage Star using `skill.paramsJson.derivedSkills`.
  - Allow editing derived skill name, description, and numeric overclock cost.
  - Store derived skill configuration inside existing `CharacterSkill.paramsJson` to avoid a Prisma schema migration.
- Character detail cards show Voyage Star under Little Ai Attack. This text comes from the derived skill configuration and is admin-editable.
- BGM:
  - Voyage Star has a fixed default skill BGM track, `aemeath-voyage-star-default`.
  - It does not enter player music selection, shop, unlock, or warehouse flows.
  - Pending Voyage Star previews should play the fixed track first, fall back to Aemeath's normal skill BGM if unavailable, and then fall back to battle BGM.
  - Battle preloading includes the fixed Voyage Star BGM for rooms containing Aemeath.
- Pixi board effect:
  - Register a `voyage-star` Pixi renderer in the existing board skill effect system.
  - A pure white mecha greatsword falls vertically from above and lands at the hidden-hand center.
  - White light blooms from the impact point and covers the whole board.
  - During the whiteout, the cross-shaped erased points become a star-shaped crater and removed stones dissolve into white particles/light shards.
  - The star crater and stone removal happen while white light is covering the board so stones do not appear to disappear abruptly.
  - When effects are globally disabled, skip the Pixi board effect and use the existing short preview resolution behavior with banner/BGM only.
  - After resolution, Voyage Star erased points keep a persistent star-crater board marker. Sigrika erased points keep their existing visual style.
- Replay and reconnect:
  - Derived skill state is part of shared game state.
  - Voyage Star history must include enough data to reconstruct replay without using changed admin settings for old moves, including the actual cost used and affected point IDs.

## Acceptance Criteria

- [ ] Hidden-hand success creates a visible Voyage Star derived skill slot after preview resolution.
- [ ] Exposing/removing the source hidden hand disables Voyage Star without reverting to Little Ai Attack.
- [ ] Voyage Star can be used only by the owning player on their turn through board-surface confirmation.
- [ ] Voyage Star erases the correct cross points, skips invalid points, removes deduplicated second-ring stones, and resolves zero-liberty cleanup.
- [ ] Voyage Star does not consume the turn or increment move number, and applies the configured overclock cost.
- [ ] Voyage Star used state persists as `uses: 0` and displays disabled.
- [ ] Admin can edit Voyage Star name, description, and overclock cost through the character editor.
- [ ] Character detail card shows Voyage Star below Little Ai Attack on desktop and mobile.
- [ ] Pending Voyage Star preview plays the fixed BGM before falling back to Aemeath's normal skill BGM.
- [ ] Voyage Star Pixi animation shows sword impact, whiteout, star crater, and covered stone removal without premature visible board mutation.
- [ ] Persistent star crater is only used for Voyage Star erased points.
- [ ] Replay reconstruction and reconnect preserve derived skill state and historical Voyage Star cost/effects.
- [ ] `npm test`, `npm run build`, and `npm run docs:system-design` pass.

## Definition of Done

- Tests added or updated for shared rules, admin draft/payload handling, BGM resolution, preview payloads, board effect registration, and key UI display behavior.
- System design documentation updated and rendered to `docs/system-design.html`.
- Existing unrelated dirty files are not reverted or included in this task.

## Technical Approach

- Add generic derived-skill helpers in shared game skill code, with Voyage Star as the first registered derived skill.
- Store editable derived skill definitions in `skill.params.derivedSkills` / `paramsJson`.
- Keep runtime derived slot state in `game.derivedSkills[color]`.
- Resolve effective skill config from `game.derivedSkills[color]` before falling back to the player character's base skill.
- Implement Voyage Star as a `voyage-star` active skill handler with no target and board-surface confirmation.
- Extend server pending skill preview data with Voyage Star point sets and `musicTrackId`.
- Extend music resolution to prefer explicit pending skill music track IDs and effect-specific fixed tracks.
- Use Pixi `Graphics` for the one-shot sword, board whiteout, star crater, and particles; persistent crater remains DOM/CSS based after resolution.

## Decision (ADR-lite)

Context: The project currently has one active skill slot per player and stores configurable skill fields on `CharacterSkill`, with extensibility available through `paramsJson`.

Decision: Implement derived skills as a generic runtime slot and store editable derived skill definitions in `skill.paramsJson.derivedSkills`, avoiding a database migration. Voyage Star is the first derived skill and has a dedicated fixed BGM plus Pixi presentation keyed by `effectType`.

Consequences: The code gains an effective-skill layer used by server and UI. Future derived skills can reuse the same data shape, but admin UI is initially tailored to Voyage Star while the payload supports an array.

## Out of Scope

- Player-selectable derived skill BGM.
- Shop/unlock/warehouse support for derived skill BGM.
- A generic admin UI for arbitrary derived skill creation beyond Voyage Star fields.
- Changing Sigrika erased-point visuals.

## Technical Notes

- Likely rule files: `src/shared/game.js`, `src/shared/gameSkills.js`, `src/shared/gameSkillActions.js`, `src/shared/gameSkillHandlers.js`, `src/shared/gameSkillState.js`, `src/shared/skillEffectCatalog.js`.
- Likely server files: `server/roomSkillResolution.js`, `server/characters.js`, `server/adminCharacterManagement.js`.
- Likely UI files: `src/room/ActionBar.jsx`, `src/room/PlayerInfo.jsx`, `src/room/view/useRoomBoardView.js`, `src/shared/boardView.js`, `src/modals/house/HouseNestedDialogs.jsx`, `src/admin/AdminCharacters.jsx`, `src/shared/adminDrafts.js`.
- Likely effect/audio files: `src/room/boardSkillEffectRegistry.js`, `src/shared/skillPresentation.js`, `src/audio/skillEffectSounds.js`, `src/shared/musicLibrary.js`, `src/shared/preloadAssets.js`.
- Docs to update: `docs/system-design.md` or `docs/system-design/` corresponding skill/audio/UI sections, then run `npm run docs:system-design`.

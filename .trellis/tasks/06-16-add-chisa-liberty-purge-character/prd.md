# Add Chisa Liberty Purge Character

## Goal

Add 千咲 / Chisa as a new recruitable character using the provided portrait, and implement her active skill 虚湮解弦. The implementation must stay compatible with the current Go rules, hidden hand, neutral stones, protocol bans, ChangLi extra turns, skill preview, replay, and overclock accounting.

## Requirements

* Add character slug `chisa`, display name 千咲, English name Chisa, and portrait `/assets/characters/chisa.png`.
* Public acquisition method is 招募获得; before the recruitment system exists, administrators directly own `chisa`.
* Skill name is 虚湮解弦; `effectType` is `liberty-purge`; base overclock cost is 0; a successful skill consumes the turn.
* The target must be a legal normal-move empty point: valid, empty, not protocol-banned for the actor, not the current ko point, and not suicide under normal move rules.
* If the selected point is actually an opponent unexposed hidden hand, only reveal that hidden hand. Do not spend skill use, consume the turn, sweep one-liberty groups, or change overclock.
* On success, first place a real black or white stone by normal move semantics, without Nabomo color illusion. Normal captures resolve before the skill sweep.
* After normal move capture resolution, take one board snapshot and remove every group with exactly one liberty. This includes friendly, enemy, neutral spray, hidden-hand, and just-placed groups.
* Neutral spray stones count as non-friendly for Chisa overclock +1, but do not count toward either player's `skillRemovals`.
* Removed opponent black/white stones count toward Chisa side `skillRemovals` and overclock +1 each. Removed friendly black/white stones count by existing ownership rules toward the opponent side `skillRemovals` and overclock -1 each.
* Record raw overclock delta. The actual added overclock is `max(0, rawDelta)`. Base cost 0 still records a skill cost note.
* Successful skill resolution increments `moveNumber`, sets `passes = 0`, switches to the opponent, and clears `ko` to `null`.
* Keep defensive zero-liberty cleanup after the sweep, but those cleanup removals do not affect Chisa overclock.
* A successful Chisa action is a `type: "skill"` active skill history entry, so it unlocks opponent ChangLi.
* Removed positions leave independent temporary red-cross markers. These markers must not overwrite `skillEffect` or `protocolBan`.
* Red-cross markers clear when the opponent's next turn actually ends. Non-turn-consuming opponent skills do not clear them early.
* Standard mode follows the existing skill-disabled mode switch.
* Do not change the player-facing skill text to explain neutral stones.

## Acceptance Criteria

* [ ] Character catalog, public character list, and administrator asset rules include `chisa`.
* [ ] `liberty-purge` is registered in the skill catalog, skill normalization, server handler, preview, and replay paths.
* [ ] Server tests cover success, illegal occupied target, suicide, ko point, protocol ban, and hidden-hand reveal without spending.
* [ ] Server tests cover one-liberty snapshot removals for friendly, enemy, neutral, hidden-hand, and just-placed groups.
* [ ] Server tests cover raw/clamped overclock, `skillRemovals` ownership, turn consumption, `ko = null`, and ChangLi unlock.
* [ ] Frontend target preview does not highlight visible occupied points, protocol-banned points, or the current ko point; server remains authoritative for full legality.
* [ ] Red-cross markers render independently and clear after the opponent turn ends without covering protocol bans, erased points, or blast markers.
* [ ] Replay and skill preview show Chisa as a skill action, not a normal move.
* [ ] System design docs are updated and `docs/system-design.html` is regenerated.

## Definition of Done

* Tests added or updated for shared game logic, skill registry/config, character assets/admin ownership, and front-end marker behavior where applicable.
* Impacted lint/type/test commands run.
* `docs/system-design.md` or a relevant `docs/system-design/` chapter is updated, then `npm run docs:system-design` is run.
* Only files related to this task are included in this task's eventual commit.

## Technical Approach

Add a dedicated `liberty-purge` active skill handler. The handler should reuse or extract normal move legality and capture behavior enough to preserve hidden-hand reveal, protocol-ban, suicide, and ko semantics. After a successful normal move placement, it computes a one-liberty group snapshot, removes all snapshot groups, records detailed removal data, clears ko, and appends the skill history entry.

Red-cross markers should use an independent state field or collection, not the existing single-value `skillEffect`. Marker cleanup should be tied to real turn advancement after Chisa's opponent completes a turn.

## Decision (ADR-lite)

**Context**: Chisa combines legal normal move placement with skill-style global removal, which can collide with ko, suicide, hidden hands, neutral stones, and existing board marker state.

**Decision**: Treat Chisa as a dedicated skill type with legal-move semantics, one post-move snapshot sweep, neutral stones counted only for Chisa overclock, and independent temporary removal markers.

**Consequences**: The change needs new rule helpers and marker lifecycle plumbing, but it avoids corrupting existing `skillEffect`, `protocolBan`, replay, ChangLi, and standard-mode behavior.

## Out of Scope

* Full recruitment system.
* Player-facing wording change for neutral stones.
* Broad active-skill pipeline rewrite beyond minimal helper extraction.
* Changes to standard-mode skill disabling.

## Technical Notes

* Shared rule files: `src/shared/gameStoneActions.js`, `src/shared/gameSkillActions.js`, `src/shared/gameSkillState.js`, `src/shared/gameSkillHandlers.js`, `src/shared/gameSkills.js`, `src/shared/skillEffectCatalog.js`.
* Frontend files: `src/shared/boardView.js`, `src/room/Board.jsx`, `src/room/BoardSkillEffects.jsx`, `src/room/actions/useRoomPointActions.js`.
* Backend and asset files: `server/characters.js`, `server/userAssets.js`, `server/roomSkillResolution.js`, `server/skillRegistry.js`.

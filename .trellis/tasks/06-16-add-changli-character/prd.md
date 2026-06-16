# Add ChangLi Character

## Goal

Add ChangLi as a recruitable Go-themed character with a new active `double-move` skill. The skill must let the current player take up to two normal move opportunities after the opponent has successfully resolved an active skill, while preserving core Go legality, turn, timing, replay, reconnect, and admin ownership behavior.

## Requirements

- Add character `changli` / English name `ChangLi`, Chinese name `长离`, portrait `/assets/characters/changli.png`, acquisition method `招募获得`, and admin-default ownership while normal players remain locked until recruitment exists.
- Add active skill `double-move` / `谋定后动`, no target, confirmed by clicking anywhere on the board surface.
- Skill description: `发动后，本回合最多可以连续下 2 手。每一手均按普通落子规则逐手结算，也可以选择弃一手结束行动。该技能只有在对手成功发动过主动技能后才能发动。超频 3，发动技能不会消耗本回合。`
- The skill may be activated only after the opponent has successfully resolved an active skill in the current game. Passive skills, failed requests, invalid targets, and unconfirmed skills do not unlock it.
- The skill itself is an active skill and unlocks the opponent's ChangLi if both players use ChangLi.
- Standard mode disables the skill like all other skills.
- Skill confirmation follows the existing skill preview/banner/audio flow. For ChangLi only, reconnect during the preview should not replay the presentation; the restored room should proceed to the resolved double-move state.
- Skill resolution consumes the skill use, applies overclock cost 3, records skill history, and creates a public persisted `double-move` extra-turn state.
- The double-move state belongs to the current player, blocks opponent game actions, blocks any further skill activation, and survives disconnect/reconnect.
- During double-move, each successful normal move is fully validated and resolved as a normal move: captures, suicide, ko, protocol bans, hidden-hand reveal, passive color illusion, board marker cleanup, move number, pass reset, and timing refresh all apply.
- A move request that only reveals an opponent hidden hand does not count as one of the two moves and does not refresh timing.
- Illegal move requests do not consume a double-move opportunity and keep the state unchanged.
- `pass` is allowed before the first move or after the first move. It is a normal pass: it increments consecutive pass count, changes the turn, can trigger normal end-of-game flow, and clears the double-move state.
- If both double-move opportunities are used by successful moves, the turn changes to the opponent after the second move and the state clears.
- Timeout during double-move follows normal timeout loss behavior.
- Resign remains available during double-move; draw/counting requests must not be inserted as special actions during double-move.
- Both players see public toast progress for ChangLi's double-move state, such as first or second move progress.
- Copy the supplied image from `C:/codex/image/新建文件夹/changli.png` into `public/assets/characters/changli.png`.
- Update system design docs for the new character, skill effect, data model/runtime behavior, and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] ChangLi appears in built-in character catalog with the requested metadata, portrait, description, and skill.
- [ ] Admin users own ChangLi by default; non-admin users do not auto-own ChangLi and it is not sold as a shop item.
- [ ] `double-move` is listed in skill effect metadata, normalizes correctly, and can use board-surface confirmation without a point target.
- [ ] Server rejects ChangLi skill before the opponent successfully resolves an active skill and accepts it afterward.
- [ ] Passive skill activation does not unlock ChangLi.
- [ ] Skill preview resolution creates persisted public double-move state, costs 3 overclock, consumes one skill use, and does not change turn immediately.
- [ ] During double-move, two successful normal moves are legal and each refreshes timing; opponent actions and nested skills are rejected.
- [ ] Hidden-hand reveal and illegal move attempts do not consume a double-move opportunity.
- [ ] Pass during double-move follows normal pass behavior and clears double-move state.
- [ ] Reconnect after ChangLi preview restores directly to double-move state without replaying the presentation.
- [ ] Frontend allows board-surface confirmation, displays double-move progress toast to both players, and disables incompatible actions.
- [ ] Relevant shared/server/frontend tests cover unlock, pass, hidden hand, ko/legal move behavior where practical, reconnect state, and ownership.
- [ ] `docs/system-design.md`, relevant `docs/system-design/` chapter(s), and generated `docs/system-design.html` are updated.

## Definition of Done

- Tests added or updated for shared rules, server behavior, asset ownership, and frontend interaction helpers where affected.
- Lint/test commands appropriate to touched layers pass.
- System design docs and generated HTML are updated.
- Existing unrelated dirty files are preserved.

## Technical Approach

- Implement a generic `double-move` active skill effect and public game state, likely `extraTurn` or similar, owned by the player color.
- Track active-skill history on game state or derive it from history; use service-side validation for ChangLi's unlock condition.
- Extend normal move/pass processing so double-move state controls whether turn is retained, advanced, or cleared.
- Keep the existing active-skill preview pipeline, but add ChangLi-specific restore handling that resolves pending ChangLi presentation into extra-turn state on reconnect/hydration.
- Add board-surface confirmation support separately from point-target confirmation so ChangLi can confirm without a point id.

## Decision (ADR-lite)

Context: ChangLi adds a multi-action turn that can conflict with Go rules, existing active skills, hidden hands, protocol bans, pass/endgame, timing, and reconnect behavior.

Decision: Treat `double-move` as a server-owned, persisted active-skill extra-turn state. All resulting moves and passes use existing normal move/pass semantics, with only the turn-retention and opportunity-counting behavior layered on top.

Consequences: This preserves Go legality and service authority but touches shared game rules, server action flow, frontend confirmation/progress UI, tests, and system design docs.

## Out of Scope

- Building the recruitment system.
- Adding ChangLi to the shop or assigning a price.
- Changing global active-skill reconnect behavior for non-ChangLi skills.
- Adding character voice assets.

## Technical Notes

- Existing active skill types live in `src/shared/skillEffectCatalog.js`, `src/shared/gameSkills.js`, `src/shared/gameSkillHandlers.js`, and `src/shared/gameSkillActions.js`.
- Normal move/pass behavior is centered in `src/shared/gameStoneActions.js` and `src/shared/game.js`.
- Built-in character fallback data is in `src/shared/characterFallback.js`; admin ownership rules are covered by `server/userAssets.js` tests.
- Existing no-target board confirmation is used by Baconbits `random-blast` but still depends on valid points; ChangLi needs board-surface confirmation.
- Existing docs require every system-impacting SigrikaGo update to update `docs/system-design.md` and regenerate `docs/system-design.html`.

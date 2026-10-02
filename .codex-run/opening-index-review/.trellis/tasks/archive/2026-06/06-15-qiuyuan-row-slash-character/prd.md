# Add QiuYuan Row Slash Character

## Goal

Add the character QiuYuan / 仇远 as a sword user with the active skill “一斩足矣”. The skill targets any valid board intersection, removes all stones on that horizontal row, applies extra overclock based only on stones directly removed from the target row, consumes the turn, and leaves a public row-wide slash visual.

## Requirements

* Add character `qiuyuan` / English name `QiuYuan`, Chinese display name `仇远`, role flavor as a sword user.
* Use the provided portrait source `C:/codex/image/新建文件夹/chouyuan.png`; copy or convert it into the project character asset structure.
* Skill name: `一斩足矣`.
* Skill description: `指定棋盘上一枚棋子或交叉点，移除其所在行的所有棋子。每移除一枚棋子，超频+2`.
* Skill base cost is numeric overclock `0`; each directly removed target-row stone adds numeric overclock `+2` to the skill user.
* The skill has `uses: 1`; using it on an empty row is allowed and consumes the use.
* The skill consumes the current turn in all cases: switch turn, increment `moveNumber`, and reset `passes` to `0`.
* The target can be any currently valid board intersection, whether empty or occupied.
* Invalid erased intersections cannot be selected as the skill target.
* “所在行” means the horizontal row only, not a vertical column.
* Direct row removal removes black, white, spray neutral stones, and hidden-hand stones.
* Spray neutral stones directly removed by the row slash count for QiuYuan overclock `+2` each, but do not award black/white skill-removal credit.
* Black/white stones directly removed by the row slash award `skillRemovals` to the opposite player, following existing skill-removal accounting.
* Hidden-hand stones removed by the row slash are cleared directly without triggering the hidden-hand discovery notice.
* Nabomo color-illusion stones are removed and credited by their real stone color; `colorIllusion` is cleared with the stone.
* The skill clears current ko.
* After direct row removal, automatically clean up any no-liberty groups to keep the board legal.
* Automatic no-liberty cleanup remains counted as `skillRemovals` by existing ownership rules, but does not add QiuYuan overclock.
* Standard 19-line no-skill mode continues to block the skill.
* The skill target UI should allow every valid intersection and reject invalid erased intersections.
* Skill preview should show the targeted horizontal row.
* After resolution, show one continuous slash mark crossing the full row from outside the board edge to outside the opposite edge, not individual per-point cuts.
* The slash mark is public and visible to both players, spectators, and replay.
* The slash mark is visual-only and does not change point validity or restore erased points.
* The slash mark remains until the QiuYuan user next makes an ordinary move, matching the existing owner-cleared marker pattern.
* Acquisition text should be `部员招募获得`.
* Until the recruitment system exists, QiuYuan is visible/manageable as character data but ordinary players do not own or deploy him by default; admins own and may deploy him.

## Acceptance Criteria

* [ ] QiuYuan appears in the shared/server character catalog with the expected names, portrait, acquisition text, and skill metadata.
* [ ] Admin users can own/deploy QiuYuan by default; non-admin users do not receive him by default.
* [ ] QiuYuan cannot be used in standard no-skill mode.
* [ ] Skill can target any valid empty or occupied intersection, but rejects invalid erased intersections.
* [ ] Targeting an empty row consumes the skill, consumes the turn, increments move number, resets passes, clears ko, and adds 0 overclock.
* [ ] Targeting a row with black/white/spray/hidden/illusion stones removes the row stones, credits skill removals correctly, and adds `2 * direct row stones removed` overclock.
* [ ] Chain cleanup after the slash keeps the board free of no-liberty groups, credits skill removals, and does not add QiuYuan overclock.
* [ ] Hidden hands removed by the slash do not emit hidden-hand discovery notices.
* [ ] UI preview and resolved board effect render one continuous horizontal slash across the row.
* [ ] Slash visibility works for player views, spectators, and replay metadata.
* [ ] Tests cover shared rule behavior, skill registry/catalog behavior, server room preview metadata, and relevant frontend effect helpers.
* [ ] `docs/system-design.md` and the relevant `docs/system-design/` split document are updated, and `npm run docs:system-design` regenerates `docs/system-design.html`.

## Definition of Done

* Tests added or updated for the new skill, character, admin ownership, and visual metadata.
* Relevant lint/type/test commands run and reported.
* System design docs updated and HTML regenerated.
* Existing unrelated working tree changes preserved.

## Technical Approach

Add a new active skill effect type for QiuYuan rather than forcing it into `stone` or `empty-point`, because its target rule accepts any valid point. Implement the core mutation beside existing shared skill handlers so front-end and server share one rules engine. Reuse the existing `skillRemovals`, `skillCosts`, ko clearing, and owner-cleared marker patterns where possible, while separating direct row removal count from post-mutation cleanup count for QiuYuan overclock.

For UI, extend the skill target rule/catalog and room preview metadata so targetable valid points and row-wide preview/slash rendering are explicit. Store enough history/effect metadata for spectators and replay to recreate one continuous row slash.

## Decision (ADR-lite)

**Context**: Existing skills are point erase, stone flip, hidden move, random blast, spray neutral transform, and passive color illusion. QiuYuan combines any-valid-point targeting, row-wide direct removal, extra dynamic overclock, and a row visual.

**Decision**: Introduce a dedicated row-slash skill effect with explicit direct-removal accounting. Treat direct row removals as overclock-bearing and post-cleanup removals as non-overclock-bearing. Use row-wide public visual metadata rather than per-point visual cuts.

**Consequences**: The skill is more invasive than prior active skills and needs updates across rule execution, skill catalog, preview metadata, visual rendering, tests, and system design docs. It remains compatible with existing no-skill mode, ko reset, hidden hand, spray neutral, and color-illusion rules.

## Out of Scope

* Implementing the future “部员招募” recruitment system.
* Adding new voice lines or BGM for QiuYuan.
* Adding vertical column slash mode or direction selection.
* Rebalancing other characters.

## Technical Notes

* Existing shared rules live mainly in `src/shared/game.js`, `src/shared/gameSkillHandlers.js`, `src/shared/gameSkills.js`, `src/shared/skillEffectCatalog.js`, and `src/shared/characterFallback.js`.
* Server fallback skill conversion lives in `server/skillRegistry.js`.
* Room skill preview metadata lives in `server/roomSkillResolution.js`.
* Existing tests in `src/shared/game.test.js`, `src/shared/gameSkills.test.js`, `src/shared/skillEffectCatalog.test.js`, `src/shared/gameSkillHandlers.test.js`, `server/rooms.test.js`, and character/admin tests should guide coverage.
* Project instructions require updating system design docs for architecture/runtime/data/asset/theme behavior changes and running `npm run docs:system-design`.

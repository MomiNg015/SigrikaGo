# Add Lynae Spray Neutral Stone Skill

## Goal

Add Lynae (`lynae`) as a built-in character with the active skill "流光溢彩", and introduce a reusable neutral-stone rules foundation with "喷涂棋子" as the first neutral faction. The skill should transform selected and random stones into spray stones while preserving Go rule consistency, scoring clarity, replay determinism, and compatibility with existing character skills.

## Requirements

- Add built-in character Lynae:
  - Chinese name: 琳奈.
  - English/slug: Lynae / `lynae`.
  - Portrait path: `/assets/characters/lynae_centered.webp`, converted from `C:/codex/image/新建文件夹/linea1_imagegen_centered_640.png`.
  - Acquisition: automatically available after first reaching 5 dan in Spark mode; admins can own/use Lynae regardless of rank.
  - Skill name: 流光溢彩.
  - Skill is an active, turn-consuming skill.
  - Skill displays "超频 2" and applies an actual numeric scoring cost of 4.
- Register "流光溢彩" as a reusable configurable skill effect, not only as hard-coded Lynae behavior.
- Introduce a reusable neutral-stone rules model:
  - Spray stone is the first neutral stone faction.
  - Same named neutral stones belong to the same faction.
  - Same faction stones connect into groups; different factions block liberties.
  - Normal play may capture adjacent libertyless neutral groups, and captured neutral stones do not count as black/white capture or skill-removal收益.
  - Normal play may capture spray stones to avoid suicide.
- Lynae skill targeting:
  - Manual target can be any stone except spray stones and hidden-hand stones.
  - Manual target may be black, white, or a future non-spray neutral stone.
  - Random target pool is any other stone except spray stones and hidden-hand stones.
  - Random target excludes the manual target.
  - If no random target exists, only the manual target is transformed.
- Lynae skill resolution:
  - Determine both targets first, transform them simultaneously, then repeatedly clear libertyless groups until stable.
  - Black-to-spray immediately grants white +1 skill-removal/除子收益.
  - White-to-spray immediately grants black +1 skill-removal/除子收益.
  - Other neutral-to-spray grants no black/white收益.
  - Neutral groups cleared during post-transform cleanup grant no black/white收益.
  - The skill may backfire and remove the caster's own groups during cleanup.
  - The skill clears the current ko point and does not create a new ko point.
  - The skill is allowed only during the playing phase and only on the caster's turn.
- Existing skill interactions:
  - Nabomo disguise: Lynae acts on the real board; transformed stones clear disguise.
  - Aemeath hidden hand: hidden-hand stones cannot be manual or random targets.
  - Denia flip: Denia can target only black/white stones, not spray stones or other neutral stones.
  - Baconbits random blast: blast removes spray/other neutral stones, but neutral removals grant no black/white收益.
- Scoring and counting:
  - Spray stones do not count as black or white stones.
  - Spray stones participate as territory boundaries; regions bordered by spray or multiple factions are neutral.
  - During dead-stone confirmation, spray/other neutral stones may be marked dead.
  - Marked neutral dead stones are temporarily removed for scoring and grant no black/white收益.
  - Territory exposed after neutral dead stones are removed is scored normally.
- History/messages/replay:
  - System messages and history expose manual and random target coordinates.
  - If random target is absent, the message/history must make that clear.
  - History must persist manual target, random target or null, before/after factions, immediate收益, and cleanup removals so replay/debugging is deterministic.
- Visual behavior:
  - Spray stones use an independent fixed visual and must not use either player's selected stone decoration.
  - Before the final image asset exists, use the reserved resource path with a CSS fallback/placeholder.
- Documentation:
  - Update `docs/system-design.md` or the matching `docs/system-design/` section for architecture/rules changes.
  - Run `npm run docs:system-design` after documentation changes.

## Acceptance Criteria

- [ ] Lynae appears as a built-in character with the correct name, slug, portrait path, acquisition method, skill, and cost semantics.
- [ ] The skill effect appears in shared skill effect registration and passes server character validation.
- [ ] Unit tests cover Lynae target selection, one-target fallback, simultaneous transform, immediate black/white收益, cleanup, ko clearing, turn consumption, disguise clearing, hidden-hand exclusion, Denia exclusion, Baconbits neutral removal, scoring, and neutral dead marking.
- [ ] Existing black/white rules still pass for capture, suicide, ko, Denia, Baconbits, Nabomo, and Aemeath.
- [ ] Spray stones render with an independent visual/fallback and do not inherit player stone decorations.
- [ ] System design docs and generated HTML are updated.
- [ ] Project lint/type/test checks used for this change pass or any remaining failures are documented.

## Definition of Done

- Tests added or updated for rule, skill, scoring, and rendering behavior.
- Lint/type-check/test commands run as appropriate.
- Documentation updated and generated via `npm run docs:system-design`.
- No unrelated user changes reverted.

## Technical Approach

Implement neutral stones through shared helpers instead of spray-specific checks scattered through the codebase. Existing group collection can continue using `point.stone` equality for connectivity, but all ownership, capture收益, scoring ownership, target validation, and color-label logic must stop assuming every non-black stone is white.

Add a new active skill handler for Lynae's spray transform. It should select both targets before mutation, record target metadata, apply immediate black/white收益 only for black/white sources, clear incompatible point state such as color illusion, transform stones to the spray faction, then run a multi-faction cleanup loop. Cleanup should remove all libertyless groups until stable and award black/white收益 only when removed groups are player stones.

Scoring should count only player colors as stones, treat neutral stone factions as blocking boundary colors, allow neutral dead stones to be marked and temporarily removed without assigning dead-stone ownership, and then compute territory from the resulting board.

## Decision (ADR-lite)

Context: Lynae introduces a board-resident neutral stone type, which conflicts with the current two-color assumptions in opponent lookup, capture bookkeeping, scoring, existing skills, and visuals.

Decision: Build a minimal reusable neutral-stone model and make spray stone its first faction. Lynae, Denia, Baconbits, scoring, dead marking, and rendering should use shared player-color/neutral-stone helpers.

Consequences: The change touches more files than a single character addition, but avoids repeating fragile spray-specific conditionals and keeps future neutral factions feasible.

## Out of Scope

- Final spray-stone image asset creation; this task reserves/falls back until the user supplies the image.
- Additional neutral stone types beyond spray.
- New voice/audio assets for Lynae.
- Balance changes to other character skills beyond required compatibility rules.

## Technical Notes

- Core files inspected during requirements discovery:
  - `src/shared/gameConstants.js`: black/white constants and current two-color `opponent()`.
  - `src/shared/gameGroups.js`: group collection already connects stones by exact `point.stone`.
  - `src/shared/game.js`: play, mutation skills, capture cleanup, ko, hidden hand, skill cost.
  - `src/shared/gameScoring.js`: scoring and dead marking currently assume black/white ownership.
  - `src/shared/gameSkills.js`, `src/shared/gameSkillHandlers.js`, `src/shared/skillEffectCatalog.js`: skill normalization and handler dispatch.
  - `src/shared/characterFallback.js`, `server/characters.js`: built-in character and server validation paths.
  - `src/styles/room/board.css`: board stone rendering and neutral scoring marks.

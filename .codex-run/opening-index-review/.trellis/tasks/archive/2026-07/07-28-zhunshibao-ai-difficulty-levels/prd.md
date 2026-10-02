# Add Three Zhunshibao AI Difficulty Levels

## Goal

Turn Zhunshibao practice from one visible low-intelligence quick-start experience into three player-selectable tiers: beginner, intermediate, and advanced. Use the mature GNU Go engine for all move selection while preserving SigrikaGo's authoritative Spark rules and fitting a 2-core, 2 GB, CPU-only server.

## What I Already Know

- The user explicitly chose three tiers: 入门、中级、高级.
- Before this task, the visible entry directly started one fixed quick-practice configuration, so the player could not choose difficulty.
- The shared contract currently contains `beginner` and `basic`, while the visible entry always starts `basic`.
- The first implementation added custom one-ply, tactical, and UCT policies, but the user explicitly rejected maintaining a homemade Go engine.
- Practice automation already uses the bot's `gameViewForColor()` and submits the selected action through the normal authoritative game-action path.
- Spark uses a 13x13 board and supports non-standard skill state, so a standard Go engine cannot be the final rules authority.
- The deployment target has only 2 CPU cores, 2 GB RAM, and no GPU.

## Requirements

- Provide exactly three visible tiers: 入门、中级、高级.
- Clicking the existing Zhunshibao entry opens a compact three-tier selection modal.
- Choosing a tier immediately starts practice with random player color; the modal does not add a separate color-selection step.
- All newly created tiers use the same 22-stone ordinary-capture victory threshold so tier strength measures decision quality rather than a different win rule.
- Restored legacy practice rooms retain compatibility with their persisted threshold semantics.
- Preserve server-authoritative move validation and practice-room lifecycle.
- Use GNU Go for beginner, intermediate, and advanced at engine levels 1, 5, and 10 respectively.
- Run GNU Go as a local child process through GTP; do not connect to an internet service and do not require a GPU.
- Serialize only the bot-visible black/white position and restrict the engine to points that Spark's authoritative `playMove()` currently accepts.
- Allow only one GNU Go process at a time so practice cannot consume both production CPU cores.
- Use bounded per-tier process timeouts and an 8 MB engine cache.
- A busy engine slot retries on the room's next natural schedule. Missing, timed-out, failed, or invalid engine output must never fall back to a homemade move.
- Reject new practice rooms explicitly when the configured GNU Go executable is unavailable.
- Keep tier parameters configuration-driven so future tiers can extend the contract without rewriting selection or automation flow.
- Stronger levels are relative product tiers and do not claim official kyu/dan rank.
- Zhunshibao remains a characterless bot with no skill of its own.

## Acceptance Criteria

- [x] Players can intentionally select each of the three difficulty tiers.
- [x] Opening and dismissing the tier selector preserves the surrounding match-mode modal behavior and keyboard accessibility.
- [x] The socket contract accepts exactly the three supported tier IDs and rejects invalid values.
- [x] New beginner, intermediate, and advanced rooms all announce and enforce the same 22-stone ordinary-capture threshold.
- [x] All three public tiers call GNU Go with distinct levels 1, 5, and 10.
- [x] The adapter sends only the bot-visible SGF position and a Spark-legal GTP vertex whitelist.
- [x] Engine output is converted back to a legal Spark point and revalidated before submission.
- [x] Concurrent practice requests cannot consume both production CPU cores or queue an unbounded backlog.
- [x] All selected bot moves still pass through the authoritative action handler.
- [x] Engine unavailability is reported before room creation; repeated in-room failures end cleanly without homemade fallback.
- [x] Tests cover tier selection, validation, engine levels, visible SGF conversion, legal-point restriction, failure behavior, and restored room behavior.
- [x] Existing `beginner` / `basic` persisted room values remain restorable through explicit compatibility mapping.
- [x] System design documentation and generated HTML reflect the new runtime behavior.

## Definition of Done

- Tests added or updated for shared config, UI, socket validation, automation, and decision behavior.
- Relevant lint, tests, build, and broad repository checks pass.
- `docs/system-design.md` and the relevant system-design chapter are updated.
- `npm run docs:system-design` regenerates `docs/system-design.html`.
- GNU Go installation, resource limits, failure behavior, and production preflight are documented.

## Out of Scope

- KataGo, Pachi, Fuego, or an internet-hosted engine service.
- Training a neural network.
- Giving Zhunshibao a character skill.
- Claiming official kyu/dan ranks for the three tiers.
- Remembering the player's last selected difficulty.
- Adding admin dashboards, analytics, or persistent metrics for AI search.
- Simulating hypothetical future opponent skill activations inside the initial search rollout.
- Mobile treatment for the admin console.

## Research References

- [`research/classic-go-ai-options.md`](research/classic-go-ai-options.md) — records the earlier classic-engine comparison.
- [`research/gnu-go-engine-integration.md`](research/gnu-go-engine-integration.md) — records the final GNU Go choice, supported protocol features, package footprint, and Spark adapter boundary.

## Technical Notes

- `src/shared/practiceMode.js` owns tier IDs, labels, delays, choice width, randomness, and capture thresholds.
- `src/home/HomeScreen.jsx` renders the three-level nested selector and dispatches the selected public difficulty with random player color.
- `server/socketPracticeEvents.js` validates new requests through `requestedPracticeDifficulty()`; `practiceDifficulty()` retains the persisted `basic` compatibility alias.
- `server/practiceRoomAutomation.js` schedules and executes bot actions.
- `server/practiceBotEngine.js` owns GNU Go probing, visible-position SGF serialization, Spark-legal vertex restriction, GTP process execution, coordinate conversion, and the one-process global slot.
- `server/practiceBotDecision.js` retains only the conservative Spark-specific dead-group helper used during scoring; it does not choose moves.

## Decision (ADR-lite)

**Context**: The existing Zhunshibao image button immediately starts one fixed quick-practice configuration, but three visible tiers require an intentional player choice.

**Decision**: Clicking the existing entry opens a compact modal with 入门、中级、高级. Selecting a tier starts immediately with random player color.

**Consequences**: The entry gains one deliberate click while avoiding three cramped buttons and avoiding an additional color-choice step.

### Shared capture threshold

**Context**: Varying the capture target would make a higher tier harder partly because of a different win condition rather than stronger play.

**Decision**: All three newly created tiers use a 22-stone ordinary-capture threshold.

**Consequences**: Tier comparisons are clearer. Persisted legacy rooms remain readable and retain their historical compatibility behavior.

### Mature engine boundary

**Context**: The custom heuristic and UCT tiers did not create a trustworthy strength gap, while the production host has only 2 CPU cores and Spark contains non-standard skill state.

**Decision**: All tiers use the locally installed GNU Go 3.8 engine through GTP at levels 1, 5, and 10. The adapter loads a visible SGF setup position and calls `restricted_genmove` with the authoritative legal-point whitelist. One process may run globally; busy rooms retry, while unavailable or invalid engines never fall back to local move heuristics.

**Consequences**: Strength comes from a mature engine, the Node event loop remains free, and Spark retains final authority. Operators must install GNU Go and pass the production preflight.

### MVP scope

**Context**: Remembering the last tier and adding admin search metrics are useful adjacent features but do not improve the core three-tier practice experience.

**Decision**: The MVP includes three configurable GNU Go tiers and explicit engine failure behavior only.

**Consequences**: Persistence and admin observability remain explicitly out of scope, keeping implementation focused on player-visible choice and decision quality.

## Technical Approach

1. Replace the single fixed quick-start constant with a three-tier public configuration while retaining compatibility aliases for restored `beginner` / `basic` rooms.
2. Add an accessible compact difficulty modal owned by the match-mode picker. Selecting 入门、中级、高级 starts random-color practice and closes the picker flow safely.
3. Replace all move-selection policies with a GNU Go GTP adapter configured at levels 1, 5, and 10.
4. Serialize `gameViewForColor()` to an SGF setup position and generate an authoritative `playMove()` legal-point whitelist for `restricted_genmove`.
5. Keep one global child-process slot, bounded tier timeouts, executable probing, and explicit failure handling without homemade fallback.
6. Keep the authoritative room/action path unchanged and retain only Spark-specific scoring assistance outside the move engine.
7. Update deployment prerequisites, socket validation, room projection/restoration compatibility, opening copy, tests, system design source, and generated HTML.

## Implementation Plan

- PR1-equivalent change group: shared three-tier contract, compatibility mapping, socket/room tests, and difficulty-selector UI.
- PR2-equivalent change group: GNU Go GTP adapter, three engine levels, authoritative legal-point restriction, and process isolation.
- PR3-equivalent change group: engine availability/failure behavior, deployment preflight, integration tests, docs, and full validation.

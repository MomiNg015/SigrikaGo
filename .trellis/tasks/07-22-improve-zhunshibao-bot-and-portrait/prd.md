# Improve Zhunshibao practice bot and portrait

## Goal

Correct the visibly poor, line-building behavior of the lightweight Spark practice bot using established computer-Go heuristics, and replace the temporary “准” placeholder with the supplied Zhunshibao robot as a production portrait.

## Requirements

- Keep the practice opponent server-authoritative, deterministic under an injected random source, limited to 48 evaluated candidates, and restricted to its own `gameViewForColor`.
- Generate candidates by reason priority so urgent liberties, the latest local fight, opening points, and meaningful shapes cannot be crowded out by generic adjacency.
- Evaluate objective move reasons including capture, defense/escape, attack, connection/cut/contact, liberties, opening/influence, and explicit antisuji penalties.
- Add bounded one-ply tactical safety from the simulated result: detect immediately capturable own groups and reject or strongly penalize non-tactical self-atari and hanging groups.
- Add compact local shape rules that discourage non-tactical early straight-line extension and empty triangles while rewarding diagonal support, one-point jumps, contact/cuts, and connecting distinct groups.
- Beginner randomness may vary among plausible moves but must not choose uniformly from all legal candidates.
- The first two ordinary Zhunshibao moves prefer two distinct corner star points unless a higher-priority immediate capture or escape exists.
- Low-value moves may cause a pass only near the actual endgame (`empty valid points <= max(8, floor(valid points * 0.12))`); elapsed move count must not cause midgame passes.
- Preserve the existing beginner/basic delays, capture-resignation thresholds, scoring flow, persistence, no-record policy, and no-skill behavior.
- Turn the supplied robot image into a transparent project asset while preserving the robot identity and use it for Zhunshibao's player portrait on desktop and portrait mobile layouts.
- Render the bot portrait through the same portrait-frame geometry and image dimensions as an ordinary player character; do not reuse the tutorial no-character frame or add a bot-only scale.
- Convert the supplied `准时宝陪练` banner to an alpha-preserving WebP and replace the Spark practice text entry with that image while keeping the entry a smaller sibling native button absolutely anchored to the title's upper-right, with its centerline on the Spark card's top border and no title overlap.
- Give the banner an alpha-following drop shadow and a restrained `3deg` clockwise hover rotation, with the transform disabled under reduced-motion preference.
- Clicking the banner starts practice immediately with `difficulty: "basic"` and `playerColor: "random"`; remove the intermediate practice settings window while keeping the wider socket contract available for future callers.
- In the practice opening-color modal, show a red `吃掉准时宝22颗棋子就算胜利！` line directly below the player's black/white assignment; keep the copy absent from ordinary games and resolve restored rooms from their persisted difficulty threshold.
- Preserve ordinary `PlayerInfo` geometry for Zhunshibao by reserving the otherwise missing rating and skill tracks with the existing invisible placeholders.
- Keep Zhunshibao without a playable character or skill; the portrait is bot presentation metadata, not a new character catalog entry.

## Acceptance Criteria

- [ ] Seeded decisions remain reproducible and evaluate no more than 48 candidates.
- [ ] Hidden-hand location changes that are invisible to Zhunshibao cannot change its decision.
- [ ] Immediate capture and escape moves outrank remote shape moves.
- [ ] Zhunshibao's first two ordinary moves occupy two different corner star points.
- [ ] A uniformly low-valued candidate set does not pass in the middle game and may pass only inside the explicit endgame empty-point threshold.
- [ ] A non-tactical third/fourth early straight-line extension loses to a plausible opening/local-shape move.
- [ ] Beginner random selection remains inside a bounded plausible score band.
- [ ] Existing practice automation, thresholds, resume, scoring, and no-progression tests remain green.
- [ ] The generated transparent portrait has an alpha channel, transparent corners, and no visible chroma fringe.
- [ ] PlayerInfo renders the bot portrait from safe practice metadata and retains accessible alt/label text.
- [ ] PlayerInfo omits the tutorial `.no-character` portrait layout when bot artwork exists and uses the ordinary desktop `--side-portrait` plus portrait-mobile `46px` dimensions.
- [ ] The practice entry renders the exact `1500 x 600` transparent WebP, retains the accessible name `准时宝陪练`, and hangs immediately to the title's upper-right with explicit desktop/mobile anchors plus Bright School button-chrome resets.
- [ ] The practice entry has an alpha-following depth shadow, rotates clockwise by `3deg` on hover, and removes the transform under reduced-motion preference.
- [ ] Clicking `准时宝陪练` closes the mode picker and sends exactly `{ difficulty: "basic", playerColor: "random" }` without rendering another settings surface.
- [ ] The basic practice opening modal shows the red 22-capture victory line below `本局你执黑/白`, while ordinary games show no practice rule.
- [ ] Zhunshibao's desktop and portrait-mobile player card keeps the same metadata and skill tracks as an ordinary character card, without showing a fake rating or skill.
- [ ] Relevant system design and practice-room contract documentation describe the revised policy and portrait asset.

## Definition of Done

- Focused decision, automation, room-view, PlayerInfo, CSS-contract, and docs tests pass.
- `npm run check`, `npm run verify:capacity`, and `npm run docs:system-design` pass.
- Final visual acceptance is left to the user as requested.

## Technical Approach

Use a reason-first heuristic policy inspired by GNU Go and Pachi rather than adding MCTS. Candidate simulation continues through `playMove`; post-move group analysis supplies shallow tactical safety, while local 3x3 geometry and coarse opening influence prevent mechanical line play. The supplied portrait image is edited to a flat magenta key, converted locally to alpha, saved under `public/assets/characters/`, and exposed through the existing `botProfile` room-view field. The separately supplied practice banner is converted losslessly to WebP under `public/assets/home/` without changing its existing alpha channel and is rendered as decorative content inside the accessible practice-entry button.

## Decision (ADR-lite)

**Context**: The first implementation treated beginner weakness as broad randomness and used a flat one-ply score, producing visibly non-Go-like shapes.

**Decision**: Adopt ordered move reasons plus shallow tactical safety and compact shape/influence heuristics. Randomness only breaks ties among plausible moves. Use the provided robot as presentation metadata rather than inventing a character/skill record.

**Consequences**: The bot remains intentionally weak and inexpensive, but avoids obvious nonsense. It still will not perform ladder, life-and-death, joseki, or full-board search and should not be represented as a strong Go engine.

## Out of Scope

- MCTS/UCT, neural networks, GPU inference, external engines, GTP processes, or third-party AI libraries.
- Full joseki database, ladder reading, semeai search, or accurate global win-rate estimation.
- Adding Zhunshibao to the character catalog, recruitment, inventory, social, or progression systems.
- Final visual approval; the user will perform it.

## Research References

- [Lightweight Go bot research](research/lightweight-go-bot.md)

## Technical Notes

- Primary logic: `server/practiceBotDecision.js` and its tests.
- Bot metadata: `src/shared/practiceMode.js`, `server/roomFactory.js`, `server/roomView.js`.
- Portrait consumer: `src/room/PlayerInfo.jsx` and the player-card stylesheet.
- Practice entry: `src/home/HomeScreen.jsx`, match-mode desktop/mobile CSS owners, and `public/assets/home/home-practice-zhunshibao.webp`.
- Quick-start defaults are centralized in `src/shared/practiceMode.js`; `PlayerInfo` reuses the tutorial no-character placeholder mechanism to keep practice-bot card geometry stable.
- The current branch contains unrelated Aemeath/Board WIP that must remain excluded from this task's commits.
- The user's explicit two-part directive is treated as confirmation of this scoped correction; no blocking product choice remains.

# Lightweight Go bot research

## Sources

- GNU Go move generation: https://www.gnu.org/software/gnugo/gnugo_6.html
- GNU Go engine overview: https://www.gnu.org/software/gnugo/gnugo_4.html
- Pachi project overview: https://pachi.or.cz/
- Pachi technical report: https://pasky.or.cz/go/pachi-tr.pdf

## Findings

GNU Go documents why independently assigning fixed values from several move generators became difficult to tune. Its later design first records objective move reasons (attack, defend, connect, cut, eye, territory, antisuji), then values candidates centrally. It also performs bounded tactical reading for weak groups before strategic valuation instead of relying on full-board lookahead.

Pachi's lightweight playout policy is deliberately semi-random rather than uniformly random. It gives priority to local replies near the latest move, capturing a group placed in atari, escaping or counter-capturing when its own group is in atari, attacking groups reduced to two liberties, 3x3 shape matches, and filtering bad self-atari. Its report shows capture and local 3x3 pattern heuristics are especially important to playing strength.

## Mapping to SigrikaGo

- Keep the existing 48-candidate and no-external-service constraints.
- Replace the flat additive behavior with explicit reason tiers: urgent capture/defense first, then local reply, cut/contact/shape, opening/influence, and fallback.
- Simulate every candidate through the existing immutable `playMove` rule path, then inspect the resulting groups for immediate tactical liability. No hidden authoritative state is required.
- Reserve candidates for opening star/corner points before filling the budget with every neighbor of every stone.
- Use a compact 3x3-style shape score: reward contact, diagonal support, one-point jumps, cuts, and multi-group connection; penalize self-atari, own-eye filling, empty triangles, and non-tactical early straight-line extension.
- Beginner randomness should select among plausible candidates, never across the entire legal board. Difficulty remains a choice-pool/noise difference, not permission to make nonsensical moves.
- Do not add MCTS in this correction. A useful MCTS needs playout policy, time budgeting, and careful shared-process capacity control; the research shows the local tactical/shape policy is valuable even inside stronger engines and fits this server's constraints.

## Expected correction

The current implementation fills the 48-slot candidate set with generic stone neighbors before strategic points and scores liberties/center without opponent-response or bad-shape checks. This creates mechanical adjacency and line-extension behavior. Reordering candidate reasons and adding post-move tactical/shape evaluation directly addresses that failure without adding GPU, model, dependency, or service cost.

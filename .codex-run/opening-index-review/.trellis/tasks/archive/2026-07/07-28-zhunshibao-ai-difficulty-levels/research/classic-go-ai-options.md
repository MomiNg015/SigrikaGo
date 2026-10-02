# Classic Go AI options for Zhunshibao

## Question

Which pre-neural Go AI techniques fit SigrikaGo's 13x13 Spark rules and a 2-core, 2 GB, CPU-only production server?

## Comparable approaches

### GNU Go

- Uses explicit Go knowledge, patterns, influence, life-and-death reading, and tactical search.
- Supports GTP, arbitrary supported board sizes, and runtime `--level` strength/speed control.
- Its documented default cache is roughly 8-11 MB and can be capped explicitly.
- It is lightweight, but it only understands standard Go and cannot model Spark skills, hidden stones, color illusions, or erased intersections.

Primary references:

- https://www.gnu.org/software/gnugo/gnugo_2.html
- https://www.gnu.org/software/gnugo/gnugo_3.html

### Pachi

- Uses UCT Monte Carlo tree search with RAVE, 3x3 patterns, and tactical checks.
- Supports fixed playout budgets, one-thread operation, and bounded tree memory.
- The no-DCNN engine avoids neural-model memory but still consumes meaningful CPU per move.
- Like GNU Go, it assumes standard Go state and cannot authoritatively simulate Spark skills.

Primary reference:

- https://github.com/pasky/pachi

### Fuego

- Provides a mature reference implementation of Monte Carlo tree search for Go.
- Useful as an algorithmic reference, but it is older and heavier to integrate than building a narrow search adapter around SigrikaGo's existing game state.

Primary references:

- https://fuego.sourceforge.net/
- https://fuego.sourceforge.net/fuego-doc-1.1/gouct-doc/index.html

## Repository constraints

- Spark is a 13x13 Go-family mode with skills enabled.
- Practice decisions already receive `gameViewForColor()`, generate at most 48 candidates, and validate moves through the shared authoritative `playMove()`.
- The existing evaluator already covers captures, escapes, attacks, connections, cuts, local replies, opening influence, self-atari, eye filling, and simple shape penalties.
- Practice automation runs inside the Node server process, so unbounded synchronous search would threaten real-time room handling.
- The production host is only 2 cores / 2 GB with no GPU.

## Feasible approaches

### A. Rule-native tactical search plus bounded MCTS (recommended)

Keep the current candidate/evaluation layer as the beginner policy. Add deterministic shallow opponent-response search for the middle tier and a bounded MCTS/UCT layer for the high tier, always using SigrikaGo's own `playMove()` and visible bot view.

Pros:

- Understands current Spark legality and erased intersections.
- Reuses the existing evaluator instead of restarting from zero.
- No external binary, model, or runtime license packaging.
- Difficulty can be controlled by depth, candidate width, playout budget, and small bounded noise.

Cons:

- Requires implementation and calibration.
- Search must run off the main event loop or be aggressively time-sliced.
- Opponent future skill choices still need an explicit approximation or remain outside the initial MVP.

### B. GNU Go advisor with authoritative filtering

Run GNU Go locally and use its move as one candidate, falling back to the current bot when the projected board is incompatible.

Pros:

- Very light and fast to prototype.
- Established Go knowledge and built-in levels.

Cons:

- Intelligence becomes inconsistent after Spark skill effects.
- Level numbers are not calibrated ranks.
- Adds a binary/process dependency and license review.

### C. Pachi advisor with capped playouts

Run one no-DCNN Pachi process with fixed playout counts and bounded tree memory.

Pros:

- Stronger global standard-Go play than a purely handcrafted one-ply evaluator.
- Natural strength control through fixed simulation budgets.

Cons:

- More CPU pressure than GNU Go.
- Still cannot simulate Spark rules.
- Adds a binary/process dependency and license review.

## Recommendation

Use approach A for the three production tiers:

- Beginner: current one-ply candidate scorer with plausible randomness.
- Intermediate: shallow tactical reply search over a pruned candidate set.
- Advanced: the same tactical layer plus bounded MCTS/UCT in an isolated worker, with strict timeout and deterministic fallback.

Use GNU Go or Pachi later as offline benchmark opponents, not as production rule authorities.

# GNU Go Engine Integration

## Decision

Use the server-local GNU Go 3.8 executable for every Zhunshibao move. Map the public tiers to GNU Go levels 1, 5, and 10. Do not retain the custom beginner, tactical, or UCT move selectors as fallbacks.

## Why GNU Go

- GNU Go is a mature pre-neural engine designed for CPU play.
- GNU Go supports arbitrary board sizes, komi, SGF loading, GTP, and runtime levels up to 10.
- The GNU Go manual states that lower levels trade reading accuracy for speed, which provides a stable built-in tier control.
- Its private GTP `restricted_genmove` command selects from a caller-provided vertex list. SigrikaGo can therefore keep Spark legality authoritative even when skills create states the standard engine cannot represent.
- Ubuntu 24.04 provides `gnugo 3.8-11build2`; the amd64 package installs to about 9.6 MB, which fits the 2-core, 2 GB host without a GPU.

## Runtime Boundary

1. Probe the configured executable with `gnugo --version` before creating a practice room.
2. Take `gameViewForColor(botColor)`, never the hidden authoritative board.
3. Serialize only visible black and white stones into an SGF root setup position with size 13, komi 2.75, and Chinese rules.
4. Enumerate legal points with the real Spark `playMove()` function.
5. Start one GNU Go GTP process, load the SGF, and call `restricted_genmove` with only those legal GTP vertices.
6. Convert the returned vertex to a Spark point id and revalidate before `handleGameAction`.
7. Allow one engine process globally. Busy rooms retry later; engine failure never triggers a homemade move.

## Known Approximation

GNU Go evaluates a standard black/white Go position. Neutral spray stones and invalid points cannot be represented as ordinary GNU Go stones, while hidden hands and color illusions must remain viewer-dependent. The legal-point whitelist prevents illegal output, but strategic evaluation around these Spark-only effects is necessarily approximate. The SigrikaGo rules engine remains final authority.

## Primary Sources

- GNU Go command-line levels, board size, komi, and SGF input: https://www.gnu.org/software/gnugo/gnugo_3.html
- GNU Go GTP mode, `level`, `loadsgf`, and `restricted_genmove`: https://www.gnu.org/software/gnugo/gnugo_19.html
- Ubuntu 24.04 GNU Go package and installed footprint: https://packages.ubuntu.com/noble/gnugo

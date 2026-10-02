# GNU Go 3.8 browser distribution

This directory distributes GNU Go 3.8 compiled to WebAssembly with Emscripten
4.0.10. GNU Go is licensed under GPL version 3 or later; see `COPYING.txt`.
The original source archive, exact build script (including local patches), and
SHA-256 manifest are served alongside the executable, without authentication.

Source: https://ftp.gnu.org/gnu/gnugo/gnugo-3.8.tar.gz

To rebuild in the SigrikaGo source tree:

```sh
python scripts/build-practice-wasm.py --emsdk /path/to/emsdk
npm run verify:practice-wasm
npm run test:e2e:practice
```

Install/activate Emscripten 4.0.10 in that SDK first. The builder requires Python
3.12+ and Node.js. No host C compiler is needed: the upstream pattern generators
are compiled to WASM and run under Node. For a standalone reconstruction, place
the provided `build-practice-wasm.py` in a `scripts/` folder of an empty directory;
it downloads the checksum-pinned archive and produces `public/engines/gnugo-3.8/`.
An offline build can place the provided archive in `.codex-run/practice-local/`.

SigrikaGo modifications, 2026-09-26:

- Generate a POSIX/WASM `config.h` from upstream `config.vc` (no terminal/socket).
- Change the two tentative `meaningless_*_moves` header definitions to extern,
  with one definition in `engine/unconditional.c` for modern linker compatibility.
- Return immediately from `gg_sort` for fewer than two entries, avoiding upstream
  pointer underflow undefined behavior that fails with current LLVM/WASM.

The search algorithm and pattern databases are otherwise unchanged. Calls use
the upstream GTP `loadsgf` and `restricted_genmove` interface. Each search receives
a fresh instance with 8 MB GNU Go cache, 64 MB initial linear memory (256 MB cap),
level 5 or 10 and `--never-resign`. The shared compiled module is reused.
Browser watchdogs terminate the Worker if a call stalls. Build scripts use
`DYNAMIC_EXECUTION=0`; CSP needs `wasm-unsafe-eval`, not JavaScript `unsafe-eval`.

Deploy this directory with the application. Do not deploy only the WASM binary
without its license, corresponding source and build instructions. Changes to
the engine require rebuilding the manifest and bumping `LOCAL_PRACTICE_VERSION`.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import factory from "../public/engines/gnugo-3.8/gnugo.js";
import { runGnuGo } from "../src/practice/gnuGoWasm.js";
import { createGameState, gameViewForColor, playMove } from "../src/shared/game.js";
import { legalPracticeGtpVertices, serializePracticePositionToSgf } from "../src/shared/practiceBotPosition.js";
import { practiceDifficulty } from "../src/shared/practiceMode.js";
import { createPracticeBotEngine } from "../server/practiceBotEngine.js";

const bytes = await readFile(new URL("../public/engines/gnugo-3.8/gnugo.wasm", import.meta.url));
const manifest = JSON.parse(await readFile(new URL("../public/engines/gnugo-3.8/manifest.json", import.meta.url)));
assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.sha256["gnugo.wasm"]);
const compiled = await WebAssembly.compile(bytes);
const native = createPracticeBotEngine();
const nativeAvailable = !process.argv.includes("--wasm-only") && (await native.ensureAvailable()).ok;
let game = createGameState([{ userId: "b", color: "black" }, { userId: "w", color: "white" }]);
game.phase = "playing";
const cases = [{ name: "empty", game }];
let seed = 42;
for (let i = 0; i < 70; i += 1) {
  const candidates = game.points.filter((p) => p.valid && !p.stone);
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  for (let offset = 0; offset < candidates.length; offset += 1) {
    const point = candidates[(seed + offset) % candidates.length];
    const next = playMove(game, game.turn, point.id);
    if (next.ok) { game = next.state; break; }
  }
  if (i === 19 || i === 69) cases.push({ name: `position-${i + 1}`, game });
}
const results = [];
for (const entry of cases) {
  for (const difficulty of ["intermediate", "advanced"]) {
    const view = gameViewForColor(entry.game, entry.game.turn);
    const job = { difficulty, botColor: view.turn, size: view.size,
      sgf: serializePracticePositionToSgf(view, view.turn), legalVertices: legalPracticeGtpVertices(view, view.turn) };
    const startedAt = performance.now();
    const action = await runGnuGo(factory, compiled, job);
    const elapsedMs = Math.round(performance.now() - startedAt);
    assert.ok(action.type === "pass" || playMove(view, view.turn, action.pointId).ok);
    const reference = nativeAvailable ? await native.search(view, view.turn, practiceDifficulty(difficulty)) : null;
    results.push({ position: entry.name, difficulty, elapsedMs, action, native: reference?.action ?? reference?.reason ?? "not-tested",
      sameMove: reference?.ok ? JSON.stringify(action) === JSON.stringify(reference.action) : null });
  }
}
console.log(JSON.stringify({ wasmBytes: bytes.length, gzipBytes: gzipSync(bytes).length, nativeAvailable, results }, null, 2));

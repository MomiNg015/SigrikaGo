import { choosePracticeAction } from "../shared/practiceBotDecision.js";
import { practiceDifficulty } from "../shared/practiceMode.js";
import { LOCAL_PRACTICE_VERSION } from "../shared/localPractice.js";
import { runGnuGo } from "./gnuGoWasm.js";

let enginePromise;
async function loadGnuGo() {
  enginePromise ??= (async () => {
    const base = `/engines/gnugo-3.8/`;
    // Vite's dev import analysis adds ?import to root-relative dynamic imports
    // even with @vite-ignore. A same-origin absolute URL stays a static request.
    const url = new URL(`${base}gnugo.js?v=${LOCAL_PRACTICE_VERSION}`, self.location.origin).href;
    const [module, response] = await Promise.all([
      import(/* @vite-ignore */ url), fetch(`${base}gnugo.wasm?v=${LOCAL_PRACTICE_VERSION}`)
    ]);
    if (!response.ok) throw new Error("engine_download_failed");
    const compiled = await WebAssembly.compile(await response.arrayBuffer());
    // Exercise the actual SGF + restricted search interface before admission.
    await runGnuGo(module.default, compiled, { difficulty: "basic", size: 13, botColor: "black",
      sgf: "(;GM[1]FF[4]SZ[13]KM[2.75]RU[Chinese]PL[B])", legalVertices: ["D4"] });
    return { factory: module.default, compiled };
  })();
  return enginePromise;
}

self.onmessage = async ({ data }) => {
  try {
    if (data.version !== LOCAL_PRACTICE_VERSION) throw new Error("engine_version");
    const difficulty = practiceDifficulty(data.difficulty ?? data.job?.difficulty);
    if (!difficulty) throw new Error("invalid_difficulty");
    const engine = difficulty.strategy === "gnugo" ? await loadGnuGo() : null;
    const action = data.type === "search"
      ? (engine ? await runGnuGo(engine.factory, engine.compiled, data.job)
        : choosePracticeAction(data.job.view, data.job.botColor, difficulty))
      : null;
    self.postMessage({ id: data.id, ok: true, action });
  } catch {
    self.postMessage({ id: data.id, ok: false, error: "engine_failed" });
  }
};

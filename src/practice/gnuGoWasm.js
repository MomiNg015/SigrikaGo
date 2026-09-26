import { gtpVertexToPointId, parseGtpResponse } from "../shared/practiceBotPosition.js";
import { practiceDifficulty } from "../shared/practiceMode.js";

// A fresh instance matches the native adapter's per-position process lifetime:
// caches, globals and skill-mutated boards cannot leak from the previous search.
export async function runGnuGo(factory, wasmModule, job) {
  const difficulty = practiceDifficulty(job.difficulty);
  if (!difficulty?.engine) throw new Error("invalid_difficulty");
  if (!job.legalVertices.length) return { type: "pass" };
  const input = `1 loadsgf /position.sgf\n2 restricted_genmove ${job.botColor} ${job.legalVertices.join(" ")}\n3 quit\n`;
  let offset = 0;
  let output = "";
  let exitCode = 0;
  const engine = await factory({
    instantiateWasm(imports, receive) {
      const instance = new WebAssembly.Instance(wasmModule, imports);
      receive(instance, wasmModule);
      return instance.exports;
    },
    stdin: () => offset < input.length ? input.charCodeAt(offset++) : null,
    print: (line) => { if (output.length < 65536) output += `${line}\n`; },
    printErr: () => {},
    onExit: (code) => { exitCode = code; }
  });
  engine.FS.writeFile("/position.sgf", job.sgf);
  engine.callMain(["--mode", "gtp", "--quiet", "--never-resign", "--cache-size", "8", "--level", String(difficulty.engine.level)]);
  if (exitCode !== 0) throw new Error("engine_failed");
  const vertex = parseGtpResponse(output, 2);
  if (/^pass$/i.test(vertex ?? "")) return { type: "pass" };
  const pointId = gtpVertexToPointId(vertex, job.size);
  if (!pointId || !job.legalVertices.includes(vertex?.toUpperCase())) throw new Error("engine_invalid_result");
  return { type: "move", pointId };
}

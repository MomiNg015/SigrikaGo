import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SYSTEM_DESIGN_SOURCE_PATHS, renderSystemDesignHtml } from "../../scripts/render-system-design-html.mjs";

const git = (args, input) => execFileSync("git", args, { encoding: "utf8", input, maxBuffer: 20 * 1024 * 1024 });
if (git(["diff", "--cached", "--name-only"]).trim()) throw new Error("Index is not empty; inspect before staging");
const plan = readFileSync(".trellis/tasks/09-26-practice-local-engine/commit-plan.md", "utf8");
const files = plan.match(/```text\r?\n([\s\S]*?)```/)[1].trim().split(/\r?\n/);
git(["add", "--", ...files]);
for (const [file, markers, count] of [
  ["docs/system-design.md", ["+本地陪练的预编译", "+准时宝普通陪练"], 1],
  ["docs/system-design/03-backend-realtime-api.md", ["+\u002d `server/socketPracticeEvents.js`", "+### 本地陪练引擎"], 2]
]) {
  const diff = git(["diff", "--unified=0", "--", file]);
  const [header, ...hunks] = diff.split(/(?=^@@ )/m);
  const selected = hunks.filter((hunk) => markers.some((marker) => hunk.includes(marker)));
  if (selected.length !== count) throw new Error(`Unexpected scope in ${file}`);
  git(["apply", "--cached", "--unidiff-zero"], header + selected.join(""));
}
const source = SYSTEM_DESIGN_SOURCE_PATHS.map((url) => {
  const name = path.relative(process.cwd(), fileURLToPath(url)).replaceAll("\\", "/");
  return git(["show", `:${name}`]).trim();
}).filter(Boolean).join("\n\n---\n\n") + "\n";
const hash = git(["hash-object", "-w", "--stdin"], renderSystemDesignHtml(source)).trim();
git(["update-index", "--cacheinfo", `100644,${hash},docs/system-design.html`]);
git(["diff", "--cached", "--check"]);
console.log(git(["diff", "--cached", "--stat"]));

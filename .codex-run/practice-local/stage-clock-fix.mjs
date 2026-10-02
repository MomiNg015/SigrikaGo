import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SYSTEM_DESIGN_SOURCE_PATHS, renderSystemDesignHtml } from "../../scripts/render-system-design-html.mjs";

const git = (args, input) => execFileSync("git", args, { encoding: "utf8", input, maxBuffer: 20 * 1024 * 1024 });
if (git(["diff", "--cached", "--name-only"]).trim()) throw new Error("Index must be empty");
git(["add", "--", "src/room/TimeBar.jsx", "src/room/TimeBar.test.js", ".trellis/spec/backend/local-practice-engine-contract.md", ".trellis/tasks/09-26-practice-local-engine/research/validation.md"]);
const [header, ...hunks] = git(["diff", "--unified=0", "--", "docs/system-design.md"]).split(/(?=^@@ )/m);
const selected = hunks.filter((hunk) => hunk.includes("+准时宝普通陪练与吃子挑战赛中，本地机器人棋钟"));
if (selected.length !== 1) throw new Error("Unexpected documentation diff");
git(["apply", "--cached", "--unidiff-zero"], header + selected[0]);
const source = SYSTEM_DESIGN_SOURCE_PATHS.map((url) => {
  const name = path.relative(process.cwd(), fileURLToPath(url)).replaceAll("\\", "/");
  return git(["show", `:${name}`]).trim();
}).filter(Boolean).join("\n\n---\n\n") + "\n";
const hash = git(["hash-object", "-w", "--stdin"], renderSystemDesignHtml(source)).trim();
git(["update-index", "--cacheinfo", `100644,${hash},docs/system-design.html`]);
git(["diff", "--cached", "--check"]);
console.log(git(["diff", "--cached", "--stat"]));

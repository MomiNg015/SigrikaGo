import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { SYSTEM_DESIGN_SOURCE_PATHS, renderSystemDesignHtml } from "../../../scripts/render-system-design-html.mjs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
if (git("diff", "--cached", "--name-only").trim()) throw new Error("Index contains other work; stop scoped staging");
const files = [
  ".trellis/spec/frontend/css-architecture.md", "docs/system-design/06-ui-theme-mobile.md",
  "src/styles/themes/bright-school/surface-contracts/practice-sheet.css",
  "src/styles/themes/bright-school/surface-contracts/practice-sheet-dialogue.css",
  "src/styles/mobile-adaptive/readable-type-windows.css",
  "tests/e2e/interface-polish.spec.js", "tests/e2e/fixtures/interface-polish.jsx"
];
git("add", "--", ...files);
function stage(path, source) {
  const hash = execFileSync("git", ["hash-object", "-w", "--stdin"], { input: source, encoding: "utf8" }).trim();
  git("update-index", "--add", "--cacheinfo", `100644,${hash},${path}`);
}
const path = "docs/system-design.md";
const current = readFileSync(path, "utf8").replaceAll("\r\n", "\n");
const heading = "## 准时宝关闭按钮与手机胸像修正（2026-10-27）";
const start = current.indexOf(heading);
const end = current.indexOf("\n## ", start + heading.length);
if (start < 0 || end < 0) throw new Error("Missing scoped documentation section");
const head = git("show", `HEAD:${path}`).replaceAll("\r\n", "\n");
const boundary = head.indexOf("\n\n") + 2;
stage(path, head.slice(0, boundary) + current.slice(start, end).trimEnd() + "\n\n" + head.slice(boundary));
const markdown = SYSTEM_DESIGN_SOURCE_PATHS.map(url => {
  const pathname = decodeURIComponent(url.pathname);
  return git("show", `:${pathname.slice(pathname.indexOf("docs/"))}`).trim();
}).join("\n\n---\n\n") + "\n";
stage("docs/system-design.html", renderSystemDesignHtml(markdown));
const expected = [...files, path, "docs/system-design.html"].sort();
const actual = git("diff", "--cached", "--name-only").trim().split("\n").sort();
if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error("Staged scope changed unexpectedly");
console.log(git("diff", "--cached", "--stat"));

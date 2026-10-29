import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { SYSTEM_DESIGN_SOURCE_PATHS, renderSystemDesignHtml } from "../../../scripts/render-system-design-html.mjs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
if (git("diff", "--cached", "--name-only").trim()) throw new Error("Index must be empty before scoped staging");
const owned = [
  "src/shared/sigrikaCandyAvailability.js", "src/shared/sigrikaCandyArc.js",
  "server/db.js", "server/items.js", "server/items.test.js",
  "server/sigrikaCandyArc.js", "server/sigrikaCandyArc.test.js", "server/sigrikaCandyDisabled.test.js",
  "server/socketSigrikaCandyEvents.js", "server/socketSigrikaCandyEvents.test.js",
  "server/roomConnectionLifecycle.js", "server/roomConnectionLifecycle.test.js",
  "server/roomPersistenceRestoreLifecycle.js",
  "src/modals/warehouse/sigrikaCandyDisabled.dom.test.jsx",
  ".trellis/spec/backend/sigrika-candy-duel-recovery-contract.md"
];
git("add", "--", ...owned);

function stageContent(path, content) {
  const hash = execFileSync("git", ["hash-object", "-w", "--stdin"], { input: content, encoding: "utf8" }).trim();
  git("update-index", "--add", "--cacheinfo", `100644,${hash},${path}`);
}
function replaceOnce(source, needle, replacement) {
  if (!source.includes(needle)) throw new Error(`Missing anchor: ${needle}`);
  return source.replace(needle, replacement);
}

// The restored entry/transition/UI are prior WIP. HEAD already has no warehouse shortcut.
// Stage only the shared import and original App entry/resume guards against HEAD.
let app = git("show", "HEAD:src/app/App.jsx");
app = replaceOnce(app,
  'import { APP_OVERLAYS, dismissOverlayByKey, overlayPropsFromState } from "./overlayRegistry.js";',
  'import { APP_OVERLAYS, dismissOverlayByKey, overlayPropsFromState } from "./overlayRegistry.js";\nimport { SIGRIKA_CANDY_CORRUPTION_ENABLED } from "../shared/sigrikaCandyAvailability.js";');
app = replaceOnce(app, "if (nodeId !== SIGRIKA_CANDY_STORY_NODE_IDS.corruptionClimax",
  "if (!SIGRIKA_CANDY_CORRUPTION_ENABLED || nodeId !== SIGRIKA_CANDY_STORY_NODE_IDS.corruptionClimax");
app = replaceOnce(app, "if (!token || overlayState.storyPlayer || activeStoryPlayer.script || sigrikaRecoveryRequestRef.current",
  "if (!SIGRIKA_CANDY_CORRUPTION_ENABLED || !token || overlayState.storyPlayer || activeStoryPlayer.script || sigrikaRecoveryRequestRef.current");
stageContent("src/app/App.jsx", app);

// Keep unrelated documentation entries out of this commit, then render its exact source set.
for (const [path, nextHeading] of [
  ["docs/system-design.md", "### 2026-10-24"],
  ["docs/system-design/03-backend-realtime-api.md", "大厅顶部校园播报"]
]) {
  const working = readFileSync(path, "utf8").replaceAll("\r\n", "\n");
  const firstParagraph = working.indexOf("\n\n") + 2;
  const end = working.indexOf(nextHeading, firstParagraph);
  if (end < 0) throw new Error(`Missing document boundary in ${path}`);
  const addition = working.slice(firstParagraph, end);
  const head = git("show", `HEAD:${path}`).replaceAll("\r\n", "\n");
  const boundary = head.indexOf("\n\n") + 2;
  stageContent(path, head.slice(0, boundary) + addition + head.slice(boundary));
}
const markdown = SYSTEM_DESIGN_SOURCE_PATHS.map((url) => {
  const pathname = decodeURIComponent(url.pathname).replace(/^\//, "");
  const relative = pathname.slice(pathname.indexOf("docs/"));
  return git("show", `:${relative}`).trim();
}).join("\n\n---\n\n") + "\n";
stageContent("docs/system-design.html", renderSystemDesignHtml(markdown));
console.log(git("diff", "--cached", "--stat"));

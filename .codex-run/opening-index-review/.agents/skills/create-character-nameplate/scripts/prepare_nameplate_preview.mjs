import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(SKILL_DIR, "../../..");
const TASKS_ROOT = path.resolve(REPO_ROOT, ".trellis/tasks");
const HARNESS_TEMPLATE = path.resolve(SKILL_DIR, "assets/preview-harness");

export function prepareNameplatePreview({ taskDir, assetId, imageUrl, styles = [] }) {
  if (!taskDir || !assetId || !imageUrl) {
    throw new Error("taskDir, assetId, and imageUrl are required");
  }
  const absoluteTaskDir = path.resolve(REPO_ROOT, taskDir);
  assertInside(absoluteTaskDir, TASKS_ROOT, "Task directory");
  if (!fs.existsSync(path.join(absoluteTaskDir, "task.json"))) {
    throw new Error(`Task directory must contain task.json: ${absoluteTaskDir}`);
  }

  const normalizedStyles = styles.map((stylePath) => {
    const absoluteStyle = path.resolve(REPO_ROOT, stylePath);
    assertInside(absoluteStyle, REPO_ROOT, "Style path");
    if (!fs.existsSync(absoluteStyle)) throw new Error(`Style path does not exist: ${stylePath}`);
    return `/${path.relative(REPO_ROOT, absoluteStyle).replaceAll("\\", "/")}`;
  });

  const previewDir = path.resolve(absoluteTaskDir, "nameplate-preview");
  assertInside(previewDir, absoluteTaskDir, "Preview directory");
  fs.rmSync(previewDir, { recursive: true, force: true });
  fs.cpSync(HARNESS_TEMPLATE, previewDir, { recursive: true });

  const config = {
    assetId,
    imageUrl,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(previewDir, "src/preview-config.js"),
    `export default ${JSON.stringify(config, null, 2)};\n`
  );
  const imports = ["@import \"/src/styles.css\";", ...normalizedStyles.map((style) => `@import \"${style}\";`)];
  fs.writeFileSync(path.join(previewDir, "src/generated-imports.css"), `${imports.join("\n")}\n`);

  return {
    previewDir,
    relativePreviewDir: path.relative(REPO_ROOT, previewDir).replaceAll("\\", "/"),
    assetId,
    imageUrl,
    styles: normalizedStyles
  };
}

function assertInside(target, owner, label) {
  const relative = path.relative(owner, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return;
  throw new Error(`${label} must stay inside ${owner}: ${target}`);
}

function parseCli(argv) {
  const result = { styles: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--style") result.styles.push(argv[++index]);
    else if (value === "--task-dir") result.taskDir = argv[++index];
    else if (value === "--asset-id") result.assetId = argv[++index];
    else if (value === "--image-url") result.imageUrl = argv[++index];
    else throw new Error(`Unknown or incomplete argument: ${value}`);
  }
  return result;
}

async function main() {
  try {
    const result = prepareNameplatePreview(parseCli(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.error(error.message);
    console.error("Usage: node prepare_nameplate_preview.mjs --task-dir <task> --asset-id <id> --image-url <url> [--style <repo-css-path>]...");
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

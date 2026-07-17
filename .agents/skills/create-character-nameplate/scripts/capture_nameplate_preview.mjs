import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(SKILL_DIR, "../../..");
const TASKS_ROOT = path.resolve(REPO_ROOT, ".trellis/tasks");

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "narrow-1024x768", width: 1024, height: 768 },
  { name: "phone-375x812", width: 375, height: 812 }
];

const SYSTEM_BROWSER_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];

export async function captureNameplatePreview({ previewDir, outputDir, port = null }) {
  if (!previewDir) throw new Error("previewDir is required");
  const absolutePreviewDir = path.resolve(REPO_ROOT, previewDir);
  assertInside(absolutePreviewDir, TASKS_ROOT, "Preview directory");
  if (!fs.existsSync(path.join(absolutePreviewDir, "index.html"))) {
    throw new Error(`Preview index does not exist: ${absolutePreviewDir}`);
  }
  const absoluteOutputDir = outputDir
    ? path.resolve(REPO_ROOT, outputDir)
    : path.join(absolutePreviewDir, "screenshots");
  assertInside(absoluteOutputDir, TASKS_ROOT, "Output directory");
  fs.mkdirSync(absoluteOutputDir, { recursive: true });

  const serverPort = port ?? await availablePort();
  const server = startVite(serverPort);
  let browser;
  let browserSource;
  const captures = [];
  try {
    await waitForServer(serverPort, server);
    ({ browser, browserSource } = await launchBrowser());
    const relativeIndex = path.relative(REPO_ROOT, path.join(absolutePreviewDir, "index.html")).replaceAll("\\", "/");
    const url = `http://127.0.0.1:${serverPort}/${relativeIndex}`;

    for (const viewport of VIEWPORTS) {
      for (const reducedMotion of ["no-preference", "reduce"]) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          reducedMotion
        });
        const page = await context.newPage();
        await page.goto(url, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        const motionLabel = reducedMotion === "reduce" ? "reduced" : "motion";
        const outputPath = path.join(absoluteOutputDir, `${viewport.name}-${motionLabel}.png`);
        await page.screenshot({ path: outputPath, fullPage: true, animations: "allow" });
        captures.push(outputPath);
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    server.kill();
  }

  return { previewDir: absolutePreviewDir, outputDir: absoluteOutputDir, port: serverPort, browserSource, captures };
}

async function launchBrowser() {
  try {
    return { browser: await chromium.launch({ headless: true }), browserSource: "playwright-chromium" };
  } catch (playwrightError) {
    for (const executablePath of SYSTEM_BROWSER_CANDIDATES) {
      if (!fs.existsSync(executablePath)) continue;
      try {
        return {
          browser: await chromium.launch({ headless: true, executablePath }),
          browserSource: executablePath
        };
      } catch {
        // Try the next installed system browser.
      }
    }
    throw new Error(`No usable Chromium browser found. Playwright launch failed: ${playwrightError.message}`);
  }
}

function startVite(port) {
  const viteCli = path.resolve(REPO_ROOT, "node_modules/vite/bin/vite.js");
  if (!fs.existsSync(viteCli)) throw new Error("Vite is not installed; run npm install before preview capture");
  return spawn(process.execPath, [viteCli, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
}

async function waitForServer(port, server) {
  const deadline = Date.now() + 30000;
  let stderr = "";
  server.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite exited before preview capture: ${stderr.trim()}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for Vite on port ${port}: ${stderr.trim()}`);
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function assertInside(target, owner, label) {
  const relative = path.relative(owner, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return;
  throw new Error(`${label} must stay inside ${owner}: ${target}`);
}

function parseCli(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--preview-dir") result.previewDir = argv[++index];
    else if (value === "--output-dir") result.outputDir = argv[++index];
    else if (value === "--port") {
      result.port = Number(argv[++index]);
      if (!Number.isInteger(result.port) || result.port <= 0 || result.port > 65535) {
        throw new Error("--port requires an integer between 1 and 65535");
      }
    }
    else throw new Error(`Unknown or incomplete argument: ${value}`);
  }
  return result;
}

async function main() {
  try {
    const result = await captureNameplatePreview(parseCli(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.error(error.message);
    console.error("Usage: node capture_nameplate_preview.mjs --preview-dir <task/nameplate-preview> [--output-dir <task/research/output>] [--port N]");
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

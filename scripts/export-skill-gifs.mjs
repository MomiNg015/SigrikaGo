import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";
import {
  SKILL_BOARD_EFFECT_DURATION_MS,
  skillBoardEffectDurationMs
} from "../src/shared/skillPresentation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const taskDir = path.join(repoRoot, ".trellis", "tasks", "06-23-gif");
const harnessDir = path.join(taskDir, "capture-harness");
const defaultOutputRoot = path.join(repoRoot, "outputs", "skill-gifs");
const boardSize = 13;
const defaultTarget = "6,6";
const defaultSize = 720;
const defaultFps = 30;
const captureClockStartMs = Date.UTC(2026, 0, 1, 0, 0, 0, 0);
const capturePrepDelayMs = 60_000;

const effectDefaults = Object.freeze({
  "double-move": Object.freeze({ character: "changli", noTarget: true }),
  "erase-point": Object.freeze({ character: "sigrika" }),
  "flip-stone": Object.freeze({ character: "denia" }),
  "hidden-hand": Object.freeze({ character: "aemeath" }),
  "liberty-purge": Object.freeze({ character: "chisa" }),
  "protocol-takeover": Object.freeze({ character: "mornye" }),
  "random-blast": Object.freeze({ character: "baconbits" }),
  "row-slash": Object.freeze({ character: "qiuyuan", forceBoardHarness: true }),
  "spray-stone": Object.freeze({ character: "lynae" }),
  "voyage-star": Object.freeze({ character: "aemeath" })
});

export function playableEffectTypes() {
  return Object.keys(effectDefaults);
}

export function parseExportArgs(argv = []) {
  const options = {
    character: "",
    effect: "",
    outputName: "",
    size: defaultSize,
    fps: defaultFps,
    target: defaultTarget,
    theme: "black"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    index += 1;
    if (key === "character") options.character = value;
    else if (key === "effect") options.effect = value;
    else if (key === "output-name") options.outputName = value;
    else if (key === "size") options.size = positiveInteger(value, "--size");
    else if (key === "fps") options.fps = positiveInteger(value, "--fps");
    else if (key === "target") options.target = normalizePointId(value);
    else if (key === "theme") options.theme = parseTheme(value);
    else throw new Error(`Unknown option: --${key}`);
  }

  if (options.help) return options;
  if (!options.effect) throw new Error("Missing required option: --effect");
  if (!effectDefaults[options.effect]) {
    throw new Error(`Unsupported effect "${options.effect}". Use one of: ${playableEffectTypes().join(", ")}`);
  }
  if (!options.character) options.character = effectDefaults[options.effect].character;
  return options;
}

export function buildCapturePlan(options) {
  const effectType = options.effect;
  const characterId = options.character || effectDefaults[effectType]?.character || effectType;
  const durationMs = skillBoardEffectDurationMs({
    effectType,
    removalMarkIds: representativePointSet(options.target, effectType)
  }) || SKILL_BOARD_EFFECT_DURATION_MS;
  const extraMs = effectType === "row-slash" ? 520 : 320;
  const frameDelayMs = 1000 / options.fps;
  const frameCount = Math.ceil(((durationMs + extraMs) / 1000) * options.fps);
  const outputSubdir = characterId || effectType;
  const filename = options.outputName || `${outputSubdir}-${effectType}-${options.theme}.gif`;
  const outputDir = path.join(defaultOutputRoot, outputSubdir);

  return {
    characterId,
    captureClockStartMs,
    capturePrepDelayMs,
    durationMs,
    effectType,
    extraMs,
    filename,
    frameDelayMs,
    fps: options.fps,
    frameCount,
    harness: effectDefaults[effectType]?.forceBoardHarness || options.theme === "board" ? "board" : "effect",
    outputDir,
    outputPath: path.join(outputDir, filename),
    outputSubdir,
    size: options.size,
    targetId: effectDefaults[effectType]?.noTarget ? defaultTarget : options.target,
    theme: options.theme
  };
}

export function buildPendingSkill(plan) {
  const pointIds = representativePointSet(plan.targetId, plan.effectType);
  const pendingSkill = {
    id: `${plan.effectType}-gif-capture`,
    characterId: plan.characterId,
    color: "black",
    skillName: plan.effectType,
    effectType: plan.effectType,
    targetId: plan.targetId,
    affectedPointIds: pointIds,
    bannerDurationMs: 0,
    boardEffectDurationMs: plan.durationMs
  };

  if (plan.effectType === "row-slash") {
    pendingSkill.row = pointFromId(plan.targetId).y;
  }
  if (plan.effectType === "voyage-star") {
    pendingSkill.removedStones = pointIds.map((id, index) => ({
      id,
      color: index % 2 ? "white" : "black"
    }));
  }
  if (plan.effectType === "liberty-purge") {
    pendingSkill.removalMarkIds = pointIds.filter((id) => id !== plan.targetId);
  }
  return pendingSkill;
}

export async function exportSkillGif(argv = process.argv.slice(2)) {
  const options = parseExportArgs(argv);
  if (options.help) {
    console.log(helpText());
    return null;
  }
  const plan = buildCapturePlan(options);
  await assertRuntimeDependencies();
  await fs.mkdir(harnessDir, { recursive: true });
  await fs.mkdir(plan.outputDir, { recursive: true });
  await writeHarness();

  const serverPort = await findFreePort();
  const server = await createServer({
    root: repoRoot,
    logLevel: "error",
    server: {
      host: "127.0.0.1",
      port: serverPort,
      strictPort: true
    }
  });

  await server.listen();
  const address = server.httpServer.address();
  const port = typeof address === "object" && address ? address.port : serverPort;
  const browser = await chromium.launch(browserLaunchOptions());

  try {
    const page = await browser.newPage({
      viewport: { width: plan.size, height: plan.size },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference"
    });
    await page.goto(`http://127.0.0.1:${port}/.trellis/tasks/06-23-gif/capture-harness/index.html`, {
      waitUntil: "networkidle"
    });
    const framesDir = path.join(plan.outputDir, "frames", plan.effectType);
    await recreateDirectory(framesDir);
    await captureEffect({ page, plan, framesDir });
    await encodeGif({ plan, framesDir });
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(`Exported GIF: ${path.relative(repoRoot, plan.outputPath)}`);
  return plan.outputPath;
}

async function captureEffect({ page, plan, framesDir }) {
  await page.clock.install({ time: plan.captureClockStartMs });
  await page.evaluate((capturePlan) => window.__skillGifCapture.play(capturePlan), browserPlan(plan));
  await waitForEffectReady(page, plan);
  await page.clock.pauseAt(plan.captureClockStartMs + plan.capturePrepDelayMs);
  await page.clock.runFor(16);

  for (let index = 0; index < plan.frameCount; index += 1) {
    await page.screenshot({
      path: path.join(framesDir, `frame-${String(index).padStart(4, "0")}.png`),
      clip: { x: 0, y: 0, width: plan.size, height: plan.size },
      omitBackground: false
    });
    if (index < plan.frameCount - 1) await page.clock.runFor(plan.frameDelayMs);
  }
}

async function waitForEffectReady(page, plan) {
  if (plan.effectType === "row-slash") {
    await page.waitForFunction(() => Boolean(document.querySelector(".board-row-slash")), null, { timeout: 5000 });
    return;
  }
  await page.waitForFunction(() => {
    const host = document.querySelector(".board-effects-layer");
    return host?.querySelector("canvas") && host.dataset.effectFallback !== "true";
  }, null, { timeout: 5000 });
}

async function encodeGif({ plan, framesDir }) {
  const palettePath = path.join(framesDir, "palette.png");
  const inputPattern = path.join(framesDir, "frame-%04d.png");
  runFfmpeg([
    "-y",
    "-framerate", String(plan.fps),
    "-i", inputPattern,
    "-vf", "palettegen=stats_mode=full",
    palettePath
  ]);
  runFfmpeg([
    "-y",
    "-framerate", String(plan.fps),
    "-i", inputPattern,
    "-i", palettePath,
    "-lavfi", "paletteuse=dither=bayer:bayer_scale=3",
    "-loop", "0",
    plan.outputPath
  ]);
}

function runFfmpeg(args) {
  const result = spawnSync("ffmpeg", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed. Install ffmpeg and make sure it is on PATH.\n${result.stderr || result.stdout}`);
  }
}

async function assertRuntimeDependencies() {
  const result = spawnSync("ffmpeg", ["-version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error("ffmpeg is required to export GIFs. Install ffmpeg and make sure it is available on PATH.");
  }
}

function browserLaunchOptions() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  for (const executablePath of candidates) {
    const result = spawnSync(executablePath, ["--version"], { stdio: "ignore" });
    if (result.status === 0) return { executablePath };
  }
  return {};
}

async function recreateDirectory(directory) {
  await fs.rm(directory, { recursive: true, force: true });
  await fs.mkdir(directory, { recursive: true });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

function representativePointSet(targetId, effectType) {
  const target = pointFromId(targetId);
  if (effectType === "row-slash") {
    return Array.from({ length: boardSize }, (_, x) => `${x},${target.y}`);
  }
  if (effectType === "random-blast") return squareAround(target, 1);
  if (effectType === "spray-stone") return [targetId, ...squareAround(target, 1).filter((id) => id !== targetId).slice(0, 4)];
  if (effectType === "liberty-purge") return [targetId, ...orthogonalAround(target), ...diagonalAround(target).slice(0, 2)];
  if (effectType === "voyage-star") return [targetId, ...orthogonalAround(target), ...diagonalAround(target)];
  return [targetId];
}

function squareAround(point, radius) {
  const ids = [];
  for (let y = point.y - radius; y <= point.y + radius; y += 1) {
    for (let x = point.x - radius; x <= point.x + radius; x += 1) {
      if (inBoard(x, y)) ids.push(`${x},${y}`);
    }
  }
  return ids;
}

function orthogonalAround(point) {
  return [
    [point.x, point.y - 1],
    [point.x, point.y + 1],
    [point.x - 1, point.y],
    [point.x + 1, point.y]
  ].filter(([x, y]) => inBoard(x, y)).map(([x, y]) => `${x},${y}`);
}

function diagonalAround(point) {
  return [
    [point.x - 1, point.y - 1],
    [point.x + 1, point.y + 1],
    [point.x - 1, point.y + 1],
    [point.x + 1, point.y - 1]
  ].filter(([x, y]) => inBoard(x, y)).map(([x, y]) => `${x},${y}`);
}

function inBoard(x, y) {
  return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
}

function pointFromId(pointId) {
  const [x, y] = normalizePointId(pointId).split(",").map(Number);
  return { x, y };
}

function normalizePointId(pointId) {
  const [x, y] = String(pointId ?? "").split(",").map(Number);
  if (!Number.isInteger(x) || !Number.isInteger(y) || !inBoard(x, y)) {
    throw new Error(`Point must be an in-board id like "6,6"; got "${pointId}"`);
  }
  return `${x},${y}`;
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} must be a positive integer`);
  return parsed;
}

function parseTheme(value) {
  if (value === "black" || value === "board") return value;
  throw new Error('--theme must be "black" or "board"');
}

function browserPlan(plan) {
  const pendingSkill = buildPendingSkill(plan);
  return {
    characterId: plan.characterId,
    durationMs: plan.durationMs,
    effectType: plan.effectType,
    harness: plan.harness,
    pendingSkill: {
      ...pendingSkill,
      bannerDurationMs: plan.capturePrepDelayMs
    },
    size: plan.size,
    targetId: plan.targetId,
    theme: plan.theme
  };
}

function helpText() {
  return `Usage: npm run export:skill-gifs -- --effect <effect> [options]

Options:
  --character <id>      Character id used in pending skill metadata.
  --effect <effect>     Effect type. Supported: ${playableEffectTypes().join(", ")}
  --output-name <file>  GIF file name. Defaults to <character>-<effect>-<theme>.gif.
  --size <px>           Square capture size. Default: ${defaultSize}.
  --fps <number>        Capture frame rate. Default: ${defaultFps}.
  --target <x,y>        Representative board point. Default: ${defaultTarget}.
  --theme <black|board> Capture effect-only view on the current board texture or board context. Default: black.`;
}

async function writeHarness() {
  await fs.writeFile(path.join(harnessDir, "index.html"), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skill GIF Capture</title>
    <script type="module" src="./main.jsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`);

  await fs.writeFile(path.join(harnessDir, "main.jsx"), `import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Board from "/src/room/Board.jsx";
import BoardSkillEffects from "/src/room/BoardSkillEffects.jsx";
import { VOYAGE_STAR_WHITEOUT_RESOLUTION_PROGRESS } from "/src/shared/skillPresentation.js";
import "/src/styles/room/board.css";
import "/src/styles/room/board/effects-canvas-motion.css";

const BOARD_SIZE = ${boardSize};

function CaptureHarness() {
  const [plan, setPlan] = useState(null);
  const [resolved, setResolved] = useState(false);
  const resolutionTimerRef = useRef(0);
  const pointNodes = useMemo(() => {
    const nodes = [];
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const id = \`\${x},\${y}\`;
        nodes.push(
          <span
            aria-hidden="true"
            className="point"
            data-point-id={id}
            key={id}
            style={{
              left: \`\${((x + 0.5) / BOARD_SIZE) * 100}%\`,
              top: \`\${((y + 0.5) / BOARD_SIZE) * 100}%\`
            }}
          />
        );
      }
    }
    return nodes;
  }, []);

  useEffect(() => {
    window.__skillGifCapture = {
      play(nextPlan) {
        window.clearTimeout(resolutionTimerRef.current);
        setResolved(false);
        setPlan({ ...nextPlan, nonce: Date.now() });
        const resolutionDelayMs = skillGifResolutionDelayMs(nextPlan.pendingSkill);
        if (resolutionDelayMs !== null) {
          resolutionTimerRef.current = window.setTimeout(() => setResolved(true), resolutionDelayMs);
        }
      }
    };
  }, []);

  const activePendingSkill = plan?.pendingSkill && !resolved ? {
    ...plan.pendingSkill,
    id: \`\${plan.pendingSkill.id}-\${plan.nonce}\`
  } : null;
  const displayPendingSkill = plan?.pendingSkill ? {
    ...plan.pendingSkill,
    id: \`\${plan.pendingSkill.id}-\${plan.nonce}\`
  } : null;
  const className = [
    "skill-gif-stage",
    plan?.theme === "board" ? "skill-gif-board-theme" : "skill-gif-black-theme"
  ].join(" ");

  if (!plan) return <main className="skill-gif-stage skill-gif-black-theme" />;

  return (
    <main className={className} style={{ "--capture-size": \`\${plan.size}px\` }}>
      {plan.harness === "board" ? (
        <Board
          game={mockGameForPlan({ ...plan, pendingSkill: activePendingSkill, sourcePendingSkill: displayPendingSkill, resolved })}
          showCoords={false}
          showMoves={false}
          pendingSkill={activePendingSkill}
          audioSettings={mutedAudioSettings}
          skillEffectsEnabled
          onPoint={() => {}}
          onScoringPoint={null}
          onNeutral={() => {}}
          onBoardSurface={() => {}}
        />
      ) : (
        <section
          className="skill-gif-effect-host board-wrap"
          data-board-size={BOARD_SIZE}
          style={{ "--size": BOARD_SIZE }}
        >
          {pointNodes}
          <BoardSkillEffects
            boardSize={BOARD_SIZE}
            pendingSkill={displayPendingSkill}
            audioSettings={mutedAudioSettings}
            prewarm={false}
            effectsEnabled
          />
        </section>
      )}
    </main>
  );
}

const mutedAudioSettings = Object.freeze({
  master: 0,
  bgm: 0,
  sfx: 0,
  voice: 0,
  muted: { master: true, bgm: true, sfx: true, voice: true }
});

function skillGifResolutionDelayMs(pendingSkill) {
  const bannerDurationMs = Number(pendingSkill.bannerDurationMs ?? 2000);
  const boardEffectDurationMs = Number(pendingSkill.boardEffectDurationMs ?? 1800);
  if (pendingSkill?.effectType === "row-slash") return bannerDurationMs + 760;
  if (pendingSkill?.effectType !== "voyage-star") return null;
  return bannerDurationMs + Math.round(boardEffectDurationMs * VOYAGE_STAR_WHITEOUT_RESOLUTION_PROGRESS);
}

function mockGameForPlan(plan) {
  const pendingSkill = plan.pendingSkill;
  const resolvedVoyageStar = plan.resolved && plan.effectType === "voyage-star";
  const resolvedRowSlash = plan.resolved && plan.effectType === "row-slash";
  const voyageStarIds = resolvedVoyageStar
    ? new Set(Array.isArray(plan.sourcePendingSkill?.affectedPointIds) ? plan.sourcePendingSkill.affectedPointIds : [])
    : new Set();
  const voyageStarCenterId = resolvedVoyageStar ? plan.targetId : "";
  const rowSlashIds = resolvedRowSlash
    ? new Set(Array.isArray(plan.sourcePendingSkill?.affectedPointIds) ? plan.sourcePendingSkill.affectedPointIds : [])
    : new Set();
  const rowSlashY = resolvedRowSlash ? Number(plan.sourcePendingSkill?.row) : null;
  const points = [];
  const stones = stoneMapForSkill(pendingSkill);
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const id = \`\${x},\${y}\`;
      const voyageStarErased = voyageStarIds.has(id);
      const rowSlashRemoved = rowSlashIds.has(id);
      points.push({
        id,
        x,
        y,
        valid: !voyageStarErased,
        stone: voyageStarErased || rowSlashRemoved ? null : stones.get(id) ?? null,
        skillEffect: voyageStarErased
          ? id === voyageStarCenterId ? "voyage-star-crater-point" : "voyage-star-erased-point"
          : null,
        skillEffectOwner: voyageStarErased ? "black" : null
      });
    }
  }
  return {
    size: BOARD_SIZE,
    mode: "spark",
    phase: "skill-preview",
    points,
    pendingSkill,
    history: resolvedVoyageStar ? [{
      type: "skill",
      effectType: "voyage-star",
      id: voyageStarCenterId,
      color: "black"
    }] : [],
    rowEffects: resolvedRowSlash && Number.isInteger(rowSlashY) ? [{
      effectType: "row-slash",
      owner: "black",
      clearAfterColor: "white",
      y: rowSlashY,
      id: plan.targetId
    }] : [],
    skillEnabled: true,
    libertyPurgeMarks: [],
    scoring: {},
    passives: {}
  };
}

function stoneMapForSkill(pendingSkill) {
  const stones = new Map();
  const affected = Array.isArray(pendingSkill?.affectedPointIds) ? pendingSkill.affectedPointIds : [];
  if (pendingSkill?.effectType === "row-slash") {
    for (const [index, pointId] of affected.entries()) {
      if (index % 2 === 0) stones.set(pointId, index % 4 === 0 ? "black" : "white");
    }
  } else if (pendingSkill?.effectType === "flip-stone" || pendingSkill?.effectType === "spray-stone") {
    stones.set(pendingSkill.targetId, "white");
  } else if (pendingSkill?.effectType === "random-blast" || pendingSkill?.effectType === "voyage-star") {
    for (const [index, pointId] of affected.entries()) stones.set(pointId, index % 2 ? "white" : "black");
  }
  return stones;
}

createRoot(document.getElementById("root")).render(<CaptureHarness />);

const style = document.createElement("style");
style.textContent = \`
  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: #000;
  }

  .skill-gif-stage {
    width: var(--capture-size, ${defaultSize}px);
    height: var(--capture-size, ${defaultSize}px);
    position: relative;
    overflow: hidden;
    background: #000;
  }

  .skill-gif-effect-host,
  .skill-gif-stage .board-wrap,
  .skill-gif-stage .board {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .skill-gif-effect-host .point {
    position: absolute;
    width: 2px;
    height: 2px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    opacity: 0;
  }

  .skill-gif-stage .board-wrap {
    display: block;
    padding: 0;
    margin: 0;
  }

  .skill-gif-stage .board {
    margin: 0;
    aspect-ratio: 1;
  }

  .skill-gif-effect-host.board-wrap {
    display: block;
    padding: 0;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    background: var(--board-wood-texture);
  }

  .skill-gif-black-theme .board {
    background: transparent !important;
    box-shadow: none !important;
    border: 0 !important;
  }

  .skill-gif-black-theme .board-lines,
  .skill-gif-black-theme .point.star::before,
  .skill-gif-black-theme .point .stone {
    opacity: 0 !important;
  }

  .skill-gif-black-theme .point {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .board-effects-layer,
  .board-effects-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
\`;
document.head.appendChild(style);
`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  exportSkillGif().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

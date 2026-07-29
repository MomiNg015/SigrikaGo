import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  COLORS,
  parsePointId,
  playMove
} from "../src/shared/game.js";

const ENGINE_NAME = "GNU Go";
const ENGINE_OUTPUT_LIMIT = 64 * 1024;
const AVAILABILITY_RETRY_MS = 5_000;
const GTP_COLUMNS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

export const DEFAULT_PRACTICE_ENGINE_PATH = process.platform === "win32"
  ? "gnugo.exe"
  : "/usr/games/gnugo";

export function createPracticeBotEngine({
  enginePath = process.env.PRACTICE_ENGINE_PATH || DEFAULT_PRACTICE_ENGINE_PATH,
  tempRoot = process.env.PRACTICE_ENGINE_TEMP_DIR || path.join(process.cwd(), ".tmp"),
  runProcess = runPracticeEngineProcess,
  now = Date.now
} = {}) {
  let activeSearch = null;
  let availability = null;
  let availabilityPromise = null;

  async function ensureAvailable() {
    if (availability?.ok) return availability;
    if (availability && now() - availability.checkedAt < AVAILABILITY_RETRY_MS) {
      return availability;
    }
    if (activeSearch) {
      return { ok: true, name: ENGINE_NAME, version: null };
    }
    if (!availabilityPromise) {
      availabilityPromise = probeEngine({ enginePath, runProcess })
        .then((result) => {
          availability = { ...result, checkedAt: now() };
          return availability;
        })
        .finally(() => {
          availabilityPromise = null;
        });
    }
    return availabilityPromise;
  }

  function search(gameView, botColor, difficulty) {
    if (activeSearch) return Promise.resolve({ ok: false, reason: "busy" });
    const pending = searchWithGnuGo({
      gameView,
      botColor,
      difficulty,
      enginePath,
      tempRoot,
      runProcess
    }).then((result) => {
      if (result.ok) {
        availability = {
          ok: true,
          name: ENGINE_NAME,
          version: availability?.version ?? null,
          checkedAt: now()
        };
      } else if (result.reason === "unavailable") {
        availability = {
          ok: false,
          reason: "unavailable",
          checkedAt: now()
        };
      }
      return result;
    }).finally(() => {
      if (activeSearch === pending) activeSearch = null;
    });
    activeSearch = pending;
    return pending;
  }

  return { ensureAvailable, search };
}

export const practiceBotEngine = createPracticeBotEngine();

export function serializePracticePositionToSgf(gameView, botColor) {
  const size = boundedInteger(gameView?.size, 13, 2, 25);
  const komi = Number.isFinite(Number(gameView?.komi))
    ? Number(gameView.komi)
    : 2.75;
  const black = [];
  const white = [];
  for (const point of gameView?.points ?? []) {
    if (!point?.valid) continue;
    const coordinate = pointToSgfCoordinate(point, size);
    if (!coordinate) continue;
    if (point.stone === COLORS.black) black.push(coordinate);
    if (point.stone === COLORS.white) white.push(coordinate);
  }
  black.sort();
  white.sort();
  const setup = [
    black.length ? `AB${black.map((coordinate) => `[${coordinate}]`).join("")}` : "",
    white.length ? `AW${white.map((coordinate) => `[${coordinate}]`).join("")}` : ""
  ].filter(Boolean).join("");
  return `(;GM[1]FF[4]CA[UTF-8]SZ[${size}]KM[${komi}]RU[Chinese]PL[${gtpColor(botColor)[0].toUpperCase()}]${setup})`;
}

export function legalPracticeGtpVertices(gameView, botColor) {
  const size = boundedInteger(gameView?.size, 13, 2, GTP_COLUMNS.length);
  return (gameView?.points ?? [])
    .filter((point) => {
      if (!point?.valid || typeof point.id !== "string") return false;
      return playMove(gameView, botColor, point.id, { colorIllusion: null }).ok;
    })
    .map((point) => pointIdToGtpVertex(point.id, size))
    .filter(Boolean);
}

export function pointIdToGtpVertex(id, size) {
  const { x, y } = parsePointId(id);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= size || y >= size || x >= GTP_COLUMNS.length) return null;
  return `${GTP_COLUMNS[x]}${size - y}`;
}

export function gtpVertexToPointId(vertex, size) {
  const match = /^([A-HJ-Z])(\d{1,2})$/i.exec(String(vertex ?? "").trim());
  if (!match) return null;
  const x = GTP_COLUMNS.indexOf(match[1].toUpperCase());
  const row = Number(match[2]);
  const y = size - row;
  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  return `${x},${y}`;
}

export function parseGtpResponse(stdout, commandId) {
  const responsePattern = new RegExp(`^=\\s*${commandId}(?:\\s+([^\\r\\n]*))?\\s*$`, "mi");
  const match = responsePattern.exec(String(stdout ?? ""));
  return match ? String(match[1] ?? "").trim() : null;
}

export function runPracticeEngineProcess({
  command,
  args = [],
  input = "",
  timeoutMs = 2_000
}) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(command, args, {
        shell: false,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"]
      });
    } catch (error) {
      reject(error);
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;
    let forcedError = null;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };
    const stopWithCode = (code, message) => {
      if (settled || forcedError) return;
      const error = new Error(message);
      error.code = code;
      forcedError = error;
      child.kill("SIGKILL");
    };
    const timeout = setTimeout(() => {
      stopWithCode("ENGINE_TIMEOUT", `${ENGINE_NAME} exceeded ${timeoutMs}ms`);
    }, boundedInteger(timeoutMs, 2_000, 100, 15_000));
    timeout.unref?.();

    child.on("error", (error) => finish(reject, error));
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > ENGINE_OUTPUT_LIMIT) {
        stopWithCode("ENGINE_OUTPUT_LIMIT", `${ENGINE_NAME} stdout exceeded the limit`);
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > ENGINE_OUTPUT_LIMIT) {
        stopWithCode("ENGINE_OUTPUT_LIMIT", `${ENGINE_NAME} stderr exceeded the limit`);
      }
    });
    child.on("close", (code) => {
      if (forcedError) {
        finish(reject, forcedError);
        return;
      }
      if (code !== 0) {
        const error = new Error(`${ENGINE_NAME} exited with code ${code}: ${stderr.trim()}`);
        error.code = "ENGINE_EXIT";
        finish(reject, error);
        return;
      }
      finish(resolve, { stdout, stderr });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

async function probeEngine({ enginePath, runProcess }) {
  try {
    const { stdout, stderr } = await runProcess({
      command: enginePath,
      args: ["--version"],
      timeoutMs: 1_500
    });
    const version = `${stdout ?? ""}\n${stderr ?? ""}`
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ENGINE_NAME;
    return { ok: true, name: ENGINE_NAME, version };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

async function searchWithGnuGo({
  gameView,
  botColor,
  difficulty,
  enginePath,
  tempRoot,
  runProcess
}) {
  const size = boundedInteger(gameView?.size, 13, 2, GTP_COLUMNS.length);
  const legalVertices = legalPracticeGtpVertices(gameView, botColor);
  if (!legalVertices.length) {
    return {
      ok: true,
      action: { type: "pass" },
      engine: { name: ENGINE_NAME, level: engineLevel(difficulty) }
    };
  }

  let temporaryDirectory = null;
  try {
    await mkdir(tempRoot, { recursive: true });
    temporaryDirectory = await mkdtemp(path.join(tempRoot, "practice-gnugo-"));
    const sgfPath = path.join(temporaryDirectory, "position.sgf");
    await writeFile(sgfPath, serializePracticePositionToSgf(gameView, botColor), "utf8");
    const gtpPath = pathForGtp(sgfPath);
    const commandId = 2;
    const input = [
      `1 loadsgf ${gtpPath}`,
      `${commandId} restricted_genmove ${gtpColor(botColor)} ${legalVertices.join(" ")}`,
      "3 quit",
      ""
    ].join("\n");
    const level = engineLevel(difficulty);
    const { stdout } = await runProcess({
      command: enginePath,
      args: [
        "--mode", "gtp",
        "--quiet",
        "--never-resign",
        "--cache-size", String(engineCacheSize(difficulty)),
        "--level", String(level)
      ],
      input,
      timeoutMs: engineTimeout(difficulty)
    });
    const response = parseGtpResponse(stdout, commandId);
    if (response === null) return { ok: false, reason: "invalid-response" };
    if (/^pass$/i.test(response)) {
      return {
        ok: true,
        action: { type: "pass" },
        engine: { name: ENGINE_NAME, level }
      };
    }
    const pointId = gtpVertexToPointId(response, size);
    if (!pointId || !legalVertices.includes(pointIdToGtpVertex(pointId, size))) {
      return { ok: false, reason: "invalid-result" };
    }
    return {
      ok: true,
      action: { type: "move", pointId },
      engine: { name: ENGINE_NAME, level }
    };
  } catch (error) {
    if (error?.code === "ENOENT") return { ok: false, reason: "unavailable" };
    if (error?.code === "ENGINE_TIMEOUT") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "error" };
  } finally {
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
    }
  }
}

function pointToSgfCoordinate(point, size) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= size || y >= size || x >= 26 || y >= 26) return null;
  return `${String.fromCharCode(97 + x)}${String.fromCharCode(97 + y)}`;
}

function pathForGtp(filePath) {
  const normalized = path.resolve(filePath).replaceAll("\\", "/");
  if (/\s/.test(normalized)) {
    const error = new Error("GNU Go temporary path must not contain whitespace");
    error.code = "ENGINE_TEMP_PATH";
    throw error;
  }
  return normalized;
}

function gtpColor(color) {
  return color === COLORS.white ? "white" : "black";
}

function engineLevel(difficulty) {
  return boundedInteger(difficulty?.engine?.level, 1, 1, 10);
}

function engineTimeout(difficulty) {
  return boundedInteger(difficulty?.engine?.timeoutMs, 2_000, 250, 15_000);
}

function engineCacheSize(difficulty) {
  return boundedInteger(difficulty?.engine?.cacheSizeMb, 8, 4, 64);
}

function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(number)));
}

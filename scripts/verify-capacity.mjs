import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import os from "node:os";
import { capacityProfile, runCapacityVerification } from "./capacityVerification.mjs";
import { preparePlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";
import { applyCapacityWindowsLimits } from "./capacityWindowsLimits.mjs";
import { stopTestProcesses } from "./stop-test-processes.mjs";
import { PrismaClient } from "@prisma/client";
import { sqliteClientOptions } from "../server/sqliteClientOptions.js";

const options = parseOptions(process.argv.slice(2), process.env);
const profile = capacityProfile(options.profile, options.overrides);
const externalBaseUrl = options.baseUrl;
let database = null;
let child = null;
let localServerEnv = null;
let auditDatabase = null;
await applyCapacityWindowsLimits("driver");

try {
  let baseUrl = externalBaseUrl;
  let restartServer = null;
  let localRestart = null;
  if (!baseUrl) {
    if (!options.skipBuild) runBuild();
    const port = await findFreePort();
    database = await preparePlaywrightTestDatabase({
      label: "capacity",
      port,
      runId: randomUUID(),
      manageSignals: false
    });
    baseUrl = `http://127.0.0.1:${port}`;
    localServerEnv = {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: database.databaseUrl,
      PUBLIC_ORIGIN: baseUrl,
      ZHIZI_ENABLED: "false",
      MAX_ONLINE_USERS: String(Math.max(profile.sockets + 50, Number(process.env.MAX_ONLINE_USERS) || 0)),
      MAX_ACTIVE_ROOMS: String(Math.max(profile.rooms + 10, Number(process.env.MAX_ACTIVE_ROOMS) || 0)),
      MAX_SPECTATORS_PER_ROOM: String(Math.max(profile.spectatorsPerRoom + 5, Number(process.env.MAX_SPECTATORS_PER_ROOM) || 0))
    };
    child = startServer(localServerEnv);
    database.trackProcess(child);
    await waitForReady(baseUrl, child);
    localRestart = async () => {
      await stopServer(child);
      child = startServer(localServerEnv);
      database.trackProcess(child);
      await waitForReady(baseUrl, child);
    };
    if (!options.skipRestart) restartServer = localRestart;
  }

  const report = await runCapacityVerification({
    baseUrl,
    profile,
    restartServer,
    restartAfterSetup: options.restartAfterSetup ? localRestart : null,
    verifySettlement: database && profile.recycleAfterMoves ? async ({ roomCode, playerIds, loserId, minMoves }) => {
      auditDatabase ??= new PrismaClient(sqliteClientOptions({ DATABASE_URL: database.databaseUrl }));
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        const rows = await auditDatabase.gameRecord.findMany({ where: { roomCode } });
        if (rows.length > 1) throw new Error(`Duplicate settlement for ${roomCode}`);
        if (rows.length === 1) {
          const record = rows[0];
          const winnerId = record.winnerColor === "black" ? record.blackUserId : record.whiteUserId;
          if (!record.settlementId || record.moveCount < minMoves || winnerId === loserId
            || !playerIds.includes(record.blackUserId) || !playerIds.includes(record.whiteUserId)
            || JSON.parse(record.snapshot).game.phase !== "finished") throw new Error(`Invalid persisted settlement ${roomCode}`);
          return;
        }
        await delay(100);
      }
      throw new Error(`Settlement not persisted: ${roomCode}`);
    } : null,
    password: options.password,
    onProgress: (message) => console.log(`[capacity] ${message}`)
  });
  report.environment = {
    platform: process.platform, node: process.version, cpu: os.cpus()[0]?.model,
    hostLogicalCpus: os.cpus().length, hostMemoryBytes: os.totalmem(),
    windowsLimits: process.env.CAPACITY_WINDOWS_LIMITS === "1",
    serverAffinity: process.env.CAPACITY_SERVER_AFFINITY ?? null,
    serverCommittedLimitMiB: process.env.CAPACITY_SERVER_MEMORY_MIB ?? null,
    hostFreeMemoryStopMiB: process.env.CAPACITY_MIN_FREE_MIB ?? null,
    driverAffinity: process.env.CAPACITY_DRIVER_AFFINITY ?? null
  };
  if (!report.thresholds.passed && child?.logs) report.localServerLogTail = child.logs;
  const reportPath = writeReport(report, options.reportDir);
  console.log(`[capacity] report: ${reportPath}`);
  console.log(JSON.stringify({
    topology: report.topology,
    coldLogins: report.client.coldLogins,
    actions: report.client.actions,
    reconnects: report.client.reconnects,
    restartResumes: report.client.restartResumes,
    processPeak: report.server.peak,
    errors: report.client.errorCount,
    thresholds: report.thresholds
  }, null, 2));
  if (!report.thresholds.passed) process.exitCode = 1;
} catch (error) {
  const reportPath = writeReport({ completedAt: new Date().toISOString(), profile,
    aborted: true, error: error.message, localServerLogTail: child?.logs ?? "", thresholds: { passed: false } }, options.reportDir);
  console.error(`[capacity] aborted report: ${reportPath}`);
  throw error;
} finally {
  await stopServer(child);
  await auditDatabase?.$disconnect();
  database?.cleanup();
}

function parseOptions(args, env) {
  const valueAfter = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const profile = valueAfter("--profile") ?? env.CAPACITY_PROFILE ?? "smoke";
  return {
    profile,
    baseUrl: valueAfter("--base-url") ?? env.CAPACITY_BASE_URL ?? "",
    password: env.CAPACITY_PASSWORD ?? "pwpass12",
    reportDir: env.CAPACITY_REPORT_DIR ?? path.resolve("artifacts", "capacity"),
    skipBuild: args.includes("--skip-build"),
    restartAfterSetup: args.includes("--restart-after-setup"),
    skipRestart: args.includes("--skip-restart") || Boolean(valueAfter("--base-url") ?? env.CAPACITY_BASE_URL),
    overrides: {
      sockets: numberOption(valueAfter("--sockets") ?? env.CAPACITY_SOCKETS),
      rooms: numberOption(valueAfter("--rooms") ?? env.CAPACITY_ROOMS),
      spectatorsPerRoom: numberOption(valueAfter("--spectators-per-room") ?? env.CAPACITY_SPECTATORS_PER_ROOM),
      durationMs: secondsOption(valueAfter("--duration") ?? env.CAPACITY_DURATION_SECONDS),
      actionIntervalMs: secondsOption(valueAfter("--action-interval") ?? env.CAPACITY_ACTION_INTERVAL_SECONDS),
      reconnectRatio: numberOption(valueAfter("--reconnect-ratio") ?? env.CAPACITY_RECONNECT_RATIO),
      actionMode: valueAfter("--action-mode") ?? env.CAPACITY_ACTION_MODE,
      registrationConcurrency: numberOption(valueAfter("--registration-concurrency") ?? env.CAPACITY_REGISTRATION_CONCURRENCY),
      staggerActions: args.includes("--stagger-actions"),
      recycleAfterMoves: numberOption(valueAfter("--recycle-after-moves")),
      httpReadsPerCycle: numberOption(valueAfter("--http-reads-per-cycle"))
    }
  };
}

function runBuild() {
  const result = spawnSync(...spawnArgs("npm", ["run", "build"]), {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Production build failed with status ${result.status}`);
}

function spawnArgs(command, args) {
  if (process.platform !== "win32") return [command, args];
  return ["cmd.exe", ["/d", "/s", "/c", [command, ...args].map(quoteCmdArgument).join(" ")]];
}

function quoteCmdArgument(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `"${text.replace(/(["^&|<>%])/g, "^$1")}"`;
}

function startServer(env) {
  const server = spawn(process.execPath, [path.resolve("scripts/start-capacity-server.mjs")], {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe", "ipc"]
  });
  server.logs = "";
  const append = (chunk) => {
    server.logs = `${server.logs}${chunk}`.slice(-100_000);
  };
  server.stdout.on("data", append);
  server.stderr.on("data", append);
  return server;
}

async function stopServer(server) {
  await stopTestProcesses([server], { graceMs: 20_000, shutdownMessage: { type: "shutdown" } });
}

async function waitForReady(baseUrl, server) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Capacity server exited early (${server.exitCode}):\n${server.logs}`);
    try {
      const response = await fetch(`${baseUrl}/health/ready`);
      if (response.ok) return;
    } catch {
      // Listener startup is still in progress.
    }
    await delay(100);
  }
  throw new Error(`Capacity server readiness timed out:\n${server.logs}`);
}

function writeReport(report, reportDir) {
  fs.mkdirSync(reportDir, { recursive: true });
  const timestamp = report.completedAt.replaceAll(/[:.]/g, "-");
  const reportPath = path.join(reportDir, `capacity-${timestamp}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function numberOption(value) {
  if (value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function secondsOption(value) {
  const seconds = numberOption(value);
  return seconds === undefined ? undefined : Math.max(1, Math.round(seconds * 1000));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

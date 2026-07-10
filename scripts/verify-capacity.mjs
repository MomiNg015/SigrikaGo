import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { capacityProfile, runCapacityVerification } from "./capacityVerification.mjs";
import { preparePlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";

const options = parseOptions(process.argv.slice(2), process.env);
const profile = capacityProfile(options.profile, options.overrides);
const externalBaseUrl = options.baseUrl;
let database = null;
let child = null;
let localServerEnv = null;

try {
  let baseUrl = externalBaseUrl;
  let restartServer = null;
  if (!baseUrl) {
    if (!options.skipBuild) runBuild();
    const port = await findFreePort();
    database = await preparePlaywrightTestDatabase({
      label: "capacity",
      port,
      runId: randomUUID()
    });
    baseUrl = `http://127.0.0.1:${port}`;
    localServerEnv = {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: database.databaseUrl,
      PUBLIC_ORIGIN: baseUrl,
      ADMIN_USERNAMES: "capadmin",
      MAX_ONLINE_USERS: String(Math.max(profile.sockets + 50, Number(process.env.MAX_ONLINE_USERS) || 0)),
      MAX_ACTIVE_ROOMS: String(Math.max(profile.rooms + 10, Number(process.env.MAX_ACTIVE_ROOMS) || 0)),
      MAX_SPECTATORS_PER_ROOM: String(Math.max(profile.spectatorsPerRoom + 5, Number(process.env.MAX_SPECTATORS_PER_ROOM) || 0))
    };
    child = startServer(localServerEnv);
    await waitForReady(baseUrl, child);
    if (!options.skipRestart) {
      restartServer = async () => {
        await stopServer(child);
        child = startServer(localServerEnv);
        await waitForReady(baseUrl, child);
      };
    }
  }

  const report = await runCapacityVerification({
    baseUrl,
    profile,
    restartServer,
    password: options.password,
    onProgress: (message) => console.log(`[capacity] ${message}`)
  });
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
} finally {
  await stopServer(child).catch(() => {});
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
    skipRestart: args.includes("--skip-restart") || Boolean(valueAfter("--base-url") ?? env.CAPACITY_BASE_URL),
    overrides: {
      sockets: numberOption(valueAfter("--sockets") ?? env.CAPACITY_SOCKETS),
      rooms: numberOption(valueAfter("--rooms") ?? env.CAPACITY_ROOMS),
      spectatorsPerRoom: numberOption(valueAfter("--spectators-per-room") ?? env.CAPACITY_SPECTATORS_PER_ROOM),
      durationMs: secondsOption(valueAfter("--duration") ?? env.CAPACITY_DURATION_SECONDS),
      actionIntervalMs: secondsOption(valueAfter("--action-interval") ?? env.CAPACITY_ACTION_INTERVAL_SECONDS),
      reconnectRatio: numberOption(valueAfter("--reconnect-ratio") ?? env.CAPACITY_RECONNECT_RATIO)
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
  if (!server || server.exitCode !== null) return;
  server.send?.({ type: "shutdown" });
  await waitForExit(server, 20_000);
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

function waitForExit(server, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (server.exitCode !== null) {
      resolve(server.exitCode);
      return;
    }
    const timeoutId = setTimeout(() => reject(new Error(`Capacity server shutdown timed out:\n${server.logs}`)), timeoutMs);
    server.once("exit", (code) => {
      clearTimeout(timeoutId);
      resolve(code);
    });
  });
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

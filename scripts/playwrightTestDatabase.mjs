import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

export async function preparePlaywrightTestDatabase({ label, port, runId = process.env.PLAYWRIGHT_RUN_ID ?? process.pid }) {
  const tempDir = path.resolve(".tmp", "playwright");
  fs.mkdirSync(tempDir, { recursive: true });
  const safeRunId = String(runId).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
  const databaseFileName = `${label}-${port}-${safeRunId}.db`;
  const databasePath = path.join(tempDir, databaseFileName);
  const databaseUrl = `file:../.tmp/playwright/${databaseFileName}`;
  process.env.DATABASE_URL = databaseUrl;

  cleanupPlaywrightTestDatabase({ databasePath });

  // Prisma 6's Windows schema engine cannot always create a brand-new SQLite
  // file itself, so let Prisma Client initialize a valid empty database first.
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    await database.$executeRawUnsafe("PRAGMA user_version = 0");
  } finally {
    await database.$disconnect();
  }

  const result = spawnSync(process.execPath, prismaCommandArgs(), {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8"
  });
  if (result.status !== 0) {
    fs.rmSync(databasePath, { force: true });
    const processError = result.error ? `\n${result.error.stack ?? result.error.message}` : "";
    throw new Error(`Failed to initialize Playwright database:\n${result.stdout ?? ""}\n${result.stderr ?? ""}${processError}`);
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    cleanupPlaywrightTestDatabase({ databasePath });
  };
  process.once("exit", cleanup);
  process.once("SIGINT", () => { cleanup(); process.exit(130); });
  process.once("SIGTERM", () => { cleanup(); process.exit(143); });
  return { cleanup, databasePath, databaseUrl };
}

export function cleanupPlaywrightTestDatabase({ label, port, runId, databasePath }) {
  const resolvedPath = databasePath ?? path.resolve(
    ".tmp",
    "playwright",
    `${label}-${port}-${String(runId).replaceAll(/[^a-zA-Z0-9_-]/g, "-")}.db`
  );
  for (const suffix of ["", "-journal", "-shm", "-wal"]) {
    fs.rmSync(`${resolvedPath}${suffix}`, { force: true, maxRetries: 5, retryDelay: 100 });
  }
}

function prismaCommandArgs() {
  return [
    path.resolve("node_modules", "prisma", "build", "index.js"),
    "db",
    "push",
    "--skip-generate",
    "--accept-data-loss"
  ];
}

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BASELINE_MIGRATION = "0_init";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(moduleDirectory, "..");
let PrismaClientConstructor;

export function migrationVerificationRoot(repositoryRoot = defaultRepositoryRoot) {
  return path.resolve(repositoryRoot, ".tmp", "migration-baseline");
}

export function assertDisposableDatabasePath(databasePath, repositoryRoot = defaultRepositoryRoot) {
  const resolvedDatabasePath = path.resolve(databasePath);
  const repositoryDevDatabase = path.resolve(repositoryRoot, "prisma", "dev.db");
  const allowedRoot = migrationVerificationRoot(repositoryRoot);
  const relativePath = path.relative(allowedRoot, resolvedDatabasePath);
  const isInsideAllowedRoot = relativePath !== "" && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath);

  if (resolvedDatabasePath === repositoryDevDatabase || !isInsideAllowedRoot) {
    throw new Error(`Migration verification database must be a disposable file under ${allowedRoot}`);
  }

  return resolvedDatabasePath;
}

export function sqliteDatabaseUrl(databasePath, repositoryRoot = defaultRepositoryRoot) {
  const safePath = assertDisposableDatabasePath(databasePath, repositoryRoot);
  const schemaDirectory = path.resolve(repositoryRoot, "prisma");
  return `file:${path.relative(schemaDirectory, safePath).replaceAll(path.sep, "/")}`;
}

function runPrisma(argumentsList, { databaseUrl, repositoryRoot }) {
  const prismaCli = path.resolve(repositoryRoot, "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, ...argumentsList], {
    cwd: repositoryRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error([
      `Prisma command failed (${argumentsList.join(" ")}) with status ${result.status}.`,
      result.error?.stack ?? result.error?.message,
      result.stdout,
      result.stderr
    ].filter(Boolean).join("\n"));
  }

  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

async function withPrisma(databaseUrl, operation) {
  if (!PrismaClientConstructor) {
    ({ PrismaClient: PrismaClientConstructor } = await import("@prisma/client"));
  }
  const prisma = new PrismaClientConstructor({ datasources: { db: { url: databaseUrl } } });
  try {
    return await operation(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function initializeEmptySqlite(databaseUrl) {
  await withPrisma(databaseUrl, (prisma) => prisma.$executeRawUnsafe("PRAGMA user_version = 0"));
}

function activeMigrationNames(repositoryRoot) {
  const migrationsRoot = path.resolve(repositoryRoot, "prisma", "migrations");
  return fs.readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((migrationName) => fs.existsSync(path.join(migrationsRoot, migrationName, "migration.sql")))
    .sort();
}

async function assertCompletedMigrationHistory(prisma, expectedMigrationNames) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY migration_name"
  );
  const migrationNames = rows.map((row) => row.migration_name);
  if (rows.length !== expectedMigrationNames.length
    || rows.some((row) => !row.finished_at)
    || migrationNames.some((name, index) => name !== expectedMigrationNames[index])) {
    throw new Error(`Completed migration history did not match ${expectedMigrationNames.join(", ")}.`);
  }
}

function assertSchemaMatches({ databaseUrl, repositoryRoot, schemaPath }) {
  const databasePath = path.resolve(path.dirname(schemaPath), databaseUrl.slice("file:".length));
  const absoluteDatabaseUrl = `file:${databasePath.replaceAll(path.sep, "/")}`;
  runPrisma([
    "migrate",
    "diff",
    "--from-url",
    absoluteDatabaseUrl,
    "--to-schema-datamodel",
    schemaPath,
    "--exit-code"
  ], { databaseUrl, repositoryRoot });
}

async function verifyFreshDatabase({ databaseUrl, expectedMigrationNames, repositoryRoot, schemaPath }) {
  console.log("[migration-baseline] fresh database: migrate deploy");
  // Prisma 6's Windows schema engine cannot reliably create the SQLite file itself.
  // Initializing an otherwise-empty file keeps this verification portable without adding tables.
  await initializeEmptySqlite(databaseUrl);
  runPrisma(["migrate", "deploy", "--schema", schemaPath], { databaseUrl, repositoryRoot });
  runPrisma(["migrate", "deploy", "--schema", schemaPath], { databaseUrl, repositoryRoot });
  runPrisma(["migrate", "status", "--schema", schemaPath], { databaseUrl, repositoryRoot });
  assertSchemaMatches({ databaseUrl, repositoryRoot, schemaPath });

  await withPrisma(databaseUrl, (prisma) => assertCompletedMigrationHistory(prisma, expectedMigrationNames));
}

async function verifyExistingDatabaseAdoption({ databaseUrl, expectedMigrationNames, repositoryRoot, schemaPath }) {
  console.log("[migration-baseline] existing database fixture: baseline schema and sentinel seed");
  await initializeEmptySqlite(databaseUrl);
  const baselineSqlPath = path.resolve(repositoryRoot, "prisma", "migrations", BASELINE_MIGRATION, "migration.sql");
  runPrisma(["db", "execute", "--file", baselineSqlPath, "--schema", schemaPath], { databaseUrl, repositoryRoot });

  const sentinel = {
    id: "migration-baseline-sentinel",
    username: "baseline_sentinel",
    passwordHash: "not-a-login-credential"
  };
  await withPrisma(databaseUrl, (prisma) => prisma.$executeRawUnsafe(
    'INSERT INTO "User" ("id", "username", "passwordHash", "updatedAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    sentinel.id,
    sentinel.username,
    sentinel.passwordHash
  ));

  console.log("[migration-baseline] existing database fixture: resolve baseline and deploy");
  runPrisma([
    "migrate",
    "resolve",
    "--applied",
    BASELINE_MIGRATION,
    "--schema",
    schemaPath
  ], { databaseUrl, repositoryRoot });
  runPrisma(["migrate", "deploy", "--schema", schemaPath], { databaseUrl, repositoryRoot });
  runPrisma(["migrate", "deploy", "--schema", schemaPath], { databaseUrl, repositoryRoot });
  runPrisma(["migrate", "status", "--schema", schemaPath], { databaseUrl, repositoryRoot });
  assertSchemaMatches({ databaseUrl, repositoryRoot, schemaPath });

  await withPrisma(databaseUrl, async (prisma) => {
    const [preserved] = await prisma.$queryRawUnsafe(
      'SELECT "username", "passwordHash" FROM "User" WHERE "id" = ?',
      sentinel.id
    );
    if (preserved?.username !== sentinel.username || preserved?.passwordHash !== sentinel.passwordHash) {
      throw new Error("Existing database sentinel data was not preserved during baseline adoption.");
    }
    await assertCompletedMigrationHistory(prisma, expectedMigrationNames);
  });
}

export async function verifyMigrationBaseline({ repositoryRoot = defaultRepositoryRoot } = {}) {
  const resolvedRepositoryRoot = path.resolve(repositoryRoot);
  const schemaPath = path.resolve(resolvedRepositoryRoot, "prisma", "schema.prisma");
  const expectedMigrationNames = activeMigrationNames(resolvedRepositoryRoot);
  if (expectedMigrationNames[0] !== BASELINE_MIGRATION) {
    throw new Error(`Active migration history must begin with ${BASELINE_MIGRATION}.`);
  }

  const verificationRoot = migrationVerificationRoot(resolvedRepositoryRoot);
  fs.mkdirSync(verificationRoot, { recursive: true });
  const runDirectory = fs.mkdtempSync(path.join(verificationRoot, "run-"));
  const freshDatabaseUrl = sqliteDatabaseUrl(path.join(runDirectory, "fresh.db"), resolvedRepositoryRoot);
  const existingDatabaseUrl = sqliteDatabaseUrl(path.join(runDirectory, "existing.db"), resolvedRepositoryRoot);

  try {
    runPrisma(["generate", "--schema", schemaPath], {
      databaseUrl: freshDatabaseUrl,
      repositoryRoot: resolvedRepositoryRoot
    });
    await verifyFreshDatabase({
      databaseUrl: freshDatabaseUrl,
      expectedMigrationNames,
      repositoryRoot: resolvedRepositoryRoot,
      schemaPath
    });
    await verifyExistingDatabaseAdoption({
      databaseUrl: existingDatabaseUrl,
      expectedMigrationNames,
      repositoryRoot: resolvedRepositoryRoot,
      schemaPath
    });
    console.log("[migration-baseline] verification passed");
  } finally {
    fs.rmSync(runDirectory, { recursive: true, force: true });
  }
}

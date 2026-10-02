import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(moduleDirectory, "..");
let PrismaClientConstructor;

export function backupVerificationRoot(repositoryRoot = defaultRepositoryRoot) {
  return path.resolve(repositoryRoot, ".tmp", "backup-restore");
}

export function assertDisposableBackupPath(databasePath, repositoryRoot = defaultRepositoryRoot) {
  const resolvedPath = path.resolve(databasePath);
  const allowedRoot = backupVerificationRoot(repositoryRoot);
  const relativePath = path.relative(allowedRoot, resolvedPath);
  const inside = relativePath !== "" && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath);
  if (!inside || resolvedPath === path.resolve(repositoryRoot, "prisma", "dev.db")) {
    throw new Error(`Backup verification database must be a disposable file under ${allowedRoot}`);
  }
  return resolvedPath;
}

export function resolveOperatorBackupPaths({
  sourcePath,
  outputPath,
  repositoryRoot = defaultRepositoryRoot,
  allowDevDatabase = false
}) {
  if (!sourcePath || !outputPath) throw new Error("SQLite backup requires explicit --source and --output paths");
  const source = path.resolve(sourcePath);
  const output = path.resolve(outputPath);
  if (source === output) throw new Error("SQLite backup output must not overwrite the source database");
  if (!allowDevDatabase && source === path.resolve(repositoryRoot, "prisma", "dev.db")) {
    throw new Error("Refusing to back up prisma/dev.db without --allow-dev-database");
  }
  return { source, output };
}

export async function backupSqliteDatabase(options) {
  const { source, output } = resolveOperatorBackupPaths(options);
  if (!fs.statSync(source, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`SQLite backup source does not exist: ${source}`);
  }
  if (fs.existsSync(output)) throw new Error(`SQLite backup output already exists: ${output}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });

  await withPrisma(source, async (prisma) => {
    const escapedOutput = output.replaceAll("'", "''").replaceAll(path.sep, "/");
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedOutput}'`);
  });
  await assertSqliteIntegrity(output);
  return { source, output, bytes: fs.statSync(output).size };
}

export async function verifyBackupRestore({ repositoryRoot = defaultRepositoryRoot } = {}) {
  const resolvedRoot = path.resolve(repositoryRoot);
  const verificationRoot = backupVerificationRoot(resolvedRoot);
  fs.mkdirSync(verificationRoot, { recursive: true });
  const runDirectory = fs.mkdtempSync(path.join(verificationRoot, "run-"));
  const sourcePath = assertDisposableBackupPath(path.join(runDirectory, "source.db"), resolvedRoot);
  const backupPath = assertDisposableBackupPath(path.join(runDirectory, "backup.db"), resolvedRoot);
  const restorePath = assertDisposableBackupPath(path.join(runDirectory, "restored.db"), resolvedRoot);
  const sentinel = {
    id: "backup-restore-sentinel",
    username: "backup_sentinel",
    passwordHash: "not-a-login-credential"
  };

  try {
    runPrisma(["generate", "--schema", path.join(resolvedRoot, "prisma", "schema.prisma")], resolvedRoot, sourcePath);
    await withPrisma(sourcePath, (prisma) => prisma.$executeRawUnsafe("PRAGMA user_version = 0"));
    runPrisma(["migrate", "deploy", "--schema", path.join(resolvedRoot, "prisma", "schema.prisma")], resolvedRoot, sourcePath);
    await withPrisma(sourcePath, (prisma) => prisma.$executeRawUnsafe(
      'INSERT INTO "User" ("id", "username", "passwordHash", "updatedAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      sentinel.id,
      sentinel.username,
      sentinel.passwordHash
    ));

    const backup = await backupSqliteDatabase({
      sourcePath,
      outputPath: backupPath,
      repositoryRoot: resolvedRoot
    });
    await withPrisma(sourcePath, (prisma) => prisma.$executeRawUnsafe(
      'UPDATE "User" SET "username" = ? WHERE "id" = ?',
      "source_changed_after_backup",
      sentinel.id
    ));
    fs.copyFileSync(backupPath, restorePath, fs.constants.COPYFILE_EXCL);
    await assertSqliteIntegrity(restorePath);
    await withPrisma(restorePath, async (prisma) => {
      const [row] = await prisma.$queryRawUnsafe(
        'SELECT "username", "passwordHash" FROM "User" WHERE "id" = ?',
        sentinel.id
      );
      if (row?.username !== sentinel.username || row?.passwordHash !== sentinel.passwordHash) {
        throw new Error("Restored SQLite sentinel did not match the backed-up data");
      }
    });
    console.log(`[backup-restore] verification passed (${backup.bytes} bytes)`);
    return { bytes: backup.bytes };
  } finally {
    fs.rmSync(runDirectory, { recursive: true, force: true });
  }
}

async function assertSqliteIntegrity(databasePath) {
  await withPrisma(databasePath, async (prisma) => {
    const rows = await prisma.$queryRawUnsafe("PRAGMA integrity_check");
    const result = rows.map((row) => String(Object.values(row)[0] ?? "").toLowerCase());
    if (result.length !== 1 || result[0] !== "ok") {
      throw new Error(`SQLite integrity_check failed for ${databasePath}: ${result.join(", ")}`);
    }
  });
}

async function withPrisma(databasePath, operation) {
  if (!PrismaClientConstructor) {
    ({ PrismaClient: PrismaClientConstructor } = await import("@prisma/client"));
  }
  const databaseUrl = `file:${path.resolve(databasePath).replaceAll(path.sep, "/")}`;
  const prisma = new PrismaClientConstructor({ datasources: { db: { url: databaseUrl } } });
  try {
    return await operation(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

function runPrisma(args, repositoryRoot, databasePath) {
  const prismaCli = path.resolve(repositoryRoot, "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      DATABASE_URL: `file:${path.resolve(databasePath).replaceAll(path.sep, "/")}`
    },
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error([
      `Prisma command failed (${args.join(" ")}) with status ${result.status}`,
      result.error?.message,
      result.stdout,
      result.stderr
    ].filter(Boolean).join("\n"));
  }
}

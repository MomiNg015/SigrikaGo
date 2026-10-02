import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertDisposableBackupPath,
  backupVerificationRoot,
  resolveOperatorBackupPaths
} from "./sqliteBackupVerification.mjs";

const repositoryRoot = path.resolve(".");

describe("SQLite backup and restore verification", () => {
  it("confines automated verification to its disposable root", () => {
    const disposable = path.join(backupVerificationRoot(repositoryRoot), "test-run", "source.db");
    expect(assertDisposableBackupPath(disposable, repositoryRoot)).toBe(path.resolve(disposable));
    expect(() => assertDisposableBackupPath(path.join(repositoryRoot, "prisma", "dev.db"), repositoryRoot)).toThrow(
      /disposable file/
    );
    expect(() => assertDisposableBackupPath(path.join(repositoryRoot, "outside.db"), repositoryRoot)).toThrow(
      /disposable file/
    );
  });

  it("requires explicit distinct operator paths and protects the development database by default", () => {
    expect(() => resolveOperatorBackupPaths({ sourcePath: "", outputPath: "backup.db", repositoryRoot })).toThrow(
      /explicit/
    );
    expect(() => resolveOperatorBackupPaths({ sourcePath: "same.db", outputPath: "same.db", repositoryRoot })).toThrow(
      /must not overwrite/
    );
    expect(() => resolveOperatorBackupPaths({
      sourcePath: path.join(repositoryRoot, "prisma", "dev.db"),
      outputPath: "backup.db",
      repositoryRoot
    })).toThrow(/allow-dev-database/);
  });

  it("exposes backup and disposable restore verification commands", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
    expect(packageJson.scripts["backup:sqlite"]).toBe("node scripts/backup-sqlite.mjs");
    expect(packageJson.scripts["verify:backup-restore"]).toBe("node scripts/verify-backup-restore.mjs");
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BASELINE_MIGRATION,
  assertDisposableDatabasePath,
  migrationVerificationRoot,
  sqliteDatabaseUrl
} from "./migrationBaselineVerification.mjs";

const repositoryRoot = path.resolve(".");

describe("Prisma migration baseline verification", () => {
  it("only permits disposable databases below the migration verification root", () => {
    const disposablePath = path.join(migrationVerificationRoot(repositoryRoot), "test-run", "fixture.db");

    expect(assertDisposableDatabasePath(disposablePath, repositoryRoot)).toBe(path.resolve(disposablePath));
    expect(sqliteDatabaseUrl(disposablePath, repositoryRoot)).toBe("file:../.tmp/migration-baseline/test-run/fixture.db");
    expect(() => assertDisposableDatabasePath(path.join(repositoryRoot, "prisma", "dev.db"), repositoryRoot)).toThrow(
      /disposable file/
    );
    expect(() => assertDisposableDatabasePath(path.join(repositoryRoot, "outside.db"), repositoryRoot)).toThrow(
      /disposable file/
    );
  });

  it("keeps one full SQLite baseline as the active migration history", () => {
    const migrationsRoot = path.join(repositoryRoot, "prisma", "migrations");
    const migrationDirectories = fs.readdirSync(migrationsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const migrationSql = fs.readFileSync(
      path.join(migrationsRoot, BASELINE_MIGRATION, "migration.sql"),
      "utf8"
    );
    const schema = fs.readFileSync(path.join(repositoryRoot, "prisma", "schema.prisma"), "utf8");
    const modelNames = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);
    const migrationLock = fs.readFileSync(path.join(migrationsRoot, "migration_lock.toml"), "utf8");

    expect(migrationDirectories).toEqual([BASELINE_MIGRATION]);
    for (const modelName of modelNames) {
      expect(migrationSql).toContain(`CREATE TABLE "${modelName}"`);
    }
    expect(migrationLock).toContain('provider = "sqlite"');
  });

  it("exposes the disposable end-to-end verifier through npm", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
    expect(packageJson.scripts["verify:migrations"]).toBe("node scripts/verify-migration-baseline.mjs");
  });
});

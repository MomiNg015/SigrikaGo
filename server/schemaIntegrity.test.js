import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");

describe("Prisma schema integrity", () => {
  it("keeps Chinese defaults readable and aligned with rating defaults", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain('rank               String   @default("2段")');
    expect(schema).toContain('@default("{fromColor}{player}使用了{character}的“{skill}”技能，目标是{point}。")');
    expect(schema).not.toMatch(/[�绾鈥]/);
  });

  it("tracks the UserRelationship table through a migration", () => {
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202605220001_add_user_relationship",
      "migration.sql"
    );

    expect(existsSync(migrationPath)).toBe(true);
    expect(readFileSync(migrationPath, "utf8")).toContain("CREATE TABLE IF NOT EXISTS UserRelationship");
  });

  it("tracks feedback messages through a migration", () => {
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202605250001_add_feedback_message",
      "migration.sql"
    );

    expect(existsSync(migrationPath)).toBe(true);
    expect(readFileSync(migrationPath, "utf8")).toContain("CREATE TABLE IF NOT EXISTS \"FeedbackMessage\"");
  });

  it("tracks persisted rooms through a migration", () => {
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202605270001_add_persisted_rooms",
      "migration.sql"
    );

    expect(existsSync(migrationPath)).toBe(true);
    expect(readFileSync(migrationPath, "utf8")).toContain("CREATE TABLE IF NOT EXISTS \"PersistedRoom\"");
  });
});

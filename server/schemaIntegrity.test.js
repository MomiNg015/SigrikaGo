import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");

describe("Prisma schema integrity", () => {
  it("keeps Chinese defaults readable and aligned with rating defaults", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain('rank               String   @default("3段")');
    expect(schema).toContain('recentResults String @default("")');
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

  it("tracks structured user assets and progress ledgers through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606050001_add_structured_user_assets",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");

    for (const modelName of [
      "UserCharacter",
      "UserDecoration",
      "UserItem",
      "UserItemEffect",
      "UserProgressLedger"
    ]) {
      expect(schema).toContain(`model ${modelName}`);
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS "${modelName}"`);
    }
  });

  it("tracks gacha pools, rewards, blue gems, and character chains through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606120002_add_gacha_system",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");

    expect(schema).toContain("blueGems");
    expect(schema).toContain("chainCount");
    expect(schema).toContain("featuredPrizeIds");
    expect(migration).toContain('"featuredPrizeIds" TEXT');
    for (const modelName of [
      "GachaPool",
      "GachaPrize",
      "GachaDraw",
      "GachaDrawReward"
    ]) {
      expect(schema).toContain(`model ${modelName}`);
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS "${modelName}"`);
    }
  });
});

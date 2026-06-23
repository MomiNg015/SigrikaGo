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

  it("tracks profile likes and user reports through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606190001_add_user_likes_reports",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");

    expect(schema).toContain("model UserProfileLike");
    expect(schema).toContain("model UserReport");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"UserProfileLike\"");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"UserReport\"");
  });

  it("tracks rating audit fields on game records through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606200001_add_rating_audit_fields",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");

    for (const field of [
      "rated",
      "matchSource",
      "blackRatingDelta",
      "whiteRatingDelta",
      "blackCoinsDelta",
      "whiteCoinsDelta",
      "blackRankDelta",
      "whiteRankDelta"
    ]) {
      expect(schema).toContain(field);
      expect(migration).toContain(field);
    }
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

  it("tracks mailbox batches and messages through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606220001_add_mailbox_system",
      "migration.sql"
    );
    const softDeleteMigrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606220002_soft_delete_mailbox_messages",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");
    const softDeleteMigration = readFileSync(softDeleteMigrationPath, "utf8");

    for (const modelName of [
      "MailboxBatch",
      "MailboxMessage"
    ]) {
      expect(schema).toContain(`model ${modelName}`);
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS "${modelName}"`);
    }
    expect(schema).toContain("mailboxMessages   MailboxMessage[]");
    expect(schema).toContain("deletedAt");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS \"MailboxMessage_userId_createdAt_idx\"");
    expect(softDeleteMigration).toContain("ALTER TABLE \"MailboxMessage\" ADD COLUMN \"deletedAt\"");
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

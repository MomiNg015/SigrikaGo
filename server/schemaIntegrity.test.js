import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
const migrationsPath = join(process.cwd(), "prisma", "migrations");

function readActiveMigrationSql() {
  return readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(migrationsPath, entry.name, "migration.sql"))
    .filter((migrationPath) => existsSync(migrationPath))
    .sort()
    .map((migrationPath) => readFileSync(migrationPath, "utf8"))
    .join("\n");
}

const migrationSql = readActiveMigrationSql();

describe("Prisma schema integrity", () => {
  it("keeps Chinese defaults readable and aligned with rating defaults", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain('rank               String   @default("3段")');
    expect(schema).toContain('recentResults String @default("")');
    expect(schema).toContain('@default("{fromColor}{player}使用了{character}的“{skill}”技能，目标是{point}。")');
    expect(schema).not.toMatch(/[\ufffd\u7efe\u9225]/);
  });

  it("tracks the UserRelationship table through a migration", () => {
    expect(migrationSql).toMatch(/CREATE TABLE(?: IF NOT EXISTS)? "?UserRelationship"?/);
  });

  it("tracks feedback messages through a migration", () => {
    expect(migrationSql).toMatch(/CREATE TABLE(?: IF NOT EXISTS)? "FeedbackMessage"/);
  });

  it("tracks profile likes and user reports through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    expect(schema).toContain("model UserProfileLike");
    expect(schema).toContain("model UserReport");
    expect(migrationSql).toMatch(/CREATE TABLE(?: IF NOT EXISTS)? "UserProfileLike"/);
    expect(migrationSql).toMatch(/CREATE TABLE(?: IF NOT EXISTS)? "UserReport"/);
  });

  it("tracks rating audit fields on game records through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
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
      expect(migrationSql).toContain(`"${field}"`);
    }
  });

  it("indexes game record history queries through schema, migration, and runtime guard", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const runtimeGuard = readFileSync(join(process.cwd(), "server", "db.js"), "utf8");

    for (const indexName of [
      "GameRecord_blackUserId_createdAt_idx",
      "GameRecord_whiteUserId_createdAt_idx",
      "GameRecord_mode_rated_createdAt_idx"
    ]) {
      expect(migrationSql).toContain(indexName);
      expect(runtimeGuard).toContain(indexName);
    }
    expect(schema).toContain("@@index([blackUserId, createdAt])");
    expect(schema).toContain("@@index([whiteUserId, createdAt])");
    expect(schema).toContain("@@index([mode, rated, createdAt])");
  });

  it("tracks persisted rooms through a migration", () => {
    expect(migrationSql).toMatch(/CREATE TABLE(?: IF NOT EXISTS)? "PersistedRoom"/);
  });

  it("tracks character credit fields through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    expect(schema).toContain("cvName");
    expect(schema).toContain("cvUrl");
    expect(schema).toContain("illustName");
    expect(schema).toContain("illustUrl");
    expect(migrationSql).toContain('"cvName" TEXT');
    expect(migrationSql).toContain('"cvUrl" TEXT');
    expect(migrationSql).toContain('"illustName" TEXT');
    expect(migrationSql).toContain('"illustUrl" TEXT');
  });

  it("tracks the skill trait glossary through schema, migration, and runtime guard", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const runtimeGuard = readFileSync(join(process.cwd(), "server", "skillTraits.js"), "utf8");

    expect(schema).toContain("model SkillTrait");
    expect(schema).toContain("name       String   @unique");
    expect(migrationSql).toMatch(/CREATE TABLE(?: IF NOT EXISTS)? "SkillTrait"/);
    expect(migrationSql).toContain('"SkillTrait_name_key"');
    expect(runtimeGuard).toContain('CREATE TABLE IF NOT EXISTS "SkillTrait"');
  });

  it("tracks shop item illustration credit fields through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain("illustName");
    expect(schema).toContain("illustUrl");
    expect(migrationSql).toContain('"illustName" TEXT');
    expect(migrationSql).toContain('"illustUrl" TEXT');
  });

  it("tracks structured user assets and progress ledgers through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");

    for (const modelName of [
      "UserCharacter",
      "UserDecoration",
      "UserItem",
      "UserItemEffect",
      "UserProgressLedger"
    ]) {
      expect(schema).toContain(`model ${modelName}`);
      expect(migrationSql).toMatch(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? "${modelName}"`));
    }
  });

  it("tracks mailbox batches and messages through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");

    for (const modelName of [
      "MailboxBatch",
      "MailboxMessage"
    ]) {
      expect(schema).toContain(`model ${modelName}`);
      expect(migrationSql).toMatch(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? "${modelName}"`));
    }
    expect(schema).toContain("mailboxMessages   MailboxMessage[]");
    expect(schema).toContain("deletedAt");
    expect(migrationSql).toContain('"MailboxMessage_userId_createdAt_idx"');
    expect(migrationSql).toContain('"deletedAt" DATETIME');
  });

  it("tracks announcements and read state through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");

    for (const modelName of [
      "AnnouncementEntry",
      "AnnouncementRead"
    ]) {
      expect(schema).toContain(`model ${modelName}`);
      expect(migrationSql).toMatch(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? "${modelName}"`));
    }
    expect(schema).toContain("announcementReads AnnouncementRead[]");
    expect(migrationSql).toContain('"AnnouncementRead_userId_announcementId_key"');
    expect(migrationSql).toContain('"AnnouncementEntry_kind_isPublished_deletedAt_pinned_firstPublishedAt_idx"');
  });

  it("tracks onboarding story scripts and automatic touch state through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain("model OnboardingStoryScript");
    expect(schema).toContain("onboardingRequired");
    expect(schema).toContain("onboardingAutoShownAt");
    expect(schema).toContain("onboardingCompletedAt");
    expect(migrationSql).toMatch(/CREATE TABLE(?: IF NOT EXISTS)? "OnboardingStoryScript"/);
    expect(migrationSql).toContain('"onboardingRequired" BOOLEAN');
    expect(migrationSql).toContain('"onboardingAutoShownAt" DATETIME');
    expect(migrationSql).toContain('"onboardingCompletedAt" DATETIME');
  });

  it("tracks Aemeath acquisition state through schema and the idempotent startup migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const startupMigration = readFileSync(join(process.cwd(), "server", "aemeathAcquisition.js"), "utf8");

    expect(schema).toContain('ownedCharacters    String   @default("sigrika,denia")');
    expect(schema).toContain("welcomeMailNoticeShownAt DateTime?");
    expect(migrationSql).toContain('"welcomeMailNoticeShownAt" DATETIME');
    expect(startupMigration).toContain("migrateLegacyAemeathOwnership");
    expect(startupMigration).toContain("AEMEATH_OWNERSHIP_MIGRATION_MARKER");
    expect(startupMigration).toContain("userCharacter?.upsert");
  });

  it("tracks generic story scripts through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain("model StoryScript");
    expect(schema).toContain("triggerParamsJson");
    expect(schema).toContain("draftInitialBoardJson");
    expect(schema).toContain("publishedInitialBoardJson");
    expect(schema).toContain("@@index([triggerType, isPublished])");
    expect(migrationSql).toMatch(/CREATE TABLE(?: IF NOT EXISTS)? "StoryScript"/);
    expect(migrationSql).toContain('"StoryScript_key_key"');
    expect(migrationSql).toContain('"StoryScript_triggerType_isPublished_idx"');
    expect(migrationSql).toContain('"draftInitialBoardJson" TEXT');
    expect(migrationSql).toContain('"publishedInitialBoardJson" TEXT');
  });

  it("regenerates Prisma Client before server entrypoints", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(packageJson.scripts["predev:server"]).toBe("prisma generate");
    expect(packageJson.scripts.prestart).toBe("prisma generate");
  });

  it("tracks gacha pools, rewards, blue gems, and character chains through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain("blueGems");
    expect(schema).toContain("chainCount");
    expect(schema).toContain("featuredPrizeIds");
    expect(migrationSql).toContain('"featuredPrizeIds" TEXT');
    for (const modelName of [
      "GachaPool",
      "GachaPrize",
      "GachaDraw",
      "GachaDrawReward"
    ]) {
      expect(schema).toContain(`model ${modelName}`);
      expect(migrationSql).toMatch(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? "${modelName}"`));
    }
  });
});

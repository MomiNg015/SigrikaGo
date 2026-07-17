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
    expect(schema).not.toMatch(/[\ufffd\u7efe\u9225]/);
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

  it("indexes game record history queries through schema, migration, and runtime guard", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migration = readFileSync(join(
      process.cwd(),
      "prisma",
      "migrations",
      "202607100001_add_game_record_query_indexes",
      "migration.sql"
    ), "utf8");
    const runtimeGuard = readFileSync(join(process.cwd(), "server", "db.js"), "utf8");

    for (const indexName of [
      "GameRecord_blackUserId_createdAt_idx",
      "GameRecord_whiteUserId_createdAt_idx",
      "GameRecord_mode_rated_createdAt_idx"
    ]) {
      expect(migration).toContain(indexName);
      expect(runtimeGuard).toContain(indexName);
    }
    expect(schema).toContain("@@index([blackUserId, createdAt])");
    expect(schema).toContain("@@index([whiteUserId, createdAt])");
    expect(schema).toContain("@@index([mode, rated, createdAt])");
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

  it("tracks character CV fields through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606300001_add_character_cv_fields",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");

    expect(schema).toContain("cvName");
    expect(schema).toContain("cvUrl");
    expect(migration).toContain("ALTER TABLE \"Character\" ADD COLUMN \"cvName\"");
    expect(migration).toContain("ALTER TABLE \"Character\" ADD COLUMN \"cvUrl\"");
  });

  it("tracks the skill trait glossary through schema, migration, and runtime guard", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migration = readFileSync(join(
      process.cwd(),
      "prisma",
      "migrations",
      "202607130001_add_skill_traits",
      "migration.sql"
    ), "utf8");
    const runtimeGuard = readFileSync(join(process.cwd(), "server", "skillTraits.js"), "utf8");

    expect(schema).toContain("model SkillTrait");
    expect(schema).toContain("name       String   @unique");
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "SkillTrait"');
    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "SkillTrait_name_key"');
    expect(runtimeGuard).toContain('CREATE TABLE IF NOT EXISTS "SkillTrait"');
  });

  it("tracks shop item illustration credit fields through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606300002_add_shop_item_illust_fields",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");

    expect(schema).toContain("illustName");
    expect(schema).toContain("illustUrl");
    expect(migration).toContain("ALTER TABLE \"ShopItem\" ADD COLUMN \"illustName\"");
    expect(migration).toContain("ALTER TABLE \"ShopItem\" ADD COLUMN \"illustUrl\"");
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

  it("tracks announcements and read state through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606280001_add_announcements",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");

    for (const modelName of [
      "AnnouncementEntry",
      "AnnouncementRead"
    ]) {
      expect(schema).toContain(`model ${modelName}`);
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS "${modelName}"`);
    }
    expect(schema).toContain("announcementReads AnnouncementRead[]");
    expect(migration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS \"AnnouncementRead_userId_announcementId_key\"");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS \"AnnouncementEntry_kind_isPublished_deletedAt_pinned_firstPublishedAt_idx\"");
  });

  it("tracks onboarding story scripts and automatic touch state through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606280002_add_onboarding_story",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");
    const completionMigration = readFileSync(join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606290002_add_onboarding_completed_at",
      "migration.sql"
    ), "utf8");

    expect(schema).toContain("model OnboardingStoryScript");
    expect(schema).toContain("onboardingRequired");
    expect(schema).toContain("onboardingAutoShownAt");
    expect(schema).toContain("onboardingCompletedAt");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"OnboardingStoryScript\"");
    expect(migration).toContain("ALTER TABLE \"User\" ADD COLUMN \"onboardingRequired\"");
    expect(migration).toContain("ALTER TABLE \"User\" ADD COLUMN \"onboardingAutoShownAt\"");
    expect(completionMigration).toContain("ALTER TABLE \"User\" ADD COLUMN \"onboardingCompletedAt\"");
  });

  it("tracks the Aemeath acquisition migration and new-user mail notice state", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migration = readFileSync(join(
      process.cwd(),
      "prisma",
      "migrations",
      "202607170002_aemeath_ticket_acquisition",
      "migration.sql"
    ), "utf8");

    expect(schema).toContain('ownedCharacters    String   @default("sigrika,denia")');
    expect(schema).toContain("welcomeMailNoticeShownAt DateTime?");
    expect(migration).toContain('ADD COLUMN "welcomeMailNoticeShownAt"');
    expect(migration).toContain("'aemeath'");
    expect(migration).toContain('INSERT OR IGNORE INTO "UserCharacter"');
  });

  it("tracks generic story scripts through a migration", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const migrationPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606280003_add_story_scripts",
      "migration.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");
    const tutorialMigration = readFileSync(join(
      process.cwd(),
      "prisma",
      "migrations",
      "202606290001_add_story_tutorial_initial_board",
      "migration.sql"
    ), "utf8");

    expect(schema).toContain("model StoryScript");
    expect(schema).toContain("triggerParamsJson");
    expect(schema).toContain("draftInitialBoardJson");
    expect(schema).toContain("publishedInitialBoardJson");
    expect(schema).toContain("@@index([triggerType, isPublished])");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"StoryScript\"");
    expect(migration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS \"StoryScript_key_key\"");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS \"StoryScript_triggerType_isPublished_idx\"");
    expect(tutorialMigration).toContain("draftInitialBoardJson");
    expect(tutorialMigration).toContain("publishedInitialBoardJson");
  });

  it("regenerates Prisma Client before server entrypoints", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(packageJson.scripts["predev:server"]).toBe("prisma generate");
    expect(packageJson.scripts.prestart).toBe("prisma generate");
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

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ensureOnboardingStorySchema } from "./onboardingStory.js";
import { ensureMailboxSchema } from "./mailbox.js";
import { finishHomeOnboarding, getHomeOnboarding, startHomeOnboarding } from "./homeOnboarding.js";

vi.mock("./storyScripts.js", async (original) => ({
  ...await original(),
  getPublishedStoryScriptForTrigger: vi.fn(async () => ({ startNodeId: "hello", nodes: [] }))
}));

describe("home onboarding SQLite settlement", () => {
  let prisma;
  let directory;
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "sigrika-home-guide-"));
    prisma = new PrismaClient({ datasources: { db: { url: `file:${join(directory, "test.db").replaceAll("\\", "/")}` } } });
    await prisma.$executeRawUnsafe('CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "username" TEXT, "updatedAt" DATETIME)');
    await ensureOnboardingStorySchema(prisma);
    await ensureOnboardingStorySchema(prisma);
    await ensureMailboxSchema(prisma);
  });
  beforeEach(async () => {
    await prisma.mailboxMessage.deleteMany();
    await prisma.$executeRawUnsafe('DELETE FROM "User"');
    await prisma.$executeRawUnsafe('INSERT INTO "User" ("id", "username") VALUES (\'u\', \'测试\')');
  });
  afterAll(async () => {
    await prisma?.$disconnect();
    if (directory) await rm(directory, { recursive: true, force: true });
  });
  const state = () => getHomeOnboarding({ prisma, userId: "u" });
  const start = () => startHomeOnboarding({ prisma, userId: "u" });
  const finish = (outcome = "completed") => finishHomeOnboarding({ prisma, userId: "u", outcome });

  it("includes legacy users and keeps active tours eligible for a restart", async () => {
    expect(await state()).toEqual({ status: "pending", eligible: true });
    expect(await start()).toEqual({ status: "active", eligible: true });
    expect(await start()).toEqual({ status: "active", eligible: true });
  });
  it("waits for a new user's story exit, including an interrupted auto-shown story", async () => {
    await prisma.user.updateMany({ where: { id: "u" }, data: { onboardingRequired: true } });
    expect((await start()).eligible).toBe(false);
    await prisma.user.updateMany({ where: { id: "u" }, data: { onboardingRequired: false, onboardingAutoShownAt: new Date() } });
    expect((await start()).eligible).toBe(false);
    await prisma.user.updateMany({ where: { id: "u" }, data: { onboardingExitedAt: new Date() } });
    expect((await start()).status).toBe("active");
  });
  it.each(["completed", "skipped"])("sends both fixed rewards once for %s", async (outcome) => {
    await start();
    expect(await finish(outcome)).toEqual({ status: outcome, awarded: true });
    expect((await finish()).awarded).toBe(false);
    const mails = await prisma.mailboxMessage.findMany({ orderBy: { attachmentItemId: "asc" } });
    expect(mails.map((mail) => [mail.attachmentItemId, mail.attachmentQuantity])).toEqual([
      ["campus-recruitment-poster", 3], ["radio-recruitment-ticket", 3]
    ]);
    expect((await state()).eligible).toBe(false);
  });
  it("serializes competing settlement requests without duplicating rewards", async () => {
    await start();
    const results = await Promise.all([finish(), finish("skipped"), finish()]);
    expect(results.filter((result) => result.awarded)).toHaveLength(1);
    expect(await prisma.mailboxMessage.count()).toBe(2);
  });
  it("rolls back status and first mail if the second mail fails, then allows retry", async () => {
    await start();
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_radio BEFORE INSERT ON "MailboxMessage"
      WHEN NEW."attachmentItemId" = 'radio-recruitment-ticket' BEGIN SELECT RAISE(ABORT, 'mail failed'); END`);
    await expect(finish()).rejects.toThrow();
    expect(await prisma.mailboxMessage.count()).toBe(0);
    expect((await state()).status).toBe("active");
    await prisma.$executeRawUnsafe('DROP TRIGGER fail_radio');
    expect((await finish()).awarded).toBe(true);
  });
  it("rejects forged outcomes and settlement before start", async () => {
    await expect(finish("anything")).rejects.toMatchObject({ status: 400 });
    await expect(finish()).rejects.toMatchObject({ status: 409 });
    expect(await prisma.mailboxMessage.count()).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  announcementUnreadSummary,
  ensureAnnouncementSchema,
  isAnnouncementUnreadForUser,
  updateAnnouncementEntry,
  validateAnnouncementAdminInput
} from "./announcements.js";

describe("announcements domain", () => {
  it("creates announcement tables for older local SQLite databases at startup", async () => {
    const calls = [];
    await ensureAnnouncementSchema({
      $executeRawUnsafe: async (sql) => calls.push(sql)
    });

    expect(calls).toEqual([
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "AnnouncementEntry"'),
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "AnnouncementRead"'),
      expect.stringContaining('CREATE INDEX IF NOT EXISTS "AnnouncementEntry_kind_isPublished_deletedAt_pinned_firstPublishedAt_idx"'),
      expect.stringContaining('CREATE INDEX IF NOT EXISTS "AnnouncementEntry_kind_deletedAt_createdAt_idx"'),
      expect.stringContaining('CREATE UNIQUE INDEX IF NOT EXISTS "AnnouncementRead_userId_announcementId_key"'),
      expect.stringContaining('CREATE INDEX IF NOT EXISTS "AnnouncementRead_userId_readAt_idx"'),
      expect.stringContaining('CREATE INDEX IF NOT EXISTS "AnnouncementRead_announcementId_idx"')
    ]);
  });

  it("allows draft bodies to be empty but requires body text for publishing", () => {
    expect(validateAnnouncementAdminInput({
      kind: "announcement",
      title: "Draft",
      body: ""
    }, "save-draft")).toMatchObject({
      title: "Draft",
      body: ""
    });

    expect(() => validateAnnouncementAdminInput({
      kind: "announcement",
      title: "Publish",
      body: ""
    }, "publish")).toThrow("\u53d1\u5e03\u65f6\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a");
  });

  it("does not count entries first published before account creation as unread", () => {
    const user = { id: "user-1", createdAt: new Date("2026-06-10T00:00:00Z") };
    const oldEntry = entryFixture("old", { firstPublishedAt: new Date("2026-06-01T00:00:00Z") });
    const newEntry = entryFixture("new", { firstPublishedAt: new Date("2026-06-11T00:00:00Z") });

    expect(isAnnouncementUnreadForUser(oldEntry, user, new Set())).toBe(false);
    expect(isAnnouncementUnreadForUser(newEntry, user, new Set())).toBe(true);
    expect(isAnnouncementUnreadForUser(newEntry, user, new Set(["new"]))).toBe(false);
  });

  it("summarizes unread entries per tab from published entries and read rows", async () => {
    const user = { id: "user-1", createdAt: new Date("2026-06-10T00:00:00Z") };
    const prisma = {
      announcementEntry: {
        findMany: async () => [
          entryFixture("announcement-1", { kind: "announcement", firstPublishedAt: new Date("2026-06-11T00:00:00Z") }),
          entryFixture("announcement-read", { kind: "announcement", firstPublishedAt: new Date("2026-06-12T00:00:00Z") }),
          entryFixture("changelog-1", { kind: "changelog", firstPublishedAt: new Date("2026-06-13T00:00:00Z") })
        ]
      },
      announcementRead: {
        findMany: async () => [{ announcementId: "announcement-read" }]
      }
    };

    await expect(announcementUnreadSummary({ prisma, user })).resolves.toEqual({
      hasUnread: true,
      unreadByKind: {
        announcement: true,
        changelog: true
      },
      unreadCounts: {
        announcement: 1,
        changelog: 1
      }
    });
  });

  it("keeps first publish time when editing already published content", async () => {
    const firstPublishedAt = new Date("2026-06-11T00:00:00Z");
    const before = entryFixture("entry-1", {
      isPublished: true,
      firstPublishedAt,
      title: "Before",
      body: "Before body"
    });
    const updates = [];
    const tx = {
      announcementEntry: {
        findUnique: async () => before,
        update: async ({ data }) => {
          updates.push(data);
          return { ...before, ...data, updatedAt: new Date("2026-06-12T00:00:00Z") };
        }
      },
      adminAuditLog: {
        create: async () => ({})
      }
    };
    const prisma = { $transaction: async (callback) => callback(tx) };

    const result = await updateAnnouncementEntry({
      prisma,
      adminUser: { id: "admin-1" },
      announcementId: "entry-1",
      input: {
        title: "After",
        body: "After body",
        action: "save-published"
      }
    });

    expect(updates[0].firstPublishedAt).toBe(firstPublishedAt);
    expect(result.entry.firstPublishedAt).toBe(firstPublishedAt);
    expect(result.entry.title).toBe("After");
  });
});

function entryFixture(id, overrides = {}) {
  return {
    id,
    kind: "announcement",
    title: id,
    body: "Body",
    isPublished: true,
    pinned: false,
    firstPublishedAt: new Date("2026-06-11T00:00:00Z"),
    deletedAt: null,
    createdAt: new Date("2026-06-11T00:00:00Z"),
    updatedAt: new Date("2026-06-11T00:00:00Z"),
    ...overrides
  };
}

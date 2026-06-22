import { describe, expect, it } from "vitest";
import {
  createMailboxBatch,
  deleteMailboxMessage,
  listMailboxMessages,
  mailboxSummary,
  claimMailboxMessage,
  MAILBOX_ATTACHMENT_TYPES,
  MAILBOX_TARGET_MODES
} from "./mailbox.js";

describe("mailbox domain", () => {
  it("delivers mail by deleting the oldest read settled message when the mailbox is full", async () => {
    const { prisma, messages } = mailboxPrisma({
      users: [userFixture("user-1")],
      messages: [
        ...Array.from({ length: 19 }, (_, index) => messageFixture(`kept-${index}`, {
          userId: "user-1",
          createdAt: new Date(`2026-06-01T00:${String(index).padStart(2, "0")}:00Z`)
        })),
        messageFixture("old-read", {
          userId: "user-1",
          isRead: true,
          attachmentType: MAILBOX_ATTACHMENT_TYPES.item,
          claimedAt: new Date("2026-06-01T00:00:00Z"),
          createdAt: new Date("2026-05-31T00:00:00Z")
        })
      ]
    });

    const result = await createMailboxBatch({
      prisma,
      adminUser: { id: "admin-1", username: "admin" },
      input: {
        targetMode: MAILBOX_TARGET_MODES.user,
        recipientUserId: "user-1",
        title: "Maintenance Gift",
        body: "Thanks for playing.",
        attachmentType: MAILBOX_ATTACHMENT_TYPES.coins,
        attachmentQuantity: 30
      }
    });

    expect(result.batch.deliveredCount).toBe(1);
    expect(result.batch.skippedCount).toBe(0);
    expect(messages.some((message) => message.id === "old-read")).toBe(false);
    expect(messages).toHaveLength(20);
    expect(messages.at(-1)).toMatchObject({
      userId: "user-1",
      title: "Maintenance Gift",
      attachmentType: "coins",
      attachmentQuantity: 30
    });
  });

  it("skips a recipient when a full mailbox has no safe cleanup candidate", async () => {
    const { prisma, messages } = mailboxPrisma({
      users: [userFixture("user-1")],
      messages: Array.from({ length: 20 }, (_, index) => messageFixture(`pending-${index}`, {
        userId: "user-1",
        isRead: index % 2 === 0,
        attachmentType: index % 2 === 0 ? MAILBOX_ATTACHMENT_TYPES.item : MAILBOX_ATTACHMENT_TYPES.none,
        attachmentItemId: index % 2 === 0 ? "dream-ticket" : "",
        attachmentQuantity: index % 2 === 0 ? 1 : 0,
        claimedAt: null
      }))
    });

    const result = await createMailboxBatch({
      prisma,
      adminUser: { id: "admin-1", username: "admin" },
      input: {
        targetMode: MAILBOX_TARGET_MODES.user,
        recipientUserId: "user-1",
        title: "Full Inbox",
        body: "This should skip."
      }
    });

    expect(result.batch.deliveredCount).toBe(0);
    expect(result.batch.skippedCount).toBe(1);
    expect(messages).toHaveLength(20);
    expect(messages.some((message) => message.title === "Full Inbox")).toBe(false);
  });

  it("delivers future-eligible global batches when a new user opens the mailbox", async () => {
    const { prisma, messages } = mailboxPrisma({
      users: [userFixture("future-user")],
      batches: [{
        id: "batch-1",
        adminUserId: "admin-1",
        adminUsername: "admin",
        targetMode: MAILBOX_TARGET_MODES.allWithFuture,
        title: "Launch Gift",
        body: "Welcome.",
        attachmentType: MAILBOX_ATTACHMENT_TYPES.none,
        attachmentItemId: "",
        attachmentQuantity: 0,
        includeFutureUsers: true,
        deliveredCount: 1,
        skippedCount: 0,
        createdAt: new Date("2026-06-22T00:00:00Z")
      }]
    });

    const result = await listMailboxMessages({ prisma, userId: "future-user" });

    expect(result.messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      batchId: "batch-1",
      userId: "future-user",
      title: "Launch Gift"
    });
  });

  it("claims coin attachments once and writes a mailbox progress ledger entry", async () => {
    const { prisma, ledgers, users } = mailboxPrisma({
      users: [userFixture("user-1", { coins: 100 })],
      messages: [messageFixture("mail-1", {
        userId: "user-1",
        attachmentType: MAILBOX_ATTACHMENT_TYPES.coins,
        attachmentQuantity: 25
      })]
    });

    const first = await claimMailboxMessage({ prisma, userId: "user-1", messageId: "mail-1" });
    const second = await claimMailboxMessage({ prisma, userId: "user-1", messageId: "mail-1" });

    expect(first.user.coins).toBe(125);
    expect(second.user.coins).toBe(125);
    expect(users.get("user-1").coins).toBe(125);
    expect(ledgers).toHaveLength(1);
    expect(ledgers[0]).toMatchObject({
      userId: "user-1",
      metric: "coins",
      delta: 25,
      beforeValue: 100,
      afterValue: 125,
      reason: "mailbox.claim",
      refType: "mailboxMessage",
      refId: "mail-1"
    });
  });

  it("claims item attachments once and syncs structured user assets", async () => {
    const { prisma, users, userItemUpserts } = mailboxPrisma({
      users: [userFixture("user-1", { ownedItems: "{\"dream-ticket\":1}" })],
      messages: [messageFixture("mail-1", {
        userId: "user-1",
        attachmentType: MAILBOX_ATTACHMENT_TYPES.item,
        attachmentItemId: "dream-ticket",
        attachmentQuantity: 2
      })]
    });

    const first = await claimMailboxMessage({ prisma, userId: "user-1", messageId: "mail-1" });
    const second = await claimMailboxMessage({ prisma, userId: "user-1", messageId: "mail-1" });

    expect(first.user.ownedItems).toContainEqual({ itemId: "dream-ticket", quantity: 3 });
    expect(second.user.ownedItems).toContainEqual({ itemId: "dream-ticket", quantity: 3 });
    expect(users.get("user-1").ownedItems).toBe("{\"dream-ticket\":3}");
    expect(userItemUpserts).toContainEqual(expect.objectContaining({
      where: { userId_itemId: { userId: "user-1", itemId: "dream-ticket" } },
      update: { quantity: 3, source: "legacy" }
    }));
  });

  it("summarizes unread or claimable messages for the home badge", async () => {
    const { prisma } = mailboxPrisma({
      users: [userFixture("user-1")],
      messages: [
        messageFixture("read-plain", { userId: "user-1", isRead: true }),
        messageFixture("unread", { userId: "user-1", isRead: false }),
        messageFixture("claimable", {
          userId: "user-1",
          isRead: true,
          attachmentType: MAILBOX_ATTACHMENT_TYPES.coins,
          attachmentQuantity: 5
        }),
        messageFixture("claimed", {
          userId: "user-1",
          isRead: true,
          attachmentType: MAILBOX_ATTACHMENT_TYPES.coins,
          attachmentQuantity: 5,
          claimedAt: new Date("2026-06-22T00:00:00Z")
        })
      ]
    });

    await expect(mailboxSummary({ prisma, userId: "user-1" })).resolves.toEqual({
      unreadCount: 1,
      claimableCount: 1,
      badgeCount: 2
    });
  });

  it("prevents deleting mail with an unclaimed attachment", async () => {
    const { prisma, messages } = mailboxPrisma({
      users: [userFixture("user-1")],
      messages: [messageFixture("mail-1", {
        userId: "user-1",
        isRead: true,
        attachmentType: MAILBOX_ATTACHMENT_TYPES.coins,
        attachmentQuantity: 5
      })]
    });

    await expect(deleteMailboxMessage({ prisma, userId: "user-1", messageId: "mail-1" }))
      .rejects.toMatchObject({ status: 400 });
    expect(messages).toHaveLength(1);
  });
});

function userFixture(id, overrides = {}) {
  return {
    id,
    username: id,
    passwordHash: "hash",
    role: "player",
    status: "active",
    rank: "3段",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 300,
    blueGems: 0,
    selectedCharacter: "sigrika",
    selectedStoneDecoration: "",
    ownedCharacters: "sigrika,denia,aemeath",
    ownedItems: "",
    itemPurchaseCounts: "",
    itemEffects: "",
    ownedDecorations: "",
    ownedMusicIds: "",
    musicSelections: "{}",
    userCharacters: [],
    userDecorations: [],
    userItems: [],
    userItemEffects: [],
    modeStats: [],
    ...overrides
  };
}

function messageFixture(id, overrides = {}) {
  return {
    id,
    batchId: "",
    userId: "user-1",
    title: id,
    body: "Body",
    attachmentType: MAILBOX_ATTACHMENT_TYPES.none,
    attachmentItemId: "",
    attachmentQuantity: 0,
    isRead: false,
    claimedAt: null,
    createdAt: new Date("2026-06-22T00:00:00Z"),
    ...overrides
  };
}

function mailboxPrisma({ users: userRows = [], messages: messageRows = [], batches: batchRows = [] } = {}) {
  const users = new Map(userRows.map((user) => [user.id, { ...user }]));
  const messages = messageRows.map((message) => ({ ...message }));
  const batches = batchRows.map((batch) => ({ ...batch }));
  const ledgers = [];
  const userItemUpserts = [];
  let nextBatch = batches.length + 1;
  let nextMessage = messages.length + 1;

  const tx = {
    user: {
      findUnique: async ({ where }) => users.get(where.id) ?? null,
      findMany: async () => [...users.values()],
      update: async ({ where, data }) => {
        const before = users.get(where.id);
        const after = {
          ...before,
          ...data,
          coins: typeof data.coins?.increment === "number" ? before.coins + data.coins.increment : data.coins ?? before.coins
        };
        users.set(where.id, after);
        return after;
      }
    },
    mailboxBatch: {
      create: async ({ data }) => {
        const batch = { id: `batch-${nextBatch++}`, createdAt: new Date("2026-06-22T00:00:00Z"), ...data };
        batches.push(batch);
        return batch;
      },
      findMany: async ({ where } = {}) => batches.filter((batch) => {
        if (where?.includeFutureUsers != null && batch.includeFutureUsers !== where.includeFutureUsers) return false;
        return true;
      }),
      update: async ({ where, data }) => {
        const index = batches.findIndex((batch) => batch.id === where.id);
        batches[index] = { ...batches[index], ...data };
        return batches[index];
      }
    },
    mailboxMessage: {
      count: async ({ where }) => messages.filter((message) => matchesMessage(message, where)).length,
      findFirst: async ({ where, orderBy }) => {
        const rows = messages.filter((message) => matchesMessage(message, where));
        if (orderBy?.createdAt === "asc") rows.sort((a, b) => a.createdAt - b.createdAt);
        return rows[0] ?? null;
      },
      findMany: async ({ where, orderBy } = {}) => {
        const rows = messages.filter((message) => matchesMessage(message, where));
        if (orderBy?.createdAt === "desc") rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows;
      },
      findUnique: async ({ where }) => messages.find((message) => message.id === where.id) ?? null,
      create: async ({ data }) => {
        const message = { id: `mail-${nextMessage++}`, createdAt: new Date("2026-06-22T00:00:00Z"), isRead: false, claimedAt: null, ...data };
        messages.push(message);
        return message;
      },
      update: async ({ where, data }) => {
        const index = messages.findIndex((message) => message.id === where.id);
        messages[index] = { ...messages[index], ...data };
        return messages[index];
      },
      delete: async ({ where }) => {
        const index = messages.findIndex((message) => message.id === where.id);
        return messages.splice(index, 1)[0];
      }
    },
    userProgressLedger: {
      create: async ({ data }) => {
        ledgers.push(data);
        return data;
      }
    },
    userCharacter: { deleteMany: async () => {}, upsert: async () => {} },
    userDecoration: { deleteMany: async () => {}, upsert: async () => {} },
    userItem: {
      deleteMany: async () => {},
      upsert: async (input) => {
        userItemUpserts.push(input);
        return input.create;
      }
    },
    userItemEffect: { deleteMany: async () => {}, upsert: async () => {} },
    adminAuditLog: { create: async () => ({}) }
  };

  return {
    batches,
    ledgers,
    messages,
    userItemUpserts,
    users,
    prisma: {
      ...tx,
      $transaction: async (callback) => callback(tx)
    }
  };
}

function matchesMessage(message, where = {}) {
  if (!where) return true;
  if (where.id && message.id !== where.id) return false;
  if (where.userId && message.userId !== where.userId) return false;
  if (where.batchId && message.batchId !== where.batchId) return false;
  if (where.isRead != null && message.isRead !== where.isRead) return false;
  if (where.claimedAt === null && message.claimedAt !== null) return false;
  if (where.OR) return where.OR.some((clause) => matchesMessage(message, clause));
  if (where.attachmentType?.notIn && where.attachmentType.notIn.includes(message.attachmentType)) return false;
  return true;
}

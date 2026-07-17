import { publicUser } from "./db.js";
import { writeAudit } from "./adminAudit.js";
import { parseOwnedItemCounts, serializeOwnedItemCounts, syncStructuredUserAssets } from "./userAssets.js";
import {
  PROGRESS_METRICS,
  PROGRESS_REASONS,
  progressLedgerCreateOperation
} from "./userProgressLedger.js";

export const MAILBOX_MAX_MESSAGES = 20;

export const MAILBOX_ATTACHMENT_TYPES = {
  none: "none",
  item: "item",
  coins: "coins"
};

export const MAILBOX_TARGET_MODES = {
  user: "user",
  allCurrent: "all_current",
  allWithFuture: "all_with_future"
};

const ATTACHMENT_TYPES = new Set(Object.values(MAILBOX_ATTACHMENT_TYPES));
const TARGET_MODES = new Set(Object.values(MAILBOX_TARGET_MODES));
const LEGACY_MAILBOX_SENDER = "系统";
const SENDER_MAX_LENGTH = 40;
const TITLE_MAX_LENGTH = 40;
const BODY_MAX_LENGTH = 500;

export async function ensureMailboxSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MailboxBatch" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "adminUserId" TEXT NOT NULL,
      "adminUsername" TEXT NOT NULL,
      "targetMode" TEXT NOT NULL,
      "recipientUserId" TEXT NOT NULL DEFAULT '',
      "sender" TEXT NOT NULL DEFAULT '',
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "attachmentType" TEXT NOT NULL DEFAULT 'none',
      "attachmentItemId" TEXT NOT NULL DEFAULT '',
      "attachmentQuantity" INTEGER NOT NULL DEFAULT 0,
      "includeFutureUsers" BOOLEAN NOT NULL DEFAULT false,
      "deliveredCount" INTEGER NOT NULL DEFAULT 0,
      "skippedCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MailboxBatch_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MailboxMessage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "batchId" TEXT,
      "userId" TEXT NOT NULL,
      "sender" TEXT NOT NULL DEFAULT '',
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "attachmentType" TEXT NOT NULL DEFAULT 'none',
      "attachmentItemId" TEXT NOT NULL DEFAULT '',
      "attachmentQuantity" INTEGER NOT NULL DEFAULT 0,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "readAt" DATETIME,
      "claimedAt" DATETIME,
      "deletedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MailboxMessage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MailboxBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "MailboxMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  if (client?.$queryRawUnsafe) {
    const batchColumns = await client.$queryRawUnsafe(`PRAGMA table_info("MailboxBatch")`);
    if (!hasColumn(batchColumns, "sender")) {
      await client.$executeRawUnsafe(`ALTER TABLE "MailboxBatch" ADD COLUMN "sender" TEXT NOT NULL DEFAULT ''`);
    }
    const messageColumns = await client.$queryRawUnsafe(`PRAGMA table_info("MailboxMessage")`);
    if (!hasColumn(messageColumns, "sender")) {
      await client.$executeRawUnsafe(`ALTER TABLE "MailboxMessage" ADD COLUMN "sender" TEXT NOT NULL DEFAULT ''`);
    }
    if (!hasColumn(messageColumns, "deletedAt")) {
      await client.$executeRawUnsafe(`ALTER TABLE "MailboxMessage" ADD COLUMN "deletedAt" DATETIME`);
    }
  }
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MailboxBatch_targetMode_createdAt_idx" ON "MailboxBatch"("targetMode", "createdAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MailboxBatch_includeFutureUsers_createdAt_idx" ON "MailboxBatch"("includeFutureUsers", "createdAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MailboxBatch_adminUserId_createdAt_idx" ON "MailboxBatch"("adminUserId", "createdAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MailboxMessage_userId_createdAt_idx" ON "MailboxMessage"("userId", "createdAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MailboxMessage_userId_isRead_idx" ON "MailboxMessage"("userId", "isRead")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MailboxMessage_batchId_userId_idx" ON "MailboxMessage"("batchId", "userId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MailboxMessage_userId_deletedAt_createdAt_idx" ON "MailboxMessage"("userId", "deletedAt", "createdAt")`);
}

export async function createMailboxBatch({ prisma, adminUser, input }) {
  const data = validateMailboxBatchInput(input);
  return prisma.$transaction(async (tx) => {
    const recipients = await recipientsForBatch(tx, data);
    const batch = await tx.mailboxBatch.create({
      data: {
        adminUserId: adminUser.id,
        adminUsername: adminUser.username ?? "",
        targetMode: data.targetMode,
        recipientUserId: data.recipientUserId,
        sender: data.sender,
        title: data.title,
        body: data.body,
        attachmentType: data.attachmentType,
        attachmentItemId: data.attachmentItemId,
        attachmentQuantity: data.attachmentQuantity,
        includeFutureUsers: data.targetMode === MAILBOX_TARGET_MODES.allWithFuture,
        deliveredCount: 0,
        skippedCount: 0
      }
    });

    const delivery = await deliverBatchToRecipients(tx, batch, recipients);
    const updatedBatch = await tx.mailboxBatch.update({
      where: { id: batch.id },
      data: {
        deliveredCount: delivery.deliveredCount,
        skippedCount: delivery.skippedCount
      }
    });
    await writeAudit(tx, adminUser, "mailbox.send", updatedBatch.id, null, toMailboxBatchPayload(updatedBatch), "mailbox");
    return {
      batch: toMailboxBatchPayload(updatedBatch),
      skippedRecipients: delivery.skippedRecipients
    };
  });
}

export async function listMailboxMessages({ prisma, userId }) {
  await ensureFutureMailboxMessages({ prisma, userId });
  const messages = await prisma.mailboxMessage.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });
  return { messages: messages.map(toMailboxMessagePayload) };
}

export async function mailboxSummary({ prisma, userId }) {
  await ensureFutureMailboxMessages({ prisma, userId });
  const messages = await prisma.mailboxMessage.findMany({ where: { userId, deletedAt: null } });
  const unreadCount = messages.filter((message) => !message.isRead).length;
  const claimableCount = messages.filter(isClaimableMessage).length;
  return {
    unreadCount,
    claimableCount,
    badgeCount: unreadCount + claimableCount
  };
}

export async function markMailboxMessageRead({ prisma, userId, messageId }) {
  const message = await prisma.mailboxMessage.findUnique({ where: { id: messageId } });
  if (!message || message.userId !== userId) throw routeError(404, "邮件不存在");
  if (message.deletedAt) throw routeError(404, "邮件不存在");
  if (message.isRead) return { message: toMailboxMessagePayload(message) };
  const updated = await prisma.mailboxMessage.update({
    where: { id: message.id },
    data: { isRead: true, readAt: new Date() }
  });
  return { message: toMailboxMessagePayload(updated) };
}

export async function deleteMailboxMessage({ prisma, userId, messageId }) {
  const message = await prisma.mailboxMessage.findUnique({ where: { id: messageId } });
  if (!message || message.userId !== userId) throw routeError(404, "邮件不存在");
  if (message.deletedAt) throw routeError(404, "邮件不存在");
  if (isClaimableMessage(message)) throw routeError(400, "请先领取附件");
  await prisma.mailboxMessage.update({ where: { id: message.id }, data: { deletedAt: new Date() } });
  return { ok: true };
}

export async function claimMailboxMessage({ prisma, userId, messageId }) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.mailboxMessage.findUnique({ where: { id: messageId } });
    if (!message || message.userId !== userId) throw routeError(404, "邮件不存在");
    if (message.deletedAt) throw routeError(404, "邮件不存在");
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw routeError(404, "用户不存在");
    if (!hasAttachment(message)) {
      const readMessage = message.isRead ? message : await tx.mailboxMessage.update({
        where: { id: message.id },
        data: { isRead: true, readAt: new Date() }
      });
      return { user: publicUser(user), message: toMailboxMessagePayload(readMessage) };
    }
    if (message.claimedAt) {
      return { user: publicUser(user), message: toMailboxMessagePayload(message) };
    }

    const quantity = positiveInteger(message.attachmentQuantity);
    if (quantity <= 0) throw routeError(400, "邮件附件数量无效");

    let updatedUser = user;
    if (message.attachmentType === MAILBOX_ATTACHMENT_TYPES.coins) {
      updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { coins: { increment: quantity } }
      });
      await progressLedgerCreateOperation(tx, {
        userId: user.id,
        metric: PROGRESS_METRICS.coins,
        delta: quantity,
        beforeValue: user.coins,
        afterValue: updatedUser.coins,
        reason: PROGRESS_REASONS.mailboxClaim,
        refType: "mailboxMessage",
        refId: message.id
      });
    } else if (message.attachmentType === MAILBOX_ATTACHMENT_TYPES.item) {
      const itemId = String(message.attachmentItemId ?? "").trim();
      if (!itemId) throw routeError(400, "邮件附件道具无效");
      const ownedItems = parseOwnedItemCounts(user.ownedItems);
      ownedItems[itemId] = (ownedItems[itemId] ?? 0) + quantity;
      updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { ownedItems: serializeOwnedItemCounts(ownedItems) }
      });
      await syncStructuredUserAssets(tx, updatedUser);
    } else {
      throw routeError(400, "邮件附件类型无效");
    }

    const updatedMessage = await tx.mailboxMessage.update({
      where: { id: message.id },
      data: { isRead: true, readAt: message.readAt ?? new Date(), claimedAt: new Date() }
    });
    return {
      user: publicUser(updatedUser),
      message: toMailboxMessagePayload(updatedMessage)
    };
  });
}

export async function listAdminMailboxBatches({ prisma }) {
  const batches = await prisma.mailboxBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return { batches: batches.map(toMailboxBatchPayload) };
}

export async function searchMailboxUsers({ prisma, query }) {
  const text = String(query ?? "").trim();
  if (text.length < 1) return { users: [] };
  const users = await prisma.user.findMany({
    where: { username: { contains: text } },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return {
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status
    }))
  };
}

export function toMailboxMessagePayload(message) {
  return {
    id: message.id,
    batchId: message.batchId ?? "",
    sender: mailboxSender(message),
    title: message.title,
    body: message.body,
    attachment: attachmentPayload(message),
    isRead: Boolean(message.isRead),
    claimedAt: message.claimedAt ?? null,
    createdAt: message.createdAt,
    claimable: isClaimableMessage(message),
    deletable: !isClaimableMessage(message)
  };
}

export function toMailboxBatchPayload(batch) {
  return {
    id: batch.id,
    adminUserId: batch.adminUserId,
    adminUsername: batch.adminUsername,
    targetMode: batch.targetMode,
    recipientUserId: batch.recipientUserId ?? "",
    sender: mailboxSender(batch),
    title: batch.title,
    body: batch.body,
    attachment: attachmentPayload(batch),
    includeFutureUsers: Boolean(batch.includeFutureUsers),
    deliveredCount: batch.deliveredCount ?? 0,
    skippedCount: batch.skippedCount ?? 0,
    createdAt: batch.createdAt
  };
}

async function ensureFutureMailboxMessages({ prisma, userId }) {
  const batches = await prisma.mailboxBatch.findMany({
    where: { includeFutureUsers: true },
    orderBy: { createdAt: "asc" }
  });
  if (batches.length === 0) return;
  await prisma.$transaction(async (tx) => {
    for (const batch of batches) {
      const existing = await tx.mailboxMessage.findFirst({
        where: { batchId: batch.id, userId }
      });
      if (existing) continue;
      const delivered = await deliverBatchToRecipient(tx, batch, userId);
      if (delivered) {
        await tx.mailboxBatch.update({
          where: { id: batch.id },
          data: { deliveredCount: (batch.deliveredCount ?? 0) + 1 }
        });
      }
    }
  });
}

async function recipientsForBatch(prisma, data) {
  if (data.targetMode === MAILBOX_TARGET_MODES.user) {
    const user = await prisma.user.findUnique({ where: { id: data.recipientUserId } });
    if (!user) throw routeError(404, "收件用户不存在");
    return [user];
  }
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

async function deliverBatchToRecipients(prisma, batch, recipients) {
  const skippedRecipients = [];
  let deliveredCount = 0;
  for (const recipient of recipients) {
    const delivered = await deliverBatchToRecipient(prisma, batch, recipient.id);
    if (delivered) {
      deliveredCount += 1;
    } else {
      skippedRecipients.push({ userId: recipient.id, username: recipient.username ?? "" });
    }
  }
  return {
    deliveredCount,
    skippedCount: skippedRecipients.length,
    skippedRecipients
  };
}

async function deliverBatchToRecipient(prisma, batch, userId) {
  const currentCount = await prisma.mailboxMessage.count({ where: { userId, deletedAt: null } });
  if (currentCount >= MAILBOX_MAX_MESSAGES) {
    const safeMessage = await oldestSafeDeletableMessage(prisma, userId);
    if (!safeMessage) return false;
    await prisma.mailboxMessage.update({ where: { id: safeMessage.id }, data: { deletedAt: new Date() } });
  }
  await prisma.mailboxMessage.create({
    data: {
      batchId: batch.id,
      userId,
      sender: mailboxSender(batch),
      title: batch.title,
      body: batch.body,
      attachmentType: batch.attachmentType,
      attachmentItemId: batch.attachmentItemId ?? "",
      attachmentQuantity: batch.attachmentQuantity ?? 0
    }
  });
  return true;
}

async function oldestSafeDeletableMessage(prisma, userId) {
  const messages = await prisma.mailboxMessage.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "asc" }
  });
  return messages.find((message) => message.isRead && !isClaimableMessage(message)) ?? null;
}

function validateMailboxBatchInput(input = {}) {
  const targetMode = String(input.targetMode ?? "").trim();
  if (!TARGET_MODES.has(targetMode)) throw routeError(400, "收件范围无效");
  const recipientUserId = String(input.recipientUserId ?? "").trim();
  if (targetMode === MAILBOX_TARGET_MODES.user && !recipientUserId) throw routeError(400, "请选择收件用户");
  const sender = String(input.sender ?? "").trim();
  if (!sender) throw routeError(400, "邮件发件人不能为空");
  if (sender.length > SENDER_MAX_LENGTH) throw routeError(400, "邮件发件人不能超过40字");
  const title = String(input.title ?? "").trim();
  if (!title) throw routeError(400, "邮件标题不能为空");
  if (title.length > TITLE_MAX_LENGTH) throw routeError(400, "邮件标题不能超过40字");
  const body = String(input.body ?? "").trim();
  if (!body) throw routeError(400, "邮件正文不能为空");
  if (body.length > BODY_MAX_LENGTH) throw routeError(400, "邮件正文不能超过500字");

  const attachmentType = String(input.attachmentType ?? MAILBOX_ATTACHMENT_TYPES.none).trim() || MAILBOX_ATTACHMENT_TYPES.none;
  if (!ATTACHMENT_TYPES.has(attachmentType)) throw routeError(400, "附件类型无效");
  const attachmentItemId = String(input.attachmentItemId ?? "").trim();
  const attachmentQuantity = attachmentType === MAILBOX_ATTACHMENT_TYPES.none ? 0 : positiveInteger(input.attachmentQuantity);
  if (attachmentType !== MAILBOX_ATTACHMENT_TYPES.none && attachmentQuantity <= 0) throw routeError(400, "附件数量必须大于0");
  if (attachmentType === MAILBOX_ATTACHMENT_TYPES.item && !attachmentItemId) throw routeError(400, "请选择附件道具");

  return {
    targetMode,
    recipientUserId,
    sender,
    title,
    body,
    attachmentType,
    attachmentItemId: attachmentType === MAILBOX_ATTACHMENT_TYPES.item ? attachmentItemId : "",
    attachmentQuantity
  };
}

function attachmentPayload(record) {
  const type = String(record.attachmentType ?? MAILBOX_ATTACHMENT_TYPES.none);
  if (type === MAILBOX_ATTACHMENT_TYPES.none) return { type: MAILBOX_ATTACHMENT_TYPES.none };
  return {
    type,
    itemId: record.attachmentItemId ?? "",
    quantity: record.attachmentQuantity ?? 0,
    claimed: Boolean(record.claimedAt)
  };
}

function isClaimableMessage(message) {
  return hasAttachment(message) && !message.claimedAt;
}

function hasAttachment(message) {
  return String(message.attachmentType ?? MAILBOX_ATTACHMENT_TYPES.none) !== MAILBOX_ATTACHMENT_TYPES.none
    && positiveInteger(message.attachmentQuantity) > 0;
}

function positiveInteger(value) {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0 ? value : 0;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
  return 0;
}

function mailboxSender(record) {
  return String(record?.sender ?? "").trim() || LEGACY_MAILBOX_SENDER;
}

function hasColumn(columns, name) {
  return Array.isArray(columns) && columns.some((column) => column?.name === name);
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

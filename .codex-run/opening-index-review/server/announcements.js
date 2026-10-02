import { routeError } from "./adminRouteErrors.js";
import { writeAudit } from "./adminAudit.js";

export const ANNOUNCEMENT_KINDS = Object.freeze({
  announcement: "announcement",
  changelog: "changelog"
});

export const ANNOUNCEMENT_STATUS_FILTERS = Object.freeze({
  all: "all",
  published: "published",
  draft: "draft"
});

export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 80;
export const ANNOUNCEMENT_BODY_MAX_LENGTH = 10000;
export const ANNOUNCEMENT_PLAYER_PAGE_SIZE = 20;
export const ANNOUNCEMENT_PLAYER_MAX_PAGE_SIZE = 50;

const KIND_VALUES = new Set(Object.values(ANNOUNCEMENT_KINDS));
const STATUS_FILTER_VALUES = new Set(Object.values(ANNOUNCEMENT_STATUS_FILTERS));
const ADMIN_ACTIONS = new Set(["draft", "save-draft", "publish", "save-published", "unpublish"]);

const ERRORS = Object.freeze({
  invalidKind: "\u516c\u544a\u7c7b\u578b\u65e0\u6548",
  invalidStatus: "\u72b6\u6001\u7b5b\u9009\u65e0\u6548",
  invalidAction: "\u64cd\u4f5c\u7c7b\u578b\u65e0\u6548",
  titleRequired: "\u6807\u9898\u4e0d\u80fd\u4e3a\u7a7a",
  titleTooLong: `\u6807\u9898\u6700\u591a ${ANNOUNCEMENT_TITLE_MAX_LENGTH} \u4e2a\u5b57\u7b26`,
  bodyRequired: "\u53d1\u5e03\u65f6\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a",
  bodyTooLong: `\u5185\u5bb9\u6700\u591a ${ANNOUNCEMENT_BODY_MAX_LENGTH} \u4e2a\u5b57\u7b26`,
  notFound: "\u516c\u544a\u4e0d\u5b58\u5728"
});

export async function ensureAnnouncementSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AnnouncementEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "kind" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL DEFAULT '',
      "isPublished" BOOLEAN NOT NULL DEFAULT false,
      "pinned" BOOLEAN NOT NULL DEFAULT false,
      "firstPublishedAt" DATETIME,
      "deletedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AnnouncementRead" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "announcementId" TEXT NOT NULL,
      "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "AnnouncementEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AnnouncementEntry_kind_isPublished_deletedAt_pinned_firstPublishedAt_idx" ON "AnnouncementEntry"("kind", "isPublished", "deletedAt", "pinned", "firstPublishedAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AnnouncementEntry_kind_deletedAt_createdAt_idx" ON "AnnouncementEntry"("kind", "deletedAt", "createdAt")`);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AnnouncementRead_userId_announcementId_key" ON "AnnouncementRead"("userId", "announcementId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AnnouncementRead_userId_readAt_idx" ON "AnnouncementRead"("userId", "readAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AnnouncementRead_announcementId_idx" ON "AnnouncementRead"("announcementId")`);
}

export function normalizeAnnouncementKind(value) {
  const kind = String(value ?? "").trim();
  if (!KIND_VALUES.has(kind)) throw routeError(400, ERRORS.invalidKind);
  return kind;
}

export function normalizeAnnouncementStatusFilter(value) {
  const status = String(value ?? ANNOUNCEMENT_STATUS_FILTERS.all).trim() || ANNOUNCEMENT_STATUS_FILTERS.all;
  if (!STATUS_FILTER_VALUES.has(status)) throw routeError(400, ERRORS.invalidStatus);
  return status;
}

export function normalizeAnnouncementAction(value, fallback = "save-draft") {
  const action = String(value ?? fallback).trim() || fallback;
  if (!ADMIN_ACTIONS.has(action)) throw routeError(400, ERRORS.invalidAction);
  return action;
}

export function validateAnnouncementAdminInput(input = {}, action = "save-draft", existing = null) {
  const titleSource = Object.hasOwn(input, "title") ? input.title : existing?.title;
  const bodySource = Object.hasOwn(input, "body") ? input.body : existing?.body;
  const title = String(titleSource ?? "").trim();
  const body = String(bodySource ?? "").trim();
  if (!title) throw routeError(400, ERRORS.titleRequired);
  if (title.length > ANNOUNCEMENT_TITLE_MAX_LENGTH) throw routeError(400, ERRORS.titleTooLong);
  if (body.length > ANNOUNCEMENT_BODY_MAX_LENGTH) throw routeError(400, ERRORS.bodyTooLong);
  if (["publish", "save-published"].includes(action) && !body) {
    throw routeError(400, ERRORS.bodyRequired);
  }
  const kind = existing?.kind ?? normalizeAnnouncementKind(input.kind);
  return {
    kind,
    title,
    body,
    pinned: kind === ANNOUNCEMENT_KINDS.announcement && Boolean(input.pinned ?? existing?.pinned)
  };
}

export async function listAdminAnnouncementEntries({ prisma, kind, status = ANNOUNCEMENT_STATUS_FILTERS.all }) {
  const normalizedKind = normalizeAnnouncementKind(kind);
  const normalizedStatus = normalizeAnnouncementStatusFilter(status);
  const where = {
    kind: normalizedKind,
    deletedAt: null
  };
  if (normalizedStatus === ANNOUNCEMENT_STATUS_FILTERS.published) where.isPublished = true;
  if (normalizedStatus === ANNOUNCEMENT_STATUS_FILTERS.draft) where.isPublished = false;
  const entries = await prisma.announcementEntry.findMany({
    where,
    orderBy: [
      { isPublished: "desc" },
      { pinned: "desc" },
      { updatedAt: "desc" },
      { createdAt: "desc" }
    ]
  });
  return { entries: entries.map(toAdminAnnouncementPayload) };
}

export async function createAnnouncementEntry({ prisma, adminUser, input }) {
  const action = normalizeAnnouncementAction(input.action, "draft");
  const shouldPublish = action === "publish";
  const data = validateAnnouncementAdminInput(input, shouldPublish ? "publish" : "save-draft");
  const now = new Date();
  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.announcementEntry.create({
      data: {
        ...data,
        isPublished: shouldPublish,
        firstPublishedAt: shouldPublish ? now : null
      }
    });
    await writeAudit(
      tx,
      adminUser,
      shouldPublish ? "announcement.publish" : "announcement.create",
      created.id,
      null,
      toAdminAnnouncementPayload(created),
      "announcement"
    );
    return created;
  });
  return { entry: toAdminAnnouncementPayload(entry) };
}

export async function updateAnnouncementEntry({ prisma, adminUser, announcementId, input }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.announcementEntry.findUnique({ where: { id: announcementId } });
    if (!before || before.deletedAt) throw routeError(404, ERRORS.notFound);
    const action = normalizeAnnouncementAction(
      input.action,
      before.isPublished ? "save-published" : "save-draft"
    );
    const nextData = validateAnnouncementAdminInput(input, action, before);
    const nextPublishState = publishStateForAction(action, before.isPublished);
    const publishNow = nextPublishState && !before.firstPublishedAt;
    const updated = await tx.announcementEntry.update({
      where: { id: before.id },
      data: {
        ...nextData,
        isPublished: nextPublishState,
        firstPublishedAt: publishNow ? new Date() : before.firstPublishedAt
      }
    });
    await writeAudit(
      tx,
      adminUser,
      auditActionForUpdate(action, before, updated),
      updated.id,
      toAdminAnnouncementPayload(before),
      toAdminAnnouncementPayload(updated),
      "announcement"
    );
    return { entry: toAdminAnnouncementPayload(updated) };
  });
}

export async function deleteAnnouncementEntry({ prisma, adminUser, announcementId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.announcementEntry.findUnique({ where: { id: announcementId } });
    if (!before || before.deletedAt) throw routeError(404, ERRORS.notFound);
    const updated = await tx.announcementEntry.update({
      where: { id: before.id },
      data: {
        isPublished: false,
        deletedAt: new Date()
      }
    });
    await writeAudit(
      tx,
      adminUser,
      "announcement.delete",
      updated.id,
      toAdminAnnouncementPayload(before),
      toAdminAnnouncementPayload(updated),
      "announcement"
    );
    return { entry: toAdminAnnouncementPayload(updated) };
  });
}

export async function listPublishedAnnouncements({ prisma, user, kind, offset = 0, limit = ANNOUNCEMENT_PLAYER_PAGE_SIZE }) {
  const normalizedKind = normalizeAnnouncementKind(kind);
  const safeOffset = Math.max(0, Math.floor(Number(offset) || 0));
  const safeLimit = Math.min(
    ANNOUNCEMENT_PLAYER_MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(limit) || ANNOUNCEMENT_PLAYER_PAGE_SIZE))
  );
  const entries = await prisma.announcementEntry.findMany({
    where: publishedWhere(normalizedKind),
    orderBy: playerOrderBy(normalizedKind),
    skip: safeOffset,
    take: safeLimit + 1
  });
  const pageEntries = entries.slice(0, safeLimit);
  const readIds = await readAnnouncementIdSet({ prisma, userId: user.id, announcementIds: pageEntries.map((entry) => entry.id) });
  return {
    items: pageEntries.map((entry) => toPlayerAnnouncementListItem(entry, user, readIds)),
    nextOffset: safeOffset + pageEntries.length,
    hasMore: entries.length > safeLimit
  };
}

export async function getPublishedAnnouncementDetail({ prisma, user, announcementId }) {
  const entry = await prisma.announcementEntry.findUnique({ where: { id: announcementId } });
  if (!isVisiblePublishedEntry(entry)) throw routeError(404, ERRORS.notFound);
  const readIds = await readAnnouncementIdSet({ prisma, userId: user.id, announcementIds: [entry.id] });
  return { entry: toPlayerAnnouncementDetail(entry, user, readIds) };
}

export async function markAnnouncementRead({ prisma, user, announcementId }) {
  const entry = await prisma.announcementEntry.findUnique({ where: { id: announcementId } });
  if (!isVisiblePublishedEntry(entry)) throw routeError(404, ERRORS.notFound);
  await prisma.announcementRead.upsert({
    where: {
      userId_announcementId: {
        userId: user.id,
        announcementId: entry.id
      }
    },
    create: {
      userId: user.id,
      announcementId: entry.id
    },
    update: {
      readAt: new Date()
    }
  });
  return {
    entry: toPlayerAnnouncementDetail(entry, user, new Set([entry.id])),
    summary: await announcementUnreadSummary({ prisma, user })
  };
}

export async function announcementUnreadSummary({ prisma, user }) {
  const entries = await prisma.announcementEntry.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      firstPublishedAt: { gt: user.createdAt ?? new Date(0) }
    },
    select: {
      id: true,
      kind: true,
      isPublished: true,
      deletedAt: true,
      firstPublishedAt: true
    }
  });
  const readIds = await readAnnouncementIdSet({ prisma, userId: user.id, announcementIds: entries.map((entry) => entry.id) });
  const unreadCounts = {
    [ANNOUNCEMENT_KINDS.announcement]: 0,
    [ANNOUNCEMENT_KINDS.changelog]: 0
  };
  for (const entry of entries) {
    if (!isAnnouncementUnreadForUser(entry, user, readIds)) continue;
    if (Object.hasOwn(unreadCounts, entry.kind)) unreadCounts[entry.kind] += 1;
  }
  return {
    hasUnread: Object.values(unreadCounts).some((count) => count > 0),
    unreadByKind: Object.fromEntries(Object.entries(unreadCounts).map(([kind, count]) => [kind, count > 0])),
    unreadCounts
  };
}

export function isAnnouncementUnreadForUser(entry, user, readIds = new Set()) {
  if (!isVisiblePublishedEntry(entry)) return false;
  if (!entry.firstPublishedAt || !user?.createdAt) return false;
  if (new Date(entry.firstPublishedAt).getTime() <= new Date(user.createdAt).getTime()) return false;
  return !readIds.has(entry.id);
}

export function toAdminAnnouncementPayload(entry) {
  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    body: entry.body,
    status: entry.isPublished ? ANNOUNCEMENT_STATUS_FILTERS.published : ANNOUNCEMENT_STATUS_FILTERS.draft,
    isPublished: Boolean(entry.isPublished),
    pinned: Boolean(entry.pinned),
    firstPublishedAt: entry.firstPublishedAt ?? null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    deletedAt: entry.deletedAt ?? null
  };
}

export function toPlayerAnnouncementListItem(entry, user, readIds = new Set()) {
  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    pinned: Boolean(entry.pinned),
    firstPublishedAt: entry.firstPublishedAt ?? null,
    updatedAt: entry.updatedAt,
    isUnread: isAnnouncementUnreadForUser(entry, user, readIds)
  };
}

export function toPlayerAnnouncementDetail(entry, user, readIds = new Set()) {
  return {
    ...toPlayerAnnouncementListItem(entry, user, readIds),
    body: entry.body
  };
}

function publishedWhere(kind) {
  return {
    kind,
    isPublished: true,
    deletedAt: null,
    firstPublishedAt: { not: null }
  };
}

function playerOrderBy(kind) {
  if (kind === ANNOUNCEMENT_KINDS.announcement) {
    return [
      { pinned: "desc" },
      { firstPublishedAt: "desc" },
      { createdAt: "desc" }
    ];
  }
  return [
    { firstPublishedAt: "desc" },
    { createdAt: "desc" }
  ];
}

function isVisiblePublishedEntry(entry) {
  return Boolean(entry?.isPublished && !entry.deletedAt && entry.firstPublishedAt);
}

async function readAnnouncementIdSet({ prisma, userId, announcementIds }) {
  if (!announcementIds.length) return new Set();
  const rows = await prisma.announcementRead.findMany({
    where: {
      userId,
      announcementId: { in: announcementIds }
    },
    select: {
      announcementId: true
    }
  });
  return new Set(rows.map((row) => row.announcementId));
}

function publishStateForAction(action, currentPublished) {
  if (action === "unpublish" || action === "draft" || action === "save-draft") return false;
  if (action === "publish" || action === "save-published") return true;
  return Boolean(currentPublished);
}

function auditActionForUpdate(action, before, updated) {
  if (action === "unpublish") return "announcement.unpublish";
  if (!before.isPublished && updated.isPublished) return "announcement.publish";
  return "announcement.update";
}

import express from "express";
import {
  announcementUnreadSummary,
  getPublishedAnnouncementDetail,
  listPublishedAnnouncements,
  markAnnouncementRead
} from "./announcements.js";

export function createAnnouncementRouteHandlers({
  prisma,
  announcementUnreadSummaryFn = announcementUnreadSummary,
  getPublishedAnnouncementDetailFn = getPublishedAnnouncementDetail,
  listPublishedAnnouncementsFn = listPublishedAnnouncements,
  markAnnouncementReadFn = markAnnouncementRead
}) {
  async function summary(req, res) {
    try {
      res.json(await announcementUnreadSummaryFn({ prisma, user: req.user }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  async function list(req, res) {
    try {
      res.json(await listPublishedAnnouncementsFn({
        prisma,
        user: req.user,
        kind: req.query.kind,
        offset: req.query.offset,
        limit: req.query.limit
      }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  async function detail(req, res) {
    try {
      res.json(await getPublishedAnnouncementDetailFn({
        prisma,
        user: req.user,
        announcementId: req.params.id
      }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  async function read(req, res) {
    try {
      res.json(await markAnnouncementReadFn({
        prisma,
        user: req.user,
        announcementId: req.params.id
      }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  return { summary, list, detail, read };
}

export function createAnnouncementRouter(deps) {
  const router = express.Router();
  const handlers = createAnnouncementRouteHandlers(deps);
  router.get("/announcements/summary", handlers.summary);
  router.get("/announcements", handlers.list);
  router.get("/announcements/:id", handlers.detail);
  router.post("/announcements/:id/read", handlers.read);
  return router;
}

function sendRouteError(res, error) {
  res.status(error.status ?? 500).json({ error: error.message ?? "\u516c\u544a\u8bf7\u6c42\u5931\u8d25" });
}

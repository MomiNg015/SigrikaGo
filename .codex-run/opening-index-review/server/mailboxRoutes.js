import express from "express";
import {
  claimMailboxMessage,
  deleteMailboxMessage,
  listMailboxMessages,
  mailboxSummary,
  markMailboxMessageRead
} from "./mailbox.js";

export function createMailboxRouteHandlers({
  prisma,
  claimMailboxMessageFn = claimMailboxMessage,
  deleteMailboxMessageFn = deleteMailboxMessage,
  listMailboxMessagesFn = listMailboxMessages,
  mailboxSummaryFn = mailboxSummary,
  markMailboxMessageReadFn = markMailboxMessageRead
}) {
  async function summary(req, res) {
    try {
      res.json(await mailboxSummaryFn({ prisma, userId: req.user.id }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  async function list(req, res) {
    try {
      res.json(await listMailboxMessagesFn({ prisma, userId: req.user.id }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  async function read(req, res) {
    try {
      res.json(await markMailboxMessageReadFn({ prisma, userId: req.user.id, messageId: req.params.id }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  async function claim(req, res) {
    try {
      res.json(await claimMailboxMessageFn({ prisma, userId: req.user.id, messageId: req.params.id }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  async function remove(req, res) {
    try {
      res.json(await deleteMailboxMessageFn({ prisma, userId: req.user.id, messageId: req.params.id }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  return { summary, list, read, claim, remove };
}

export function createMailboxRouter(deps) {
  const router = express.Router();
  const handlers = createMailboxRouteHandlers(deps);
  router.get("/mailbox/summary", handlers.summary);
  router.get("/mailbox", handlers.list);
  router.post("/mailbox/:id/read", handlers.read);
  router.post("/mailbox/:id/claim", handlers.claim);
  router.delete("/mailbox/:id", handlers.remove);
  return router;
}

function sendRouteError(res, error) {
  res.status(error.status ?? 500).json({ error: error.message ?? "邮箱请求失败" });
}

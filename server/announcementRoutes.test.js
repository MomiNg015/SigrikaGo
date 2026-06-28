import { describe, expect, it, vi } from "vitest";
import { createAnnouncementRouteHandlers } from "./announcementRoutes.js";

describe("announcement route handlers", () => {
  it("binds authenticated user when listing player announcements", async () => {
    const listPublishedAnnouncementsFn = vi.fn(async () => ({ items: [], hasMore: false, nextOffset: 0 }));
    const handlers = createAnnouncementRouteHandlers({ prisma: {}, listPublishedAnnouncementsFn });
    const req = {
      user: { id: "user-1" },
      query: { kind: "announcement", offset: "20", limit: "20" }
    };
    const res = responseCollector();

    await handlers.list(req, res);

    expect(listPublishedAnnouncementsFn).toHaveBeenCalledWith({
      prisma: {},
      user: req.user,
      kind: "announcement",
      offset: "20",
      limit: "20"
    });
    expect(res.body).toEqual({ items: [], hasMore: false, nextOffset: 0 });
  });

  it("binds authenticated user when marking an announcement read", async () => {
    const markAnnouncementReadFn = vi.fn(async () => ({ ok: true }));
    const handlers = createAnnouncementRouteHandlers({ prisma: {}, markAnnouncementReadFn });
    const req = {
      user: { id: "user-1" },
      params: { id: "entry-1" }
    };
    const res = responseCollector();

    await handlers.read(req, res);

    expect(markAnnouncementReadFn).toHaveBeenCalledWith({
      prisma: {},
      user: req.user,
      announcementId: "entry-1"
    });
    expect(res.body).toEqual({ ok: true });
  });

  it("returns domain errors as JSON", async () => {
    const error = Object.assign(new Error("\u516c\u544a\u4e0d\u5b58\u5728"), { status: 404 });
    const getPublishedAnnouncementDetailFn = vi.fn(async () => { throw error; });
    const handlers = createAnnouncementRouteHandlers({ prisma: {}, getPublishedAnnouncementDetailFn });
    const res = responseCollector();

    await handlers.detail({ user: { id: "user-1" }, params: { id: "missing" } }, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "\u516c\u544a\u4e0d\u5b58\u5728" });
  });
});

function responseCollector() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

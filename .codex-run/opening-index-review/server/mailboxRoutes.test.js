import { describe, expect, it, vi } from "vitest";
import { createMailboxRouteHandlers } from "./mailboxRoutes.js";

describe("mailbox route handlers", () => {
  it("binds authenticated user id when listing mailbox messages", async () => {
    const listMailboxMessagesFn = vi.fn(async () => ({ messages: [] }));
    const handlers = createMailboxRouteHandlers({ prisma: {}, listMailboxMessagesFn });
    const res = responseCollector();

    await handlers.list({ user: { id: "user-1" } }, res);

    expect(listMailboxMessagesFn).toHaveBeenCalledWith({ prisma: {}, userId: "user-1" });
    expect(res.body).toEqual({ messages: [] });
  });

  it("binds authenticated user id when claiming mail", async () => {
    const claimMailboxMessageFn = vi.fn(async () => ({ ok: true }));
    const handlers = createMailboxRouteHandlers({ prisma: {}, claimMailboxMessageFn });
    const res = responseCollector();

    await handlers.claim({ user: { id: "user-1" }, params: { id: "mail-1" } }, res);

    expect(claimMailboxMessageFn).toHaveBeenCalledWith({
      prisma: {},
      userId: "user-1",
      messageId: "mail-1"
    });
    expect(res.body).toEqual({ ok: true });
  });

  it("returns domain errors as JSON", async () => {
    const error = Object.assign(new Error("请先领取附件"), { status: 400 });
    const deleteMailboxMessageFn = vi.fn(async () => { throw error; });
    const handlers = createMailboxRouteHandlers({ prisma: {}, deleteMailboxMessageFn });
    const res = responseCollector();

    await handlers.remove({ user: { id: "user-1" }, params: { id: "mail-1" } }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "请先领取附件" });
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

import { describe, expect, it } from "vitest";
import {
  findRoomActionReceipt,
  normalizeActionId,
  normalizeRoomActionReceipts,
  storeRoomActionReceipt
} from "./roomActionReceipts.js";

describe("room action receipts", () => {
  it("normalizes bounded action ids and rejects unsafe values", () => {
    expect(normalizeActionId(" action:123_ok ")).toBe("action:123_ok");
    expect(normalizeActionId("")).toBe("");
    expect(normalizeActionId("has spaces")).toBeNull();
    expect(normalizeActionId("x".repeat(129))).toBeNull();
  });

  it("stores one receipt per action id and bounds history per user", () => {
    const room = { actionReceipts: {} };
    const first = storeRoomActionReceipt(room, "user-1", {
      ok: true,
      actionId: "action-1",
      roomCode: "12345",
      revision: 2
    }, { maxPerUser: 2 });
    const duplicate = storeRoomActionReceipt(room, "user-1", {
      ok: false,
      actionId: "action-1",
      error: "different"
    }, { maxPerUser: 2 });
    storeRoomActionReceipt(room, "user-1", { ok: true, actionId: "action-2", roomCode: "12345" }, { maxPerUser: 2 });
    storeRoomActionReceipt(room, "user-1", { ok: true, actionId: "action-3", roomCode: "12345" }, { maxPerUser: 2 });

    expect(duplicate).toBe(first);
    expect(room.actionReceipts["user-1"].map((receipt) => receipt.actionId)).toEqual(["action-2", "action-3"]);
    expect(findRoomActionReceipt(room, "user-1", "action-3")).toMatchObject({ ok: true, actionId: "action-3" });
  });

  it("drops malformed persisted receipt entries", () => {
    expect(normalizeRoomActionReceipts({
      "user-1": [
        { ok: true, actionId: "valid-1", roomCode: "12345", revision: 3 },
        { ok: true, actionId: "bad id" }
      ],
      "user-2": "invalid"
    })).toEqual({
      "user-1": [{ ok: true, actionId: "valid-1", roomCode: "12345", revision: 3 }]
    });
  });
});

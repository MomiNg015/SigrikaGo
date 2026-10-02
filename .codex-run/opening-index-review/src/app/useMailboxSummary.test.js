import { describe, expect, it } from "vitest";
import { EMPTY_MAILBOX_SUMMARY, normalizeMailboxSummary } from "./useMailboxSummary.js";

describe("mailbox summary state", () => {
  it("normalizes mailbox badge counts from API payloads", () => {
    expect(normalizeMailboxSummary({
      unreadCount: "2",
      claimableCount: 3,
      badgeCount: undefined
    })).toEqual({
      unreadCount: 2,
      claimableCount: 3,
      badgeCount: 0
    });
  });

  it("keeps an immutable empty summary contract", () => {
    expect(EMPTY_MAILBOX_SUMMARY).toEqual({ unreadCount: 0, claimableCount: 0, badgeCount: 0 });
    expect(Object.isFrozen(EMPTY_MAILBOX_SUMMARY)).toBe(true);
  });
});

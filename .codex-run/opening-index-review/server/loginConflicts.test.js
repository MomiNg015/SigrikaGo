import { describe, expect, test } from "vitest";
import { shouldBlockLoginForActiveAccount } from "./loginConflicts.js";

describe("login conflict checks", () => {
  test("does not block login for a persisted session with no online socket", () => {
    const onlineSessions = {
      hasOnlineUser: () => false
    };

    expect(shouldBlockLoginForActiveAccount({
      onlineSessions,
      userId: "user-1"
    })).toBe(false);
  });

  test("blocks login when the account currently has an online socket", () => {
    const onlineSessions = {
      hasOnlineUser: () => true
    };

    expect(shouldBlockLoginForActiveAccount({
      onlineSessions,
      userId: "user-1"
    })).toBe(true);
  });

  test("force login bypasses the prompt gate", () => {
    const onlineSessions = {
      hasOnlineUser: () => true
    };

    expect(shouldBlockLoginForActiveAccount({
      onlineSessions,
      userId: "user-1",
      forceLogin: true
    })).toBe(false);
  });
});

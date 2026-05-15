import { describe, expect, it } from "vitest";
import { sanitizeUserUpdate, serializeAudit } from "./adminRoutes.js";

describe("admin route helpers", () => {
  it("sanitizes editable user fields", () => {
    expect(sanitizeUserUpdate({
      role: "admin",
      status: "banned",
      rank: "17级",
      rating: "1020",
      coins: "500",
      ownedCharacters: ["sigrika", "danea"],
      selectedCharacter: "danea",
      passwordHash: "ignored"
    })).toEqual({
      role: "admin",
      status: "banned",
      rank: "17级",
      rating: 1020,
      coins: 500,
      ownedCharacters: "sigrika,danea",
      selectedCharacter: "danea"
    });
  });

  it("serializes audit before and after values", () => {
    expect(serializeAudit({ a: 1 })).toBe("{\"a\":1}");
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  cleanupLegacyUsernames,
  legacyUsernameSuffix,
  uniqueLegacyUsernameSuffix
} from "./usernameCleanup.js";

describe("legacy username cleanup", () => {
  it("keeps the trailing username display width for legacy overlong names", () => {
    expect(legacyUsernameSuffix("Alice_12345")).toBe("ce_12345");
    expect(legacyUsernameSuffix("露露A_1234")).toBe("露A_1234");
    expect(legacyUsernameSuffix("Alice_12")).toBe("Alice_12");
  });

  it("keeps generated cleanup names unique when suffixes collide", () => {
    const used = new Set(["ce_12345"]);

    expect(uniqueLegacyUsernameSuffix("Alice_12345", used, "user-1")).toBe("_12345_2");
  });

  it("updates only users whose names exceed the current username width", async () => {
    const updates = [];
    const prisma = {
      user: {
        findMany: vi.fn(async () => [
          { id: "u1", username: "Alice_12345" },
          { id: "u2", username: "Bob_1234" },
          { id: "u3", username: "露露A_1234" }
        ]),
        update: vi.fn(async (query) => updates.push(query))
      }
    };

    await cleanupLegacyUsernames(prisma);

    expect(updates).toEqual([
      { where: { id: "u1" }, data: { username: "ce_12345" } },
      { where: { id: "u3" }, data: { username: "露A_1234" } }
    ]);
  });
});

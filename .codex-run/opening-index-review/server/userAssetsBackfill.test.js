import { describe, expect, it } from "vitest";
import { backfillStructuredUserAssets } from "./userAssetsBackfill.js";

describe("backfillStructuredUserAssets", () => {
  it("walks users by cursor and syncs every row", async () => {
    const pages = [
      [{ id: "u1" }, { id: "u2" }],
      [{ id: "u3" }],
      []
    ];
    const queries = [];
    const synced = [];
    const prisma = {
      user: {
        findMany: async (query) => {
          queries.push(query);
          return pages.shift() ?? [];
        }
      }
    };

    const result = await backfillStructuredUserAssets({
      prisma,
      batchSize: 2,
      syncUserAssets: async (_prisma, user) => synced.push(user.id)
    });

    expect(result).toEqual({ count: 3 });
    expect(synced).toEqual(["u1", "u2", "u3"]);
    expect(queries).toEqual([
      { take: 2, orderBy: { id: "asc" } },
      { take: 2, cursor: { id: "u2" }, skip: 1, orderBy: { id: "asc" } }
    ]);
  });
});

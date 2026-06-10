import { describe, expect, it } from "vitest";
import {
  PROGRESS_METRICS,
  PROGRESS_REASONS,
  normalizeProgressLedgerEntry,
  progressLedgerCreateOperation,
  progressLedgerCreateOperations
} from "./userProgressLedger.js";

describe("user progress ledger", () => {
  it("normalizes valid progress ledger entries", () => {
    expect(normalizeProgressLedgerEntry({
      userId: " user-1 ",
      metric: PROGRESS_METRICS.coins,
      delta: "-90",
      beforeValue: "120",
      afterValue: 30,
      reason: PROGRESS_REASONS.shopPurchase,
      refType: "shopItem",
      refId: "shop-1"
    })).toEqual({
      userId: "user-1",
      metric: "coins",
      delta: -90,
      beforeValue: 120,
      afterValue: 30,
      reason: "shop.purchase",
      refType: "shopItem",
      refId: "shop-1"
    });
  });

  it("skips empty or zero-delta ledger entries", async () => {
    const writes = [];
    const prisma = {
      userProgressLedger: {
        create: async ({ data }) => {
          writes.push(data);
          return data;
        }
      }
    };

    await progressLedgerCreateOperation(prisma, { userId: "user-1", metric: "coins", delta: 0 });
    await progressLedgerCreateOperation(prisma, { userId: "", metric: "coins", delta: -1 });

    expect(writes).toEqual([]);
  });

  it("builds multiple ledger create operations while filtering invalid entries", async () => {
    const writes = [];
    const prisma = {
      userProgressLedger: {
        create: ({ data }) => {
          writes.push(data);
          return data;
        }
      }
    };

    const operations = progressLedgerCreateOperations(prisma, [
      { userId: "user-1", metric: "coins", delta: 50, reason: PROGRESS_REASONS.gameResult },
      { userId: "user-1", metric: "rating", delta: 0, reason: PROGRESS_REASONS.gameResult },
      { userId: "user-1", metric: "rating", delta: -20, reason: PROGRESS_REASONS.gameResult }
    ]);

    expect(operations).toHaveLength(2);
    expect(writes.map((entry) => entry.metric)).toEqual(["coins", "rating"]);
  });
});

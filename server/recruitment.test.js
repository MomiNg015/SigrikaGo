import { describe, expect, it } from "vitest";
import { startRecruitment } from "./recruitment.js";
import { RECRUITMENT_ITEM_TYPES } from "../src/shared/recruitment.js";

describe("recruitment", () => {
  it("rejects recruitment immediately when the item has no remaining candidates", async () => {
    const calls = [];
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 100,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika,lynae,mornye,chisa",
      ownedItems: `${RECRUITMENT_ITEM_TYPES.campusPoster}:1`,
      ownedDecorations: ""
    };
    const prisma = {
      $transaction: async (callback) => callback(prisma),
      user: {
        findUnique: async () => user,
        update: async (args) => {
          calls.push(["user.update", args]);
          return user;
        }
      },
      recruitmentTask: {
        findFirst: async () => null,
        create: async (args) => {
          calls.push(["recruitmentTask.create", args]);
          return args.data;
        }
      },
      recruitmentMissStreak: {
        findUnique: async () => null
      },
      userCharacter: { upsert: async () => {} },
      userDecoration: { upsert: async () => {} },
      userItem: { upsert: async () => {} },
      userMusicTrack: { upsert: async () => {} }
    };

    await expect(startRecruitment({
      prisma,
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.campusPoster
    })).rejects.toThrow("好像已经没有可以用该道具招募的角色了");
    expect(calls).toEqual([]);
  });
});

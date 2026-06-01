import { describe, expect, it } from "vitest";
import {
  getUserProfile,
  getUserProfileByUsername,
  getUserReplays,
  listSocialUsers,
  RELATIONSHIP_TYPES,
  setRelationship
} from "./social.js";

describe("social profiles and relationships", () => {
  it("formats profile records and per-character stats in readable Chinese", async () => {
    const profile = await getUserProfile({
      prisma: socialProfilePrisma({
        users: [{
          id: "user-1",
          username: "moming",
          rating: 1200,
          selectedCharacter: "aemeath",
          ownedCharacters: "sigrika,aemeath"
        }],
        records: [
          record({ id: "r-1", blackUserId: "user-1", whiteUserId: "user-2", winnerColor: "black", blackCharacter: "aemeath" }),
          record({ id: "r-2", blackUserId: "user-2", whiteUserId: "user-1", winnerColor: "black", whiteCharacter: "sigrika" }),
          record({ id: "r-3", blackUserId: "user-1", whiteUserId: "user-2", winnerColor: null, resultText: "和棋", blackCharacter: "aemeath" })
        ]
      }),
      userId: "user-1",
      viewerId: "viewer-1",
      statusForUser: () => "online"
    });

    expect(profile.record).toBe("3局 · 1胜1负1和");
    expect(profile.characterStats).toEqual([
      { characterId: "aemeath", record: "2局 · 1胜0负1和", winRate: "50.0%" },
      { characterId: "sigrika", record: "1局 · 0胜1负0和", winRate: "0.0%" }
    ]);
  });

  it("derives profile records from all games instead of only the replay-list page", async () => {
    const records = [
      ...Array.from({ length: 30 }, (_, index) => record({
        id: `recent-win-${index}`,
        blackUserId: "user-1",
        whiteUserId: `opponent-${index}`,
        winnerColor: "black",
        blackCharacter: "aemeath",
        createdAt: new Date(`2026-05-${String(31 - index).padStart(2, "0")}T12:00:00Z`)
      })),
      record({
        id: "older-loss",
        blackUserId: "opponent-old",
        whiteUserId: "user-1",
        winnerColor: "black",
        whiteCharacter: "sigrika",
        createdAt: new Date("2026-04-01T12:00:00Z")
      })
    ];

    const profile = await getUserProfile({
      prisma: socialProfilePrisma({
        users: [{
          id: "user-1",
          username: "moming",
          rating: 1200,
          selectedCharacter: "aemeath",
          ownedCharacters: "sigrika,aemeath"
        }],
        records
      }),
      userId: "user-1",
      viewerId: "viewer-1",
      statusForUser: () => "online"
    });

    expect(profile.record).toBe("31局 · 30胜1负0和");
    expect(profile.characterStats).toEqual([
      { characterId: "aemeath", record: "30局 · 30胜0负0和", winRate: "100.0%" },
      { characterId: "sigrika", record: "1局 · 0胜1负0和", winRate: "0.0%" }
    ]);
  });

  it("uses legacy result text when profile records do not have structured winner colors", async () => {
    const profile = await getUserProfile({
      prisma: socialProfilePrisma({
        users: [{
          id: "user-1",
          username: "moming",
          rating: 1200,
          selectedCharacter: "aemeath",
          ownedCharacters: "sigrika,aemeath"
        }],
        records: [
          record({ id: "legacy-win", blackUserId: "user-1", whiteUserId: "user-2", winnerColor: null, resultText: "黑胜3.25子", blackCharacter: "aemeath" }),
          record({ id: "legacy-loss", blackUserId: "user-2", whiteUserId: "user-1", winnerColor: null, resultText: "黑胜3.25子", whiteCharacter: "sigrika" }),
          record({ id: "legacy-draw", blackUserId: "user-1", whiteUserId: "user-3", winnerColor: null, resultText: "和棋", blackCharacter: "aemeath" })
        ]
      }),
      userId: "user-1",
      viewerId: "viewer-1",
      statusForUser: () => "online"
    });

    expect(profile.record).toBe("3局 · 1胜1负1和");
    expect(profile.characterStats).toEqual([
      { characterId: "aemeath", record: "2局 · 1胜0负1和", winRate: "50.0%" },
      { characterId: "sigrika", record: "1局 · 0胜1负0和", winRate: "0.0%" }
    ]);
  });

  it("keeps friend and blacklist mutually exclusive", async () => {
    const writes = [];
    const prisma = {
      $executeRaw: async (strings, ...values) => {
        writes.push(values);
      }
    };

    await setRelationship({
      prisma,
      ownerUserId: "owner-1",
      targetUserId: "target-1",
      type: RELATIONSHIP_TYPES.friend
    });
    await setRelationship({
      prisma,
      ownerUserId: "owner-1",
      targetUserId: "target-1",
      type: RELATIONSHIP_TYPES.blacklist
    });

    expect(writes.map((row) => row.at(-1))).toEqual([
      RELATIONSHIP_TYPES.friend,
      RELATIONSHIP_TYPES.blacklist
    ]);
  });

  it("writes relationship timestamps explicitly for schemas without db defaults", async () => {
    const writes = [];
    const prisma = {
      $executeRaw: async (strings, ...values) => {
        writes.push(values);
      }
    };

    await setRelationship({
      prisma,
      ownerUserId: "owner-1",
      targetUserId: "target-1",
      type: RELATIONSHIP_TYPES.friend
    });

    expect(writes[0]).toHaveLength(7);
    expect(writes[0][4]).toBeInstanceOf(Date);
    expect(writes[0][5]).toBeInstanceOf(Date);
    expect(writes[0][6]).toBe(RELATIONSHIP_TYPES.friend);
  });

  it("lists social users with rank and online status", async () => {
    const result = await listSocialUsers({
      prisma: {
        $queryRaw: async () => [
          { targetUserId: "target-1", type: RELATIONSHIP_TYPES.friend },
          { targetUserId: "target-2", type: RELATIONSHIP_TYPES.blacklist }
        ],
        user: {
          findMany: async () => [
            { id: "target-1", username: "friend", rating: 1200, selectedCharacter: "sigrika", ownedCharacters: "sigrika" },
            { id: "target-2", username: "blocked", rating: 800, selectedCharacter: "danea", ownedCharacters: "danea" }
          ]
        }
      },
      userId: "owner-1",
      statusForUser: (id) => id === "target-1" ? "online" : "offline"
    });

    expect(result.friends[0]).toMatchObject({ username: "friend", rank: "4段", status: "online" });
    expect(result.blacklist[0]).toMatchObject({ username: "blocked", rank: "1级", status: "offline" });
  });

  it("returns replay summaries for any target user without viewer context", async () => {
    const records = await getUserReplays({
      prisma: socialProfilePrisma({
        users: [{ id: "target-1" }],
        records: [record({ id: "r-1", blackUserId: "target-1", whiteUserId: "user-2", blackCharacter: "sigrika" })]
      }),
      userId: "target-1"
    });

    expect(records).toEqual([expect.objectContaining({
      id: "r-1",
      blackName: "black",
      whiteName: "white",
      blackCharacter: "sigrika"
    })]);
  });

  it("finds public profile by exact username for social search", async () => {
    const profile = await getUserProfileByUsername({
      prisma: socialProfilePrisma({
        users: [
          { id: "target-1", username: "露露米", rating: 1080, selectedCharacter: "baconbits", ownedCharacters: "baconbits" }
        ]
      }),
      username: "露露米",
      viewerId: "viewer-1",
      statusForUser: () => "offline"
    });

    expect(profile).toMatchObject({
      id: "target-1",
      username: "露露米",
      rank: "2段",
      status: "offline"
    });
  });
});

function socialProfilePrisma({ users = [], records = [] }) {
  return {
    user: {
      findUnique: async ({ where }) => users.find((user) => user.id === where.id) ?? null,
      findFirst: async ({ where }) => users.find((user) => user.username === where.username) ?? null,
      findMany: async ({ where }) => users.filter((user) => where.id.in.includes(user.id))
    },
    gameRecord: {
      findMany: async ({ where, orderBy, take }) => {
        let result = records.filter((item) => {
          const targetIds = where.OR.map((condition) => condition.blackUserId ?? condition.whiteUserId);
          return targetIds.includes(item.blackUserId) || targetIds.includes(item.whiteUserId);
        });
        if (orderBy?.createdAt === "desc") {
          result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return Number.isInteger(take) ? result.slice(0, take) : result;
      }
    },
    $queryRaw: async () => []
  };
}

function record(overrides = {}) {
  return {
    id: "record-1",
    roomCode: "12345",
    blackUserId: "black-user",
    whiteUserId: "white-user",
    blackName: "black",
    whiteName: "white",
    blackCharacter: "sigrika",
    whiteCharacter: "danea",
    resultText: "黑胜1/2子",
    winnerColor: "black",
    moveCount: 10,
    createdAt: new Date("2026-05-22T12:00:00Z"),
    ...overrides
  };
}

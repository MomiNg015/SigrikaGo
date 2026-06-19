import { describe, expect, it } from "vitest";
import {
  createUserReport,
  getUserProfile,
  getUserProfileByUsername,
  getUserReplays,
  likeUserProfile,
  listUserReports,
  profileLikeDayKey,
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
            {
              id: "target-1",
              username: "friend",
              rating: 1200,
              selectedCharacter: "sigrika",
              ownedCharacters: "sigrika",
              modeStats: [{ mode: "spark", rating: 1200, rank: "4段", recentResults: "win,loss", wins: 0, losses: 0, draws: 0 }]
            },
            {
              id: "target-2",
              username: "blocked",
              rating: 800,
              selectedCharacter: "danea",
              ownedCharacters: "danea",
              modeStats: [{ mode: "spark", rating: 800, rank: "1级", recentResults: "", wins: 0, losses: 0, draws: 0 }]
            }
          ]
        }
      },
      userId: "owner-1",
      statusForUser: (id) => id === "target-1" ? "online" : "offline"
    });

    expect(result.friends[0]).toMatchObject({ username: "friend", rank: "4段", recentResults: ["win", "loss"], status: "online" });
    expect(result.blacklist[0]).toMatchObject({ username: "blocked", rank: "1级", recentResults: [], status: "offline" });
  });

  it("prefers structured item effects for social users", async () => {
    const profile = await getUserProfile({
      prisma: socialProfilePrisma({
        users: [{
          id: "target-1",
          username: "denia-fan",
          rating: 1200,
          selectedCharacter: "denia",
          ownedCharacters: "denia",
          itemEffects: JSON.stringify({ legacyEffect: true }),
          userItemEffects: [
            { effectKey: "deniaRainbowGlow", effectValue: "true" },
            { effectKey: "inactive", effectValue: "false" }
          ]
        }]
      }),
      userId: "target-1",
      viewerId: "viewer-1",
      statusForUser: () => "online"
    });

    expect(profile.itemEffects).toEqual({ deniaRainbowGlow: true });
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
      rank: "3段",
      status: "offline"
    });
  });

  it("uses Asia/Shanghai day keys for daily profile likes", () => {
    expect(profileLikeDayKey(new Date("2026-06-18T15:59:59Z"))).toBe("2026-06-18");
    expect(profileLikeDayKey(new Date("2026-06-18T16:00:00Z"))).toBe("2026-06-19");
  });

  it("stores one profile like per viewer target and day", async () => {
    const writes = [];
    const prisma = {
      user: {
        findUnique: async ({ where }) => where.id === "target-1" ? { id: "target-1" } : null
      },
      $executeRaw: async (_strings, ...values) => writes.push(values),
      $queryRaw: async (_strings, ...values) => {
        if (values.length === 1) return [{ count: 7n }];
        if (values.length === 3) return [{ id: "like-1" }];
        return [];
      }
    };

    const result = await likeUserProfile({
      prisma,
      likerUserId: "viewer-1",
      targetUserId: "target-1",
      now: new Date("2026-06-19T01:00:00Z")
    });

    expect(writes[0][1]).toBe("viewer-1");
    expect(writes[0][2]).toBe("target-1");
    expect(writes[0][3]).toBe("2026-06-19");
    expect(result).toEqual({ likeCount: 7, likedToday: true });
  });

  it("rejects liking or reporting yourself", async () => {
    await expect(likeUserProfile({
      prisma: {},
      likerUserId: "user-1",
      targetUserId: "user-1"
    })).rejects.toMatchObject({ status: 400 });
    await expect(createUserReport({
      prisma: {},
      reporter: { id: "user-1", username: "self" },
      reportedUserId: "user-1",
      content: "bad"
    })).rejects.toMatchObject({ status: 400 });
  });

  it("stores user reports with reporter and reported snapshots", async () => {
    const prisma = {
      user: {
        findUnique: async ({ where }) => where.id === "target-1" ? { id: "target-1", username: "target" } : null
      },
      $queryRaw: async (_strings, ...values) => [{
        id: "report-1",
        reporterUserId: values[1],
        reportedUserId: values[2],
        reporterUsername: values[3],
        reportedUsername: values[4],
        content: values[5],
        createdAt: values[6]
      }]
    };

    const result = await createUserReport({
      prisma,
      reporter: { id: "viewer-1", username: "viewer" },
      reportedUserId: "target-1",
      content: "  内容\u0000  "
    });

    expect(result.report).toMatchObject({
      id: "report-1",
      reporterUserId: "viewer-1",
      reportedUserId: "target-1",
      reporterUsername: "viewer",
      reportedUsername: "target",
      content: "内容"
    });
  });

  it("lists recent user reports for admins", async () => {
    const result = await listUserReports({
      prisma: {
        $queryRaw: async () => [{
          id: "report-1",
          reporterUserId: "viewer-1",
          reportedUserId: "target-1",
          reporterUsername: "viewer",
          reportedUsername: "target",
          content: "report body",
          createdAt: new Date("2026-06-19T00:00:00Z")
        }]
      }
    });

    expect(result.reports).toEqual([{
      id: "report-1",
      reporterUserId: "viewer-1",
      reportedUserId: "target-1",
      reporterUsername: "viewer",
      reportedUsername: "target",
      content: "report body",
      createdAt: "2026-06-19T00:00:00.000Z"
    }]);
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

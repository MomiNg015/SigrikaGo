import { describe, expect, it, vi } from "vitest";
import { ensureGachaSchema, ensureGameModeSchema, publicUser } from "./db.js";

describe("publicUser", () => {
  it("exposes safe role and status fields without password hash", () => {
    const user = {
      id: "u1",
      username: "admin",
      passwordHash: "secret",
      role: "admin",
      status: "active",
      rank: "3段",
      rating: 1000,
      wins: 1,
      losses: 2,
      modeStats: {
        spark: { rating: 1000, rank: "3段", recentResults: "win,loss", wins: 1, losses: 2, draws: 0 },
        standard: { rating: 1000, rank: "4段", recentResults: "", wins: 0, losses: 0, draws: 0 }
      },
      coins: 300,
      selectedCharacter: "sigrika",
      selectedStoneDecoration: "paw-stone",
      ownedCharacters: "sigrika,denia",
      ownedItems: "",
      itemEffects: JSON.stringify({ sigrikaCandyDisabled: true }),
      ownedDecorations: ""
    };

    expect(publicUser(user)).toEqual({
      id: "u1",
      username: "admin",
      role: "admin",
      status: "active",
      rank: "3段",
      rating: 1000,
      wins: 1,
      losses: 2,
      modeStats: {
        spark: { rating: 1000, rank: "3段", recentResults: ["win", "loss"], wins: 1, losses: 2, draws: 0 },
        standard: { rating: 1000, rank: "4段", recentResults: [], wins: 0, losses: 0, draws: 0 },
        gomoku: { rating: 1000, rank: "3段", recentResults: [], wins: 0, losses: 0, draws: 0 }
      },
      coins: 300,
      blueGems: 0,
      selectedCharacter: "sigrika",
      selectedStoneDecoration: "paw-stone",
      ownedCharacters: ["sigrika", "denia", "qiuyuan", "mornye", "changli", "chisa"],
      ownedItems: [],
      characterChains: {},
      itemEffects: { sigrikaCandyDisabled: true },
      ownedDecorations: [],
      ownedMusicIds: [
        "home-default",
        "home-main-bgm-1",
        "battle-default",
        "denia-skill-default",
        "sigrika-skill-default",
        "aemeath-skill-default",
        "aemeath-voyage-star-default",
        "baconbits-skill-default",
        "nabomo-skill-default",
        "qiuyuan-skill-default",
        "lynae-skill-default",
        "chisa-skill-default",
        "changli-skill-default",
        "mornye-skill-default"
      ],
      musicSelections: { skill: {} }
    });
    expect(publicUser(user).ownedCharacters).not.toContain("baconbits");
  });

  it("automatically unlocks Nabomo when rating reaches 1400", () => {
    const user = {
      id: "u1",
      username: "player",
      passwordHash: "secret",
      role: "player",
      status: "active",
      rank: "stored-rank",
      rating: 1400,
      wins: 0,
      losses: 0,
      coins: 0,
      selectedCharacter: "sigrika",
      selectedStoneDecoration: "",
      ownedCharacters: "sigrika",
      ownedItems: "",
      itemEffects: "",
      ownedDecorations: ""
    };

    expect(publicUser(user).ownedCharacters).toContain("nabomo");
  });

  it("merges structured asset relations with legacy fields when they are loaded", () => {
    const user = {
      id: "u1",
      username: "player",
      role: "player",
      status: "active",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 0,
      selectedCharacter: "sigrika",
      selectedStoneDecoration: "",
      ownedCharacters: "baconbits",
      ownedItems: JSON.stringify({ "legacy-item": 9 }),
      itemEffects: JSON.stringify({ sigrikaCandyDisabled: true }),
      ownedDecorations: "legacy-decoration",
      userCharacters: [{ characterSlug: "denia" }],
      userItems: [{ itemId: "dream-ticket", quantity: 2 }],
      userItemEffects: [{ effectKey: "deniaRainbowGlow", effectValue: "true" }],
      userDecorations: [{ decorationSlug: "paw-stone" }]
    };

    const payload = publicUser(user);

    expect(payload.ownedCharacters).toContain("denia");
    expect(payload.ownedCharacters).toContain("baconbits");
    expect(payload.ownedItems).toEqual([
      { itemId: "legacy-item", quantity: 9 },
      { itemId: "dream-ticket", quantity: 2 }
    ]);
    expect(payload.itemEffects).toEqual({ sigrikaCandyDisabled: true, deniaRainbowGlow: true });
    expect(payload.ownedDecorations).toEqual(["legacy-decoration", "paw-stone"]);
  });

  it("exposes blue gems and character chain counts", () => {
    const user = {
      id: "u1",
      username: "player",
      role: "player",
      status: "active",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 0,
      blueGems: 7,
      selectedCharacter: "sigrika",
      selectedStoneDecoration: "",
      ownedCharacters: "sigrika,denia",
      ownedItems: "",
      itemEffects: "",
      ownedDecorations: "",
      userCharacters: [
        { characterSlug: "sigrika", chainCount: 2 },
        { characterSlug: "denia", chainCount: 6 }
      ]
    };

    expect(publicUser(user)).toMatchObject({
      blueGems: 7,
      characterChains: {
        sigrika: 2,
        denia: 6
      }
    });
  });
});

describe("ensureGameModeSchema", () => {
  it("creates mode stats storage and backfills legacy spark data", async () => {
    const executeRawUnsafe = vi.fn();
    const queryRawUnsafe = vi.fn().mockResolvedValue([
      { name: "id" },
      { name: "roomCode" }
    ]);
    const client = {
      $executeRawUnsafe: executeRawUnsafe,
      $queryRawUnsafe: queryRawUnsafe
    };

    await ensureGameModeSchema(client);

    expect(queryRawUnsafe).toHaveBeenCalledWith('PRAGMA table_info("UserModeStats")');
    expect(queryRawUnsafe).toHaveBeenCalledWith('PRAGMA table_info("GameRecord")');
    expect(executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS "UserModeStats"'));
    expect(executeRawUnsafe).toHaveBeenCalledWith('ALTER TABLE "UserModeStats" ADD COLUMN "rank" TEXT NOT NULL DEFAULT \'3段\'');
    expect(executeRawUnsafe).toHaveBeenCalledWith('ALTER TABLE "UserModeStats" ADD COLUMN "recentResults" TEXT NOT NULL DEFAULT \'\'');
    expect(executeRawUnsafe).toHaveBeenCalledWith('ALTER TABLE "GameRecord" ADD COLUMN "mode" TEXT NOT NULL DEFAULT \'spark\'');
    expect(executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('INSERT OR IGNORE INTO "UserModeStats"'));
    expect(executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining("'gomoku'"));
  });
});

describe("ensureGachaSchema", () => {
  it("creates gacha storage and backfills account currency columns for old dev databases", async () => {
    const executeRawUnsafe = vi.fn();
    const queryRawUnsafe = vi.fn()
      .mockResolvedValueOnce([{ name: "id" }, { name: "coins" }])
      .mockResolvedValueOnce([{ name: "id" }, { name: "characterSlug" }])
      .mockResolvedValueOnce([{ name: "id" }, { name: "featuredPrizeId" }]);
    const client = {
      $executeRawUnsafe: executeRawUnsafe,
      $queryRawUnsafe: queryRawUnsafe
    };

    await ensureGachaSchema(client);

    expect(queryRawUnsafe).toHaveBeenCalledWith('PRAGMA table_info("User")');
    expect(queryRawUnsafe).toHaveBeenCalledWith('PRAGMA table_info("UserCharacter")');
    expect(executeRawUnsafe).toHaveBeenCalledWith('ALTER TABLE "User" ADD COLUMN "blueGems" INTEGER NOT NULL DEFAULT 0');
    expect(executeRawUnsafe).toHaveBeenCalledWith('ALTER TABLE "UserCharacter" ADD COLUMN "chainCount" INTEGER NOT NULL DEFAULT 0');
    expect(executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS "GachaPool"'));
    expect(executeRawUnsafe).toHaveBeenCalledWith('ALTER TABLE "GachaPool" ADD COLUMN "featuredPrizeIds" TEXT');
    expect(executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS "GachaDrawReward"'));
  });
});

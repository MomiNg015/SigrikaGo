import { describe, expect, it } from "vitest";
import { publicUser } from "./db.js";

describe("publicUser", () => {
  it("exposes safe role and status fields without password hash", () => {
    const user = {
      id: "u1",
      username: "admin",
      passwordHash: "secret",
      role: "admin",
      status: "active",
      rank: "stored-rank",
      rating: 1000,
      wins: 1,
      losses: 2,
      coins: 300,
      selectedCharacter: "sigrika",
      selectedStoneDecoration: "paw-stone",
      ownedCharacters: "sigrika,danea",
      ownedItems: "",
      itemEffects: JSON.stringify({ sigrikaCandyDisabled: true }),
      ownedDecorations: ""
    };

    expect(publicUser(user)).toEqual({
      id: "u1",
      username: "admin",
      role: "admin",
      status: "active",
      rank: "2段",
      rating: 1000,
      wins: 1,
      losses: 2,
      coins: 300,
      selectedCharacter: "sigrika",
      selectedStoneDecoration: "paw-stone",
      ownedCharacters: ["sigrika", "denia", "aemeath"],
      ownedItems: [],
      itemEffects: { sigrikaCandyDisabled: true },
      ownedDecorations: [],
      ownedMusicIds: [
        "home-default",
        "battle-default",
        "denia-skill-default",
        "sigrika-skill-default",
        "aemeath-skill-default",
        "baconbits-skill-default",
        "nabomo-skill-default"
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
});

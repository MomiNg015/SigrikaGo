import { describe, expect, it } from "vitest";
import { selectUserSkillMusic } from "./musicSelection.js";

describe("selectUserSkillMusic", () => {
  it("persists an owned character skill music selection", async () => {
    const user = testUser({
      ownedMusicIds: JSON.stringify(["sigrika-skill-dream"])
    });
    const updates = [];

    const response = await selectUserSkillMusic({
      prisma: prismaWithUserUpdate(user, updates),
      user,
      characterId: "sigrika",
      trackId: "sigrika-skill-dream"
    });

    expect(updates[0].data.musicSelections).toBe(JSON.stringify({
      skill: { sigrika: "sigrika-skill-dream" }
    }));
    expect(response.user.musicSelections.skill.sigrika).toBe("sigrika-skill-dream");
  });

  it("rejects unowned non-default music", async () => {
    await expect(selectUserSkillMusic({
      prisma: prismaWithUserUpdate(testUser()),
      user: testUser(),
      characterId: "sigrika",
      trackId: "sigrika-skill-dream"
    })).rejects.toMatchObject({ status: 403 });
  });

  it("persists a derived-skill selection independently from the base skill", async () => {
    const updates = [];
    const tracks = {
      "aemeath-skill-default": {
        id: "aemeath-skill-default",
        name: "Aemeath Skill BGM",
        type: "skill",
        characterId: "aemeath",
        defaultUnlocked: true,
        playback: { mode: "single-loop", src: "/base.ogg", loop: true }
      },
      "aemeath-voyage-star-alt": {
        id: "aemeath-voyage-star-alt",
        name: "Voyage Star Alt",
        type: "skill",
        characterId: "aemeath",
        effectType: "voyage-star",
        defaultUnlocked: false,
        playback: { mode: "single-loop", src: "/derived.ogg", loop: true }
      }
    };
    const user = testUser({
      ownedMusicIds: JSON.stringify(["aemeath-voyage-star-alt"]),
      musicSelections: JSON.stringify({ skill: { aemeath: "aemeath-skill-default" } })
    });

    await selectUserSkillMusic({
      prisma: prismaWithUserUpdate(user, updates),
      user,
      characterId: "aemeath",
      effectType: "voyage-star",
      trackId: "aemeath-voyage-star-alt",
      tracks
    });

    expect(JSON.parse(updates[0].data.musicSelections)).toEqual({
      skill: { aemeath: "aemeath-skill-default" },
      derivedSkill: { aemeath: { "voyage-star": "aemeath-voyage-star-alt" } }
    });
  });

  it("rejects a base-skill track submitted to a derived slot", async () => {
    const tracks = {
      "aemeath-skill-default": {
        id: "aemeath-skill-default",
        name: "Aemeath Skill BGM",
        type: "skill",
        characterId: "aemeath",
        defaultUnlocked: true,
        playback: { mode: "single-loop", src: "/base.ogg", loop: true }
      }
    };

    await expect(selectUserSkillMusic({
      prisma: prismaWithUserUpdate(testUser()),
      user: testUser(),
      characterId: "aemeath",
      effectType: "voyage-star",
      trackId: "aemeath-skill-default",
      tracks
    })).rejects.toMatchObject({ status: 403 });
  });

  it("rejects music that belongs to another character", async () => {
    await expect(selectUserSkillMusic({
      prisma: prismaWithUserUpdate(testUser({ ownedMusicIds: JSON.stringify(["sigrika-skill-dream"]) })),
      user: testUser({ ownedMusicIds: JSON.stringify(["sigrika-skill-dream"]) }),
      characterId: "denia",
      trackId: "sigrika-skill-dream"
    })).rejects.toMatchObject({ status: 403 });
  });
});

function testUser(overrides = {}) {
  return {
    id: "user-1",
    username: "moming",
    role: "player",
    status: "active",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 0,
    selectedCharacter: "sigrika",
    selectedStoneDecoration: "",
    ownedCharacters: "sigrika",
    ownedItems: "",
    itemEffects: "",
    ownedDecorations: "",
    ownedMusicIds: "",
    musicSelections: "{}",
    ...overrides
  };
}

function prismaWithUserUpdate(user, updates = []) {
  return {
    user: {
      update: async (query) => {
        updates.push(query);
        return { ...user, ...query.data };
      }
    }
  };
}

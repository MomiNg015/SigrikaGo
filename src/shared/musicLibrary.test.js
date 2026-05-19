import { describe, expect, it } from "vitest";
import {
  characterVoiceMapForSkill,
  DEFEAT_SOUND,
  MATCH_SUCCESS_SOUND,
  MUSIC_TRACKS,
  VICTORY_SOUND,
  latestSkillCharacterId,
  resolveBackgroundMusic,
  resolveResultSound,
  resolveSkillVoice
} from "./musicLibrary.js";

describe("background music library", () => {
  it("uses the configured intro and loop files for the default home music", () => {
    const track = resolveBackgroundMusic({ view: "home" });

    expect(track).toMatchObject({
      id: "home-default",
      type: "home",
      playback: {
        mode: "intro-loop",
        introSrc: "/assets/music/hidamari_intro_once.ogg",
        loopSrc: "/assets/music/hidamari_loop.ogg",
        loop: true
      }
    });
  });

  it("lets owned player selection override the default home music", () => {
    const track = resolveBackgroundMusic({
      view: "home",
      selections: { home: "home-default" },
      ownedMusicIds: ["home-default"]
    });

    expect(track.id).toBe("home-default");
  });

  it("uses Shanjifu as the default battle music", () => {
    const track = resolveBackgroundMusic({ view: "room" });

    expect(track).toMatchObject({
      id: "battle-default",
      type: "battle",
      playback: {
        mode: "intro-loop",
        introSrc: "/assets/music/shanjifu_intro_once.ogg",
        loopSrc: "/assets/music/shanjifu_loop.ogg",
        loop: true
      }
    });
  });

  it("stops background music during the match success transition", () => {
    const track = resolveBackgroundMusic({ view: "home", matchSuccess: true });

    expect(track).toBeNull();
  });

  it("stops background music while the result modal is open", () => {
    const track = resolveBackgroundMusic({ view: "room", resultModalOpen: true });

    expect(track).toBeNull();
  });

  it("exposes the match success effect sound path", () => {
    expect(MATCH_SUCCESS_SOUND).toBe("/assets/music/match-success.mp3");
  });

  it("chooses victory and defeat result sounds for players, but not draws", () => {
    const room = {
      game: { winner: { winnerColor: "black" } },
      players: [
        { color: "black", user: { id: "winner" } },
        { color: "white", user: { id: "loser" } }
      ]
    };

    expect(resolveResultSound(room, { id: "winner" })).toBe(VICTORY_SOUND);
    expect(resolveResultSound(room, { id: "loser" })).toBe(DEFEAT_SOUND);
    expect(resolveResultSound({ ...room, game: { winner: { winnerColor: null } } }, { id: "winner" })).toBeNull();
    expect(resolveResultSound(room, { id: "spectator" })).toBeNull();
  });

  it("uses the previous home music as Danea skill music", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      skillPreview: { characterId: "danea" }
    });

    expect(track).toMatchObject({
      id: "danea-skill-default",
      type: "skill",
      characterId: "danea",
      playback: {
        mode: "intro-loop",
        introSrc: "/assets/music/bgm_intro_once.ogg",
        loopSrc: "/assets/music/bgm_loop.ogg",
        loop: true
      }
    });
  });

  it("uses Koimoon as Sigrika skill music", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      skillPreview: { characterId: "sigrika" }
    });

    expect(track).toMatchObject({
      id: "sigrika-skill-default",
      type: "skill",
      characterId: "sigrika",
      playback: {
        mode: "intro-loop",
        introSrc: "/assets/music/koimoon_132_micro_intro_once.ogg",
        loopSrc: "/assets/music/koimoon_132_micro_loop.ogg",
        loop: true
      }
    });
  });

  it("uses LHL as Aemeath skill music", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      skillPreview: { characterId: "aemeath" }
    });

    expect(track).toMatchObject({
      id: "aemeath-skill-default",
      type: "skill",
      characterId: "aemeath",
      playback: {
        mode: "intro-loop",
        introSrc: "/assets/music/lhl_intro_once.ogg",
        loopSrc: "/assets/music/lhl_loop.ogg",
        loop: true
      }
    });
  });

  it("uses Matoya as Baconbits skill music", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      skillPreview: { characterId: "baconbits" }
    });

    expect(track).toMatchObject({
      id: "baconbits-skill-default",
      type: "skill",
      characterId: "baconbits",
      playback: {
        mode: "intro-loop",
        introSrc: "/assets/music/matoya_intro_once.ogg",
        loopSrc: "/assets/music/matoya_loop.ogg",
        loop: true
      }
    });
  });

  it("uses Busizhe as Nabomo skill music", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      skillPreview: { characterId: "nabomo" }
    });

    expect(track).toMatchObject({
      id: "nabomo-skill-default",
      type: "skill",
      characterId: "nabomo",
      playback: {
        mode: "intro-loop",
        introSrc: "/assets/music/busizhe_intro_once.ogg",
        loopSrc: "/assets/music/busizhe_loop.ogg",
        loop: true
      }
    });
  });

  it("keeps the latest skill character music active after the skill banner ends", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      latestSkillCharacterId: "danea"
    });

    expect(track.id).toBe("danea-skill-default");
  });

  it("stops background music after the game is finished", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      gamePhase: "finished",
      latestSkillCharacterId: "danea"
    });

    expect(track).toBeNull();
  });

  it("derives the latest skill character from room history and player color", () => {
    const characterId = latestSkillCharacterId({
      game: {
        phase: "playing",
        history: [
          { type: "skill", color: "black" },
          { type: "move", color: "white" },
          { type: "skill", color: "white" }
        ]
      },
      players: [
        { color: "black", characterId: "sigrika" },
        { color: "white", character: { id: "danea" } }
      ]
    });

    expect(characterId).toBe("danea");
  });

  it("prioritizes a configured skill track over battle music", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      skillPreview: { characterId: "custom-skill-character" },
      tracks: {
        ...MUSIC_TRACKS,
        "battle-test": {
          id: "battle-test",
          type: "battle",
          name: "Battle Test",
          defaultUnlocked: true,
          purchasable: false,
          playback: { mode: "single-loop", src: "/assets/music/battle.ogg", loop: true }
        },
        "custom-skill-test": {
          id: "custom-skill-test",
          type: "skill",
          name: "Custom Skill Test",
          characterId: "custom-skill-character",
          defaultUnlocked: true,
          purchasable: false,
          playback: { mode: "single-loop", src: "/assets/music/custom.ogg", loop: true }
        }
      },
      defaults: {
        battle: "battle-test"
      }
    });

    expect(track.id).toBe("custom-skill-test");
  });

  it("does not play a skill voice until a character voice path is configured", () => {
    expect(resolveSkillVoice({ characterId: "danea" })).toBeNull();
  });

  it("uses the configured Sigrika skill voice", () => {
    expect(resolveSkillVoice({ characterId: "sigrika" })).toBe("/assets/voice/sigrika_2_no_exclaim.ogg");
  });

  it("uses the configured Aemeath skill voice", () => {
    expect(resolveSkillVoice({ characterId: "aemeath" })).toBe("/assets/voice/aemeath_skill.ogg");
  });

  it("uses the configured Baconbits skill voice", () => {
    expect(resolveSkillVoice({ characterId: "baconbits" })).toBe("/assets/voice/baconbits_skill.ogg");
  });

  it("resolves a configured skill voice from the skill banner character", () => {
    const voice = resolveSkillVoice(
      { character: { id: "sigrika" } },
      { sigrika: "/assets/voice/sigrika-skill.ogg" }
    );

    expect(voice).toBe("/assets/voice/sigrika-skill.ogg");
  });

  it("bridges configured skill voices into character system voice maps", () => {
    expect(characterVoiceMapForSkill({
      sigrika: "/assets/voice/sigrika_2_no_exclaim.ogg"
    })).toEqual({
      sigrika: {
        "skill-cast": "/assets/voice/sigrika_2_no_exclaim.ogg"
      }
    });
  });
});

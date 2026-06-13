import { describe, expect, it } from "vitest";
import {
  CHARACTER_SYSTEM_VOICES,
  characterVoiceMapForSkill,
  DEFEAT_SOUND,
  MATCH_SUCCESS_SOUND,
  MUSIC_TRACKS,
  musicTracksWithDisplayNames,
  VICTORY_SOUND,
  latestSkillCharacterId,
  ownedMusicIdsWithDefaults,
  resolveSkillMusicTrack,
  resolveBackgroundMusic,
  resolveResultSound,
  resolveSkillVoice,
  skillMusicOptionsForCharacter
} from "./musicLibrary.js";

describe("background music library", () => {
  it("uses the configured loop file for the default home music", () => {
    const track = resolveBackgroundMusic({ view: "home" });

    expect(track).toMatchObject({
      id: "home-default",
      type: "home",
      playback: {
        mode: "single-loop",
        src: "/assets/music/main_bgm.ogg",
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

  it("uses the previous home music as Denia skill music", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      skillPreview: { characterId: "denia" }
    });

    expect(track).toMatchObject({
      id: "denia-skill-default",
      type: "skill",
      characterId: "denia",
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
        introSrc: "/assets/music/koimoon_132_intro_no_fadein_2p5s.ogg",
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
      latestSkillCharacterId: "denia"
    });

    expect(track.id).toBe("denia-skill-default");
  });

  it("applies display-name overrides without changing playback metadata", () => {
    const tracks = musicTracksWithDisplayNames(MUSIC_TRACKS, {
      "home-default": "星炬大厅"
    });

    expect(tracks["home-default"].name).toBe("星炬大厅");
    expect(tracks["home-default"].defaultName).toBe("Default Home BGM");
    expect(tracks["home-default"].playback).toBe(MUSIC_TRACKS["home-default"].playback);
  });

  it("lets an owned character skill music selection override the default", () => {
    const tracks = {
      ...MUSIC_TRACKS,
      "denia-skill-alt": {
        id: "denia-skill-alt",
        name: "Denia Alt",
        type: "skill",
        characterId: "denia",
        defaultUnlocked: false,
        purchasable: true,
        playback: { mode: "single-loop", src: "/assets/music/denia-alt.ogg", loop: true }
      }
    };

    const track = resolveBackgroundMusic({
      view: "room",
      skillPreview: { characterId: "denia" },
      selections: { skill: { denia: "denia-skill-alt" } },
      ownedMusicIds: ["denia-skill-alt"],
      tracks
    });

    expect(track.id).toBe("denia-skill-alt");
  });

  it("falls back when selected skill music is not owned or belongs to another character", () => {
    const tracks = {
      ...MUSIC_TRACKS,
      "sigrika-skill-alt": {
        id: "sigrika-skill-alt",
        name: "Sigrika Alt",
        type: "skill",
        characterId: "sigrika",
        defaultUnlocked: false,
        purchasable: true,
        playback: { mode: "single-loop", src: "/assets/music/sigrika-alt.ogg", loop: true }
      }
    };

    expect(resolveSkillMusicTrack({
      characterId: "denia",
      selections: { skill: { denia: "sigrika-skill-alt" } },
      ownedMusicIds: ["sigrika-skill-alt"],
      tracks
    }).id).toBe("denia-skill-default");

    expect(resolveSkillMusicTrack({
      characterId: "sigrika",
      selections: { skill: { sigrika: "sigrika-skill-alt" } },
      ownedMusicIds: [],
      tracks
    }).id).toBe("sigrika-skill-default");
  });

  it("lists only owned or default-unlocked skill music for a character", () => {
    const tracks = {
      ...MUSIC_TRACKS,
      "denia-skill-alt": {
        id: "denia-skill-alt",
        name: "Denia Alt",
        type: "skill",
        characterId: "denia",
        defaultUnlocked: false,
        purchasable: true,
        playback: { mode: "single-loop", src: "/assets/music/denia-alt.ogg", loop: true }
      }
    };

    expect(skillMusicOptionsForCharacter({
      characterId: "denia",
      ownedMusicIds: ownedMusicIdsWithDefaults(["denia-skill-alt"], tracks),
      tracks
    }).map((track) => track.id)).toContain("denia-skill-alt");

    expect(skillMusicOptionsForCharacter({
      characterId: "sigrika",
      ownedMusicIds: ["denia-skill-alt"],
      tracks
    }).map((track) => track.id)).toEqual(["sigrika-skill-default"]);
  });

  it("stops background music after the game is finished", () => {
    const track = resolveBackgroundMusic({
      view: "room",
      gamePhase: "finished",
      latestSkillCharacterId: "danea"
    });

    expect(track).toBeNull();
  });

  it("restores home music after exiting a finished replay to the lobby", () => {
    const track = resolveBackgroundMusic({
      view: "home",
      gamePhase: "finished",
      latestSkillCharacterId: "denia"
    });

    expect(track).toMatchObject({
      id: "home-default",
      type: "home"
    });
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
        { color: "white", character: { id: "denia" } }
      ]
    });

    expect(characterId).toBe("denia");
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
    expect(resolveSkillVoice({ characterId: "sigrika" })).toBe("/assets/voice/sigrika_skill_cast.ogg");
  });

  it("uses the configured Aemeath skill voice", () => {
    expect(resolveSkillVoice({ characterId: "aemeath" })).toBe("/assets/voice/aemeath_skill_cast.ogg");
  });

  it("uses the configured Nabomo skill voice", () => {
    expect(resolveSkillVoice({ characterId: "nabomo" })).toBe("/assets/voice/nabomo_skill_cast.ogg");
  });

  it("uses the configured Baconbits skill voice", () => {
    expect(resolveSkillVoice({ characterId: "baconbits" })).toBe("/assets/voice/baconbits_skill_cast.ogg");
  });

  it("uses the configured Denia skill voice", () => {
    expect(resolveSkillVoice({ characterId: "denia" })).toBe("/assets/voice/denia_skill_cast.ogg");
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
      sigrika: "/assets/voice/sigrika_skill_cast.ogg"
    }, {})).toEqual({
      sigrika: {
        "skill-cast": "/assets/voice/sigrika_skill_cast.ogg"
      }
    });
  });

  it("includes Baconbits character system voices", () => {
    expect(CHARACTER_SYSTEM_VOICES.baconbits).toMatchObject({
      "game-start": "/assets/voice/baconbits_game_start.ogg",
      sortie: "/assets/voice/baconbits_sortie.ogg",
      "byo-yomi-start": "/assets/voice/baconbits_byo_yomi_start.ogg",
      "byo-yomi-period-2": "/assets/voice/baconbits_byo_yomi_periods.ogg",
      "byo-yomi-period-1": "/assets/voice/baconbits_byo_yomi_periods.ogg",
      "result-victory": "/assets/voice/baconbits_result_win.ogg",
      "result-defeat": "/assets/voice/baconbits_result_loss.ogg"
    });
    expect(CHARACTER_SYSTEM_VOICES.baconbits).not.toHaveProperty("timeout");
  });

  it("includes Denia character system voices", () => {
    expect(CHARACTER_SYSTEM_VOICES.denia).toMatchObject({
      "game-start": "/assets/voice/denia_match_start.ogg",
      sortie: "/assets/voice/denia_sortie.ogg",
      "byo-yomi-start": "/assets/voice/denia_byoyomi_start.ogg",
      "byo-yomi-period-2": "/assets/voice/denia_byoyomi_remaining_2.ogg",
      "byo-yomi-period-1": "/assets/voice/denia_byoyomi_remaining_1.ogg",
      "countdown-10": "/assets/voice/denia_countdown_10.ogg",
      "countdown-1": "/assets/voice/denia_countdown_1.ogg",
      "result-victory": "/assets/voice/denia_result_win.ogg",
      "result-defeat": "/assets/voice/denia_result_loss.ogg",
      "result-draw": "/assets/voice/denia_result_draw.ogg"
    });
  });

  it("includes Sigrika character system voices", () => {
    expect(CHARACTER_SYSTEM_VOICES.sigrika).toMatchObject({
      "game-start": "/assets/voice/sigrika_match_start.ogg",
      sortie: "/assets/voice/sigrika_sortie.ogg",
      "byo-yomi-start": "/assets/voice/sigrika_byoyomi_start.ogg",
      "byo-yomi-period-2": "/assets/voice/sigrika_byoyomi_remaining_2.ogg",
      "byo-yomi-period-1": "/assets/voice/sigrika_byoyomi_remaining_1.ogg",
      "countdown-10": "/assets/voice/sigrika_countdown_10.ogg",
      "countdown-9": "/assets/voice/sigrika_countdown_9.ogg",
      "countdown-8": "/assets/voice/sigrika_countdown_8.ogg",
      "countdown-7": "/assets/voice/sigrika_countdown_7.ogg",
      "countdown-6": "/assets/voice/sigrika_countdown_6.ogg",
      "countdown-5": "/assets/voice/sigrika_countdown_5.ogg",
      "countdown-4": "/assets/voice/sigrika_countdown_4.ogg",
      "countdown-3": "/assets/voice/sigrika_countdown_3.ogg",
      "countdown-2": "/assets/voice/sigrika_countdown_2.ogg",
      "countdown-1": "/assets/voice/sigrika_countdown_1.ogg",
      "result-victory": "/assets/voice/sigrika_result_win.ogg",
      "result-defeat": "/assets/voice/sigrika_result_loss.ogg",
      "result-draw": "/assets/voice/sigrika_result_draw.ogg"
    });
  });

  it("includes Aemeath character system voices", () => {
    expect(CHARACTER_SYSTEM_VOICES.aemeath).toMatchObject({
      "game-start": "/assets/voice/aemeath_match_start.ogg",
      sortie: "/assets/voice/aemeath_sortie.ogg",
      "byo-yomi-start": "/assets/voice/aemeath_byoyomi_start.ogg",
      "byo-yomi-period-2": "/assets/voice/aemeath_byoyomi_remaining_2.ogg",
      "byo-yomi-period-1": "/assets/voice/aemeath_byoyomi_remaining_1.ogg",
      "countdown-10": "/assets/voice/aemeath_countdown_10.ogg",
      "countdown-9": "/assets/voice/aemeath_countdown_9.ogg",
      "countdown-8": "/assets/voice/aemeath_countdown_8.ogg",
      "countdown-7": "/assets/voice/aemeath_countdown_7.ogg",
      "countdown-6": "/assets/voice/aemeath_countdown_6.ogg",
      "countdown-5": "/assets/voice/aemeath_countdown_5.ogg",
      "countdown-4": "/assets/voice/aemeath_countdown_4.ogg",
      "countdown-3": "/assets/voice/aemeath_countdown_3.ogg",
      "countdown-2": "/assets/voice/aemeath_countdown_2.ogg",
      "countdown-1": "/assets/voice/aemeath_countdown_1.ogg",
      "result-victory": "/assets/voice/aemeath_result_win.ogg",
      "result-defeat": "/assets/voice/aemeath_result_loss.ogg",
      "result-draw": "/assets/voice/aemeath_result_draw.ogg"
    });
  });

  it("includes Nabomo character system voices", () => {
    expect(CHARACTER_SYSTEM_VOICES.nabomo).toMatchObject({
      "game-start": "/assets/voice/nabomo_match_start.ogg",
      sortie: "/assets/voice/nabomo_sortie.ogg",
      "byo-yomi-start": "/assets/voice/nabomo_byoyomi_start.ogg",
      "byo-yomi-period-2": "/assets/voice/nabomo_byoyomi_remaining_2.ogg",
      "byo-yomi-period-1": "/assets/voice/nabomo_byoyomi_remaining_1.ogg",
      "countdown-10": "/assets/voice/nabomo_countdown_10.ogg",
      "countdown-9": "/assets/voice/nabomo_countdown_9.ogg",
      "countdown-8": "/assets/voice/nabomo_countdown_8.ogg",
      "countdown-7": "/assets/voice/nabomo_countdown_7.ogg",
      "countdown-6": "/assets/voice/nabomo_countdown_6.ogg",
      "countdown-5": "/assets/voice/nabomo_countdown_5.ogg",
      "countdown-4": "/assets/voice/nabomo_countdown_4.ogg",
      "countdown-3": "/assets/voice/nabomo_countdown_3.ogg",
      "countdown-2": "/assets/voice/nabomo_countdown_2.ogg",
      "countdown-1": "/assets/voice/nabomo_countdown_1.ogg",
      "result-victory": "/assets/voice/nabomo_result_win.ogg",
      "result-defeat": "/assets/voice/nabomo_result_loss.ogg",
      "result-draw": "/assets/voice/nabomo_result_draw.ogg"
    });
  });

  it("merges Baconbits system voices with the skill voice bridge", () => {
    expect(characterVoiceMapForSkill().baconbits).toMatchObject({
      "game-start": "/assets/voice/baconbits_game_start.ogg",
      sortie: "/assets/voice/baconbits_sortie.ogg",
      "byo-yomi-start": "/assets/voice/baconbits_byo_yomi_start.ogg",
      "byo-yomi-period-2": "/assets/voice/baconbits_byo_yomi_periods.ogg",
      "byo-yomi-period-1": "/assets/voice/baconbits_byo_yomi_periods.ogg",
      "result-victory": "/assets/voice/baconbits_result_win.ogg",
      "result-defeat": "/assets/voice/baconbits_result_loss.ogg",
      "skill-cast": "/assets/voice/baconbits_skill_cast.ogg"
    });
    expect(characterVoiceMapForSkill().baconbits).not.toHaveProperty("timeout");
  });
});

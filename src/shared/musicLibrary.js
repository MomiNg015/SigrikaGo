import { SYSTEM_VOICE_EVENTS, SYSTEM_VOICE_MODE_EVENTS, SYSTEM_VOICE_SKILL_EVENTS, resolveVoiceSource } from "./systemVoices.js";
import { canonicalCharacterId } from "./characterAliases.js";

export const MUSIC_TYPES = {
  home: "home",
  battle: "battle",
  skill: "skill"
};

export const MATCH_SUCCESS_SOUND = "/assets/music/match-success.mp3";
export const VICTORY_SOUND = "/assets/music/result-victory.mp3";
export const DEFEAT_SOUND = "/assets/music/result-defeat.mp3";
export const CHARACTER_SKILL_VOICES = {
  denia: "/assets/voice/denia_skill_cast.ogg",
  sigrika: "/assets/voice/sigrika_skill_cast.ogg",
  aemeath: "/assets/voice/aemeath_skill_cast.ogg",
  nabomo: "/assets/voice/nabomo_skill_cast.ogg",
  baconbits: "/assets/voice/baconbits_skill_cast.ogg",
  lynae: "/assets/voice/lynae_skill_cast.ogg",
  changli: "/assets/voice/changli_skill_cast.ogg",
  chisa: "/assets/voice/chisa_skill_cast.ogg",
  mornye: "/assets/voice/mornye_skill_cast.ogg",
  qiuyuan: [
    "/assets/voice/qiuyuan_skill_cast.ogg",
    "/assets/voice/qiuyuan_skill_cast_1.ogg"
  ]
};

export const CHARACTER_SYSTEM_VOICES = {
  denia: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/denia_match_start.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/denia_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/denia_byoyomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/denia_byoyomi_remaining_2.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/denia_byoyomi_remaining_1.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/denia_countdown_10.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(9)]: "/assets/voice/denia_countdown_9.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(8)]: "/assets/voice/denia_countdown_8.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(7)]: "/assets/voice/denia_countdown_7.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(6)]: "/assets/voice/denia_countdown_6.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/denia_countdown_5.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(4)]: "/assets/voice/denia_countdown_4.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(3)]: "/assets/voice/denia_countdown_3.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(2)]: "/assets/voice/denia_countdown_2.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/denia_countdown_1.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/denia_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/denia_result_loss.ogg",
    [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/denia_result_draw.ogg"
  },
  sigrika: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/sigrika_match_start.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/sigrika_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/sigrika_byoyomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/sigrika_byoyomi_remaining_2.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/sigrika_byoyomi_remaining_1.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/sigrika_countdown_10.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(9)]: "/assets/voice/sigrika_countdown_9.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(8)]: "/assets/voice/sigrika_countdown_8.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(7)]: "/assets/voice/sigrika_countdown_7.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(6)]: "/assets/voice/sigrika_countdown_6.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/sigrika_countdown_5.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(4)]: "/assets/voice/sigrika_countdown_4.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(3)]: "/assets/voice/sigrika_countdown_3.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(2)]: "/assets/voice/sigrika_countdown_2.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/sigrika_countdown_1.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/sigrika_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/sigrika_result_loss.ogg",
    [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/sigrika_result_draw.ogg"
  },
  aemeath: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/aemeath_match_start.ogg",
    [SYSTEM_VOICE_SKILL_EVENTS.voyageStarSkillCast]: "/assets/voice/aemeath_skill_cast_voyage.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/aemeath_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/aemeath_byoyomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/aemeath_byoyomi_remaining_2.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/aemeath_byoyomi_remaining_1.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/aemeath_countdown_10.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(9)]: "/assets/voice/aemeath_countdown_9.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(8)]: "/assets/voice/aemeath_countdown_8.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(7)]: "/assets/voice/aemeath_countdown_7.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(6)]: "/assets/voice/aemeath_countdown_6.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/aemeath_countdown_5.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(4)]: "/assets/voice/aemeath_countdown_4.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(3)]: "/assets/voice/aemeath_countdown_3.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(2)]: "/assets/voice/aemeath_countdown_2.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/aemeath_countdown_1.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/aemeath_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/aemeath_result_loss.ogg",
    [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/aemeath_result_draw.ogg"
  },
  nabomo: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/nabomo_match_start.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/nabomo_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/nabomo_byoyomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/nabomo_byoyomi_remaining_2.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/nabomo_byoyomi_remaining_1.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/nabomo_countdown_10.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(9)]: "/assets/voice/nabomo_countdown_9.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(8)]: "/assets/voice/nabomo_countdown_8.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(7)]: "/assets/voice/nabomo_countdown_7.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(6)]: "/assets/voice/nabomo_countdown_6.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/nabomo_countdown_5.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(4)]: "/assets/voice/nabomo_countdown_4.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(3)]: "/assets/voice/nabomo_countdown_3.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(2)]: "/assets/voice/nabomo_countdown_2.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/nabomo_countdown_1.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/nabomo_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/nabomo_result_loss.ogg",
    [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/nabomo_result_draw.ogg"
  },
  lynae: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/lynae_match_start.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/lynae_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/lynae_byoyomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/lynae_byoyomi_remaining_2.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/lynae_byoyomi_remaining_1.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/lynae_countdown_10.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(9)]: "/assets/voice/lynae_countdown_9.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(8)]: "/assets/voice/lynae_countdown_8.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(7)]: "/assets/voice/lynae_countdown_7.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(6)]: "/assets/voice/lynae_countdown_6.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/lynae_countdown_5.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(4)]: "/assets/voice/lynae_countdown_4.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(3)]: "/assets/voice/lynae_countdown_3.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(2)]: "/assets/voice/lynae_countdown_2.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/lynae_countdown_1.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/lynae_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/lynae_result_loss.ogg",
    [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/lynae_result_draw.ogg"
  },
  changli: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/changli_match_start.ogg",
    [SYSTEM_VOICE_MODE_EVENTS.gomokuGameStart]: "/assets/voice/changli_wuzi_match_start.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/changli_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/changli_byoyomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/changli_byoyomi_remaining_2.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/changli_byoyomi_remaining_1.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/changli_countdown_10.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(9)]: "/assets/voice/changli_countdown_9.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(8)]: "/assets/voice/changli_countdown_8.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(7)]: "/assets/voice/changli_countdown_7.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(6)]: "/assets/voice/changli_countdown_6.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/changli_countdown_5.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(4)]: "/assets/voice/changli_countdown_4.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(3)]: "/assets/voice/changli_countdown_3.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(2)]: "/assets/voice/changli_countdown_2.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/changli_countdown_1.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/changli_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/changli_result_loss.ogg",
    [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/changli_result_draw.ogg"
  },
  chisa: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/chisa_match_start.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/chisa_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/chisa_byoyomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/chisa_byoyomi_remaining_2.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/chisa_byoyomi_remaining_1.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/chisa_countdown_10.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(9)]: "/assets/voice/chisa_countdown_9.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(8)]: "/assets/voice/chisa_countdown_8.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(7)]: "/assets/voice/chisa_countdown_7.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(6)]: "/assets/voice/chisa_countdown_6.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/chisa_countdown_5.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(4)]: "/assets/voice/chisa_countdown_4.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(3)]: "/assets/voice/chisa_countdown_3.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(2)]: "/assets/voice/chisa_countdown_2.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/chisa_countdown_1.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/chisa_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/chisa_result_loss.ogg",
    [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/chisa_result_draw.ogg"
  },
  mornye: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/mornye_match_start.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/mornye_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.houseDetail]: "/assets/voice/mornye_detail.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/mornye_byoyomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/mornye_byoyomi_remaining_2.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/mornye_byoyomi_remaining_1.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(10)]: "/assets/voice/mornye_countdown_10.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(9)]: "/assets/voice/mornye_countdown_9.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(8)]: "/assets/voice/mornye_countdown_8.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(7)]: "/assets/voice/mornye_countdown_7.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(6)]: "/assets/voice/mornye_countdown_6.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(5)]: "/assets/voice/mornye_countdown_5.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(4)]: "/assets/voice/mornye_countdown_4.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(3)]: "/assets/voice/mornye_countdown_3.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(2)]: "/assets/voice/mornye_countdown_2.ogg",
    [SYSTEM_VOICE_EVENTS.countdown(1)]: "/assets/voice/mornye_countdown_1.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/mornye_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/mornye_result_loss.ogg",
    [SYSTEM_VOICE_EVENTS.resultDraw]: "/assets/voice/mornye_result_draw.ogg"
  },
  baconbits: {
    [SYSTEM_VOICE_EVENTS.gameStart]: "/assets/voice/baconbits_game_start.ogg",
    [SYSTEM_VOICE_EVENTS.sortie]: "/assets/voice/baconbits_sortie.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: "/assets/voice/baconbits_byo_yomi_start.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "/assets/voice/baconbits_byo_yomi_periods.ogg",
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "/assets/voice/baconbits_byo_yomi_periods.ogg",
    [SYSTEM_VOICE_EVENTS.resultVictory]: "/assets/voice/baconbits_result_win.ogg",
    [SYSTEM_VOICE_EVENTS.resultDefeat]: "/assets/voice/baconbits_result_loss.ogg"
  }
};

function introLoop(introSrc, loopSrc) {
  return {
    mode: "intro-loop",
    introSrc,
    loopSrc,
    loop: true
  };
}

export const MUSIC_TRACKS = {
  "home-default": {
    id: "home-default",
    name: "Default Home BGM",
    type: MUSIC_TYPES.home,
    defaultUnlocked: true,
    purchasable: false,
    playback: { mode: "single-loop", src: "/assets/music/main_bgm.ogg", loop: true }
  },
  "battle-default": {
    id: "battle-default",
    name: "Default Battle BGM",
    type: MUSIC_TYPES.battle,
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/shanjifu_intro_once.ogg", "/assets/music/shanjifu_loop.ogg")
  },
  "denia-skill-default": {
    id: "denia-skill-default",
    name: "Denia Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "denia",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/bgm_intro_once.ogg", "/assets/music/bgm_loop.ogg")
  },
  "sigrika-skill-default": {
    id: "sigrika-skill-default",
    name: "Sigrika Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "sigrika",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/sigrika_intro_once.ogg", "/assets/music/sigrika_loop.ogg")
  },
  "sigrika-skill-dream": {
    id: "sigrika-skill-dream",
    name: "Sigrika Dream BGM",
    type: MUSIC_TYPES.skill,
    characterId: "sigrika",
    defaultUnlocked: false,
    purchasable: true,
    playback: introLoop("/assets/music/sigrika_intro_once.ogg", "/assets/music/sigrika_loop.ogg")
  },
  "aemeath-skill-default": {
    id: "aemeath-skill-default",
    name: "Aemeath Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "aemeath",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/aemeath0_once.ogg", "/assets/music/aemeath0_loop.ogg")
  },
  "aemeath-voyage-star-default": {
    id: "aemeath-voyage-star-default",
    name: "Aemeath Voyage Star BGM",
    type: MUSIC_TYPES.skill,
    characterId: "aemeath",
    effectType: "voyage-star",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/lhl_intro_once.ogg", "/assets/music/lhl_loop.ogg")
  },
  "baconbits-skill-default": {
    id: "baconbits-skill-default",
    name: "Baconbits Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "baconbits",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/matoya_intro_once.ogg", "/assets/music/matoya_loop.ogg")
  },
  "nabomo-skill-default": {
    id: "nabomo-skill-default",
    name: "Nabomo Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "nabomo",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/busizhe_intro_once.ogg", "/assets/music/busizhe_loop.ogg")
  },
  "qiuyuan-skill-default": {
    id: "qiuyuan-skill-default",
    name: "Qiuyuan Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "qiuyuan",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/qiuyuan_intro_once.ogg", "/assets/music/qiuyuan_loop.ogg")
  },
  "qiuyuan-skill-zhouwo": {
    id: "qiuyuan-skill-zhouwo",
    name: "肘我",
    type: MUSIC_TYPES.skill,
    characterId: "qiuyuan",
    defaultUnlocked: false,
    purchasable: true,
    playback: { mode: "single-loop", src: "/assets/music/qiuyuan_zhouwo_loop.ogg", loop: true }
  },
  "lynae-skill-default": {
    id: "lynae-skill-default",
    name: "Lynae Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "lynae",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/lynae_intro_once.ogg", "/assets/music/lynae_loop.ogg")
  },
  "chisa-skill-default": {
    id: "chisa-skill-default",
    name: "Chisa Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "chisa",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/chisa_intro_once.ogg", "/assets/music/chisa_loop.ogg")
  },
  "changli-skill-default": {
    id: "changli-skill-default",
    name: "Changli Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "changli",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/changli_intro_once.ogg", "/assets/music/changli_loop.ogg")
  },
  "mornye-skill-default": {
    id: "mornye-skill-default",
    name: "Mornye Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "mornye",
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/mornye_intro_once.ogg", "/assets/music/mornye_loop.ogg")
  }
};

export const DEFAULT_MUSIC_SELECTIONS = {
  home: "home-default",
  battle: "battle-default",
  skill: {}
};

export function musicTracksWithDisplayNames(tracks = MUSIC_TRACKS, displayNames = {}) {
  const entries = Object.entries(tracks ?? {}).map(([id, track]) => {
    const displayName = String(displayNames?.[id] ?? "").trim();
    return [
      id,
      {
        ...track,
        defaultName: track.defaultName ?? track.name,
        name: displayName || track.name
      }
    ];
  });
  return Object.fromEntries(entries);
}

export function parseMusicIds(value) {
  if (Array.isArray(value)) return normalizeMusicIds(value);
  const text = String(value ?? "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      return normalizeMusicIds(JSON.parse(text));
    } catch {
      return [];
    }
  }
  return normalizeMusicIds(text.split(","));
}

export function serializeMusicIds(value = []) {
  return JSON.stringify(normalizeMusicIds(value));
}

export function parseMusicSelections(value) {
  const raw = typeof value === "string" ? parseJsonObject(value) : value;
  const selections = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return normalizeMusicSelections(selections);
}

export function serializeMusicSelections(value = {}) {
  return JSON.stringify(normalizeMusicSelections(value));
}

export function ownedMusicIdsWithDefaults(value = [], tracks = MUSIC_TRACKS) {
  const owned = new Set(parseMusicIds(value));
  for (const track of Object.values(tracks)) {
    if (track.defaultUnlocked) owned.add(track.id);
  }
  return [...owned];
}

export function skillMusicOptionsForCharacter({ characterId, ownedMusicIds = null, tracks = MUSIC_TRACKS } = {}) {
  const normalizedCharacterId = canonicalCharacterId(characterId);
  if (!normalizedCharacterId) return [];
  return Object.values(tracks).filter((track) => (
    isUsableTrack(track, MUSIC_TYPES.skill, ownedMusicIds)
    && canonicalCharacterId(track.characterId) === normalizedCharacterId
    && track.selectable !== false
  ));
}

export function resolveSkillMusicTrack({
  characterId,
  selections = {},
  ownedMusicIds = null,
  tracks = MUSIC_TRACKS
} = {}) {
  const normalizedCharacterId = canonicalCharacterId(characterId);
  if (!normalizedCharacterId) return null;
  const normalizedSelections = parseMusicSelections(selections);
  const selectedId = normalizedSelections.skill?.[normalizedCharacterId];
  const selectedTrack = selectedId ? tracks[selectedId] : null;
  if (
    isUsableTrack(selectedTrack, MUSIC_TYPES.skill, ownedMusicIds)
    && canonicalCharacterId(selectedTrack.characterId) === normalizedCharacterId
  ) {
    return selectedTrack;
  }

  return skillMusicOptionsForCharacter({ characterId: normalizedCharacterId, ownedMusicIds, tracks })[0] ?? null;
}

export function resolveBackgroundMusic({
  view,
  skillPreview = null,
  latestSkillPreview = null,
  latestSkillCharacterId = null,
  gamePhase = null,
  matchSuccess = false,
  resultModalOpen = false,
  selections = {},
  ownedMusicIds = null,
  tracks = MUSIC_TRACKS,
  defaults = DEFAULT_MUSIC_SELECTIONS
} = {}) {
  if (matchSuccess || resultModalOpen || (view === "room" && gamePhase === "finished")) return null;

  if (view === "room" && skillPreview) {
    const skillTrack = findSkillTrack(skillPreview, tracks, selections, ownedMusicIds);
    if (skillTrack) return skillTrack;
  }

  if (view === "room" && gamePhase !== "finished" && latestSkillPreview) {
    const skillTrack = findSkillTrack(latestSkillPreview, tracks, selections, ownedMusicIds);
    if (skillTrack) return skillTrack;
  }

  if (view === "room" && gamePhase !== "finished" && latestSkillCharacterId) {
    const skillTrack = findSkillTrack({ characterId: latestSkillCharacterId }, tracks, selections, ownedMusicIds);
    if (skillTrack) return skillTrack;
  }

  if (view === "room") {
    return resolveTypedTrack(MUSIC_TYPES.battle, selections.battle, ownedMusicIds, tracks, defaults.battle);
  }

  if (view === "home") {
    return resolveTypedTrack(MUSIC_TYPES.home, selections.home, ownedMusicIds, tracks, defaults.home);
  }

  return null;
}

export function latestSkillCharacterId(room) {
  return latestSkillPreview(room)?.characterId ?? null;
}

export function latestSkillPreview(room) {
  if (!room?.game || room.game.phase === "finished") return null;
  const latestSkill = [...(room.game.history ?? [])].reverse().find((entry) => entry.type === "skill");
  if (!latestSkill) return null;
  const player = (room.players ?? []).find((candidate) => candidate.color === latestSkill.color);
  const characterId = canonicalCharacterId(player?.character?.id ?? player?.characterId ?? latestSkill.characterId ?? null);
  if (!characterId) return null;
  return {
    characterId,
    ...(latestSkill.effectType ? { effectType: latestSkill.effectType } : {}),
    ...(latestSkill.musicTrackId ? { musicTrackId: latestSkill.musicTrackId } : {})
  };
}

export function resolveResultSound(room, user) {
  const winnerColor = room?.game?.winner?.winnerColor ?? room?.game?.winner?.color;
  if (!winnerColor) return null;
  const player = (room?.players ?? []).find((candidate) => candidate.user?.id === user?.id);
  if (!player) return null;
  return player.color === winnerColor ? VICTORY_SOUND : DEFEAT_SOUND;
}

export function resolveSkillVoice(skillPreview, voices = CHARACTER_SKILL_VOICES, random = Math.random) {
  const characterId = skillPreview?.characterId ?? skillPreview?.character?.id;
  if (!characterId) return null;
  return resolveVoiceSource(voices[characterId], random);
}

export function characterVoiceMapForSkill(voices = CHARACTER_SKILL_VOICES, systemVoices = CHARACTER_SYSTEM_VOICES) {
  const characterIds = new Set([
    ...Object.keys(systemVoices ?? {}),
    ...Object.keys(voices ?? {})
  ]);
  return Object.fromEntries(
    [...characterIds]
      .map((characterId) => [
        characterId,
        {
          ...(systemVoices?.[characterId] ?? {}),
          ...(voices?.[characterId] ? { [SYSTEM_VOICE_EVENTS.skillCast]: voices[characterId] } : {})
        }
      ])
      .filter(([, voiceMap]) => Object.keys(voiceMap).length > 0)
  );
}

function findSkillTrack(skillPreview, tracks, selections = {}, ownedMusicIds = null) {
  const characterId = canonicalCharacterId(skillPreview?.characterId ?? skillPreview?.character?.id);
  if (!characterId) return null;
  const fixedTrack = skillPreview?.musicTrackId ? tracks[skillPreview.musicTrackId] : null;
  if (
    isUsableTrack(fixedTrack, MUSIC_TYPES.skill, null)
    && canonicalCharacterId(fixedTrack.characterId) === characterId
  ) {
    return fixedTrack;
  }
  return resolveSkillMusicTrack({ characterId, selections, ownedMusicIds, tracks });
}

function resolveTypedTrack(type, selectedId, ownedMusicIds, tracks, defaultId) {
  const selectedTrack = selectedId ? tracks[selectedId] : null;
  if (isUsableTrack(selectedTrack, type, ownedMusicIds)) return selectedTrack;

  const defaultTrack = defaultId ? tracks[defaultId] : null;
  if (isUsableTrack(defaultTrack, type, null)) return defaultTrack;

  return null;
}

function isUsableTrack(track, type, ownedMusicIds) {
  if (!track || track.type !== type || !hasPlayableSource(track)) return false;
  if (!ownedMusicIds) return true;
  return track.defaultUnlocked || ownedMusicIds.includes(track.id);
}

function hasPlayableSource(track) {
  if (track.playback?.mode === "intro-loop") {
    return Boolean(track.playback.introSrc && track.playback.loopSrc);
  }
  return Boolean(track.playback?.src);
}

function normalizeMusicIds(value = []) {
  return [...new Set(
    value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
  )];
}

function normalizeMusicSelections(value = {}) {
  const skill = value.skill && typeof value.skill === "object" && !Array.isArray(value.skill)
    ? Object.fromEntries(
      Object.entries(value.skill)
        .map(([characterId, trackId]) => [canonicalCharacterId(characterId), String(trackId ?? "").trim()])
        .filter(([characterId, trackId]) => characterId && trackId)
    )
    : {};
  return {
    ...(typeof value.home === "string" && value.home.trim() ? { home: value.home.trim() } : {}),
    ...(typeof value.battle === "string" && value.battle.trim() ? { battle: value.battle.trim() } : {}),
    skill
  };
}

function parseJsonObject(value) {
  const text = String(value ?? "").trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

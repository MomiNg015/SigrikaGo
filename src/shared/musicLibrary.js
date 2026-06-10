import { SYSTEM_VOICE_EVENTS } from "./systemVoices.js";
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
  baconbits: "/assets/voice/baconbits_skill_cast.ogg"
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
    playback: introLoop("/assets/music/koimoon_132_intro_no_fadein_2p5s.ogg", "/assets/music/koimoon_132_micro_loop.ogg")
  },
  "sigrika-skill-dream": {
    id: "sigrika-skill-dream",
    name: "Sigrika Dream BGM",
    type: MUSIC_TYPES.skill,
    characterId: "sigrika",
    defaultUnlocked: false,
    purchasable: true,
    playback: introLoop("/assets/music/koimoon_132_intro_no_fadein_2p5s.ogg", "/assets/music/koimoon_132_micro_loop.ogg")
  },
  "aemeath-skill-default": {
    id: "aemeath-skill-default",
    name: "Aemeath Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "aemeath",
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
  }
};

export const DEFAULT_MUSIC_SELECTIONS = {
  home: "home-default",
  battle: "battle-default",
  skill: {}
};

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
  if (!room?.game || room.game.phase === "finished") return null;
  const latestSkill = [...(room.game.history ?? [])].reverse().find((entry) => entry.type === "skill");
  if (!latestSkill) return null;
  const player = (room.players ?? []).find((candidate) => candidate.color === latestSkill.color);
  return canonicalCharacterId(player?.character?.id ?? player?.characterId ?? null);
}

export function resolveResultSound(room, user) {
  const winnerColor = room?.game?.winner?.winnerColor ?? room?.game?.winner?.color;
  if (!winnerColor) return null;
  const player = (room?.players ?? []).find((candidate) => candidate.user?.id === user?.id);
  if (!player) return null;
  return player.color === winnerColor ? VICTORY_SOUND : DEFEAT_SOUND;
}

export function resolveSkillVoice(skillPreview, voices = CHARACTER_SKILL_VOICES) {
  const characterId = skillPreview?.characterId ?? skillPreview?.character?.id;
  if (!characterId) return null;
  return voices[characterId] ?? null;
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

import { SYSTEM_VOICE_EVENTS } from "./systemVoices.js";

export const MUSIC_TYPES = {
  home: "home",
  battle: "battle",
  skill: "skill"
};

export const MATCH_SUCCESS_SOUND = "/assets/music/match-success.mp3";
export const VICTORY_SOUND = "/assets/music/result-victory.mp3";
export const DEFEAT_SOUND = "/assets/music/result-defeat.mp3";
export const CHARACTER_SKILL_VOICES = {
  sigrika: "/assets/voice/sigrika_2_no_exclaim.ogg",
  aemeath: "/assets/voice/aemeath_skill.ogg",
  baconbits: "/assets/voice/baconbits_skill.ogg"
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
    playback: introLoop("/assets/music/hidamari_intro_once.ogg", "/assets/music/hidamari_loop.ogg")
  },
  "battle-default": {
    id: "battle-default",
    name: "Default Battle BGM",
    type: MUSIC_TYPES.battle,
    defaultUnlocked: true,
    purchasable: false,
    playback: introLoop("/assets/music/shanjifu_intro_once.ogg", "/assets/music/shanjifu_loop.ogg")
  },
  "danea-skill-default": {
    id: "danea-skill-default",
    name: "Danea Skill BGM",
    type: MUSIC_TYPES.skill,
    characterId: "danea",
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
  battle: "battle-default"
};

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
  if (matchSuccess || resultModalOpen || gamePhase === "finished") return null;

  if (view === "room" && skillPreview) {
    const skillTrack = findSkillTrack(skillPreview, tracks);
    if (skillTrack) return skillTrack;
  }

  if (view === "room" && gamePhase !== "finished" && latestSkillCharacterId) {
    const skillTrack = findSkillTrack({ characterId: latestSkillCharacterId }, tracks);
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
  return player?.character?.id ?? player?.characterId ?? null;
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

export function characterVoiceMapForSkill(voices = CHARACTER_SKILL_VOICES) {
  return Object.fromEntries(
    Object.entries(voices)
      .filter(([, src]) => Boolean(src))
      .map(([characterId, src]) => [
        characterId,
        { [SYSTEM_VOICE_EVENTS.skillCast]: src }
      ])
  );
}

function findSkillTrack(skillPreview, tracks) {
  const characterId = skillPreview?.characterId ?? skillPreview?.character?.id;
  if (!characterId) return null;
  return Object.values(tracks).find((track) => (
    track.type === MUSIC_TYPES.skill && track.characterId === characterId
  )) ?? null;
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

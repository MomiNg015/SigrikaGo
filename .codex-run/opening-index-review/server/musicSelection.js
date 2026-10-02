import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import {
  MUSIC_TRACKS,
  normalizeSkillMusicEffectType,
  ownedMusicIdsWithDefaults,
  parseMusicSelections,
  serializeMusicSelections,
  skillMusicOptionsForCharacter
} from "../src/shared/musicLibrary.js";
import { publicUser } from "./db.js";

export async function selectUserSkillMusic({
  prisma,
  user,
  characterId,
  trackId,
  effectType = "",
  tracks = MUSIC_TRACKS
}) {
  const normalizedCharacterId = canonicalCharacterId(String(characterId ?? ""));
  const normalizedTrackId = String(trackId ?? "").trim();
  const normalizedEffectType = normalizeSkillMusicEffectType(effectType);
  if (!normalizedCharacterId || !normalizedTrackId) {
    throw routeError(400, "music selection requires characterId and trackId");
  }

  const ownedMusicIds = ownedMusicIdsWithDefaults(user.ownedMusicIds, tracks);
  const options = skillMusicOptionsForCharacter({
    characterId: normalizedCharacterId,
    effectType: normalizedEffectType,
    ownedMusicIds,
    tracks
  });
  if (!options.some((track) => track.id === normalizedTrackId)) {
    throw routeError(403, "尚未获得该角色音乐");
  }

  const selections = parseMusicSelections(user.musicSelections);
  const nextSelections = normalizedEffectType
    ? {
        ...selections,
        derivedSkill: {
          ...(selections.derivedSkill ?? {}),
          [normalizedCharacterId]: {
            ...(selections.derivedSkill?.[normalizedCharacterId] ?? {}),
            [normalizedEffectType]: normalizedTrackId
          }
        }
      }
    : {
        ...selections,
        skill: {
          ...selections.skill,
          [normalizedCharacterId]: normalizedTrackId
        }
      };
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      musicSelections: serializeMusicSelections(nextSelections)
    }
  });
  return { user: publicUser(updated) };
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

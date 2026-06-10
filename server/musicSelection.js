import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import {
  ownedMusicIdsWithDefaults,
  parseMusicSelections,
  serializeMusicSelections,
  skillMusicOptionsForCharacter
} from "../src/shared/musicLibrary.js";
import { publicUser } from "./db.js";

export async function selectUserSkillMusic({ prisma, user, characterId, trackId }) {
  const normalizedCharacterId = canonicalCharacterId(String(characterId ?? ""));
  const normalizedTrackId = String(trackId ?? "").trim();
  if (!normalizedCharacterId || !normalizedTrackId) {
    throw routeError(400, "music selection requires characterId and trackId");
  }

  const ownedMusicIds = ownedMusicIdsWithDefaults(user.ownedMusicIds);
  const options = skillMusicOptionsForCharacter({ characterId: normalizedCharacterId, ownedMusicIds });
  if (!options.some((track) => track.id === normalizedTrackId)) {
    throw routeError(403, "尚未获得该角色音乐");
  }

  const selections = parseMusicSelections(user.musicSelections);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      musicSelections: serializeMusicSelections({
        ...selections,
        skill: {
          ...selections.skill,
          [normalizedCharacterId]: normalizedTrackId
        }
      })
    }
  });
  return { user: publicUser(updated) };
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

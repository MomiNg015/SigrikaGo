import { latestSkillCharacterId, resolveBackgroundMusic } from "../shared/musicLibrary.js";

export function useBackgroundMusicTrack({ matchSuccess, resultModalOpen, room, user, view }) {
  return resolveBackgroundMusic({
    view,
    skillPreview: room?.game?.pendingSkill,
    latestSkillCharacterId: latestSkillCharacterId(room),
    gamePhase: room?.game?.phase,
    matchSuccess: Boolean(matchSuccess),
    resultModalOpen,
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds
  });
}

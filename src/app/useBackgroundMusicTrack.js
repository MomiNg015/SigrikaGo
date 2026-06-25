import { latestSkillPreview, resolveBackgroundMusic } from "../shared/musicLibrary.js";

export function useBackgroundMusicTrack({ matchSuccess, musicTracks, resultModalOpen, room, user, view }) {
  return resolveBackgroundMusic({
    view,
    skillPreview: room?.game?.pendingSkill,
    latestSkillPreview: latestSkillPreview(room),
    gamePhase: room?.game?.phase,
    matchSuccess: Boolean(matchSuccess),
    resultModalOpen,
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds,
    tracks: musicTracks
  });
}

import { useRef } from "react";
import { latestSkillPreview, resolveBackgroundMusic } from "../shared/musicLibrary.js";

export function useBackgroundMusicTrack({ matchSuccess, musicTracks, resultModalOpen, room, user, view }) {
  const homeEntryRandomStateRef = useRef(initialHomeEntryRandomState());
  homeEntryRandomStateRef.current = nextHomeEntryRandomState(homeEntryRandomStateRef.current, view);

  return resolveBackgroundMusic({
    view,
    skillPreview: room?.game?.pendingSkill,
    latestSkillPreview: latestSkillPreview(room),
    gamePhase: room?.game?.phase,
    matchSuccess: Boolean(matchSuccess),
    resultModalOpen,
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds,
    random: () => homeEntryRandomStateRef.current.random ?? Math.random(),
    tracks: musicTracks
  });
}

export function initialHomeEntryRandomState() {
  return { view: null, random: null };
}

export function nextHomeEntryRandomState(current = initialHomeEntryRandomState(), view, createRandom = Math.random) {
  if (view !== "home") return { view, random: null };
  if (current?.view === "home" && Number.isFinite(current.random)) return current;
  return { view: "home", random: createRandom() };
}

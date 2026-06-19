import { useEffect, useRef } from "react";

export function useSyncedRefs({ audioSettings, incomingDuel, matchSuccess, room, view }) {
  const incomingDuelRef = useRef(incomingDuel);
  const matchSuccessRef = useRef(matchSuccess);
  const roomRef = useRef(room);
  const viewRef = useRef(view);
  const audioSettingsRef = useRef(audioSettings);

  useEffect(() => {
    incomingDuelRef.current = incomingDuel;
  }, [incomingDuel]);

  useEffect(() => {
    matchSuccessRef.current = matchSuccess;
  }, [matchSuccess]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    audioSettingsRef.current = audioSettings;
  }, [audioSettings]);

  return {
    audioSettingsRef,
    incomingDuelRef,
    matchSuccessRef,
    roomRef,
    viewRef
  };
}

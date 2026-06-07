import { useEffect, useRef } from "react";

export function useSyncedRefs({ audioSettings, matchSuccess, room, view }) {
  const matchSuccessRef = useRef(matchSuccess);
  const roomRef = useRef(room);
  const viewRef = useRef(view);
  const audioSettingsRef = useRef(audioSettings);

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
    matchSuccessRef,
    roomRef,
    viewRef
  };
}

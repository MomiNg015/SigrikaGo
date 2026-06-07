import { useEffect } from "react";

export function useAudioSettingsPersistence(audioSettings) {
  useEffect(() => {
    localStorage.setItem("sigrika-audio-settings", JSON.stringify(audioSettings));
  }, [audioSettings]);
}

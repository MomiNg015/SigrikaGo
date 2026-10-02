import { useCallback, useState } from "react";
import { loadAudioSettings } from "../audio/audioSettings.js";
import { useAudioSettingsPersistence } from "./useAudioSettingsPersistence.js";

export function useAudioRuntimeState() {
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const [audioResumeSignal, setAudioResumeSignal] = useState(0);

  useAudioSettingsPersistence(audioSettings);

  const resumeAudioPlayback = useCallback(() => {
    setAudioResumeSignal((value) => value + 1);
  }, []);

  return {
    audioResumeSignal,
    audioSettings,
    resumeAudioPlayback,
    setAudioSettings
  };
}

import { resolveSystemVoice } from "../shared/systemVoices.js";
import { playPreloadedVoiceSound, speakText } from "./playback.jsx";
import { withCharacterSystemVoices } from "../shared/characterDisplay.js";
import { voicePlaybackOptions } from "./voicePlaybackProfiles.js";

export function playSystemVoice(event, { character, params, fallbackText, audioSettings, playbackProfile }) {
  const voice = resolveSystemVoice(event, { character: withCharacterSystemVoices(character), params });
  const playbackOptions = voicePlaybackOptions(playbackProfile);
  if (voice.type === "audio" && voice.src) {
    playPreloadedVoiceSound(voice.src, audioSettings, playbackOptions);
    return;
  }
  const text = voice.text || fallbackText;
  if (text) speakText(text, audioSettings);
}

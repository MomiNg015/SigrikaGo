import { resolveSystemVoice } from "../shared/systemVoices.js";
import { playPreloadedVoiceSound, speakText } from "./playback.jsx";
import { withCharacterSystemVoices } from "../shared/characterDisplay.js";

export function playSystemVoice(event, { character, params, fallbackText, audioSettings }) {
  const voice = resolveSystemVoice(event, { character: withCharacterSystemVoices(character), params });
  if (voice.type === "audio" && voice.src) {
    playPreloadedVoiceSound(voice.src, audioSettings);
    return;
  }
  const text = voice.text || fallbackText;
  if (text) speakText(text, audioSettings);
}

import { stopVoicePlayback } from "../audio/playback.jsx";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import { SYSTEM_VOICE_EVENTS } from "../shared/systemVoices.js";

export function playMatchSortieVoice(character, user, audioSettings) {
  stopVoicePlayback();
  playSystemVoice(SYSTEM_VOICE_EVENTS.sortie, {
    character: { ...character, itemEffects: user?.itemEffects }, audioSettings
  });
}

import { useEffect, useRef } from "react";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "../shared/systemVoices.js";
import { resolveCharacterPortrait } from "../shared/characterPortraits.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";

export default function SkillBanner({ banner, characters, audioSettings }) {
  const playedVoiceBannerRef = useRef("");
  const character = findCharacter(characters, banner.character ?? banner.characterId);
  const voiceCharacter = { ...character, itemEffects: banner.itemEffects ?? {} };
  const effectType = banner.effectType;

  useEffect(() => {
    const voiceParams = { effectType };
    const voice = resolveSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character: voiceCharacter, params: voiceParams });
    if (!shouldPlaySkillBannerVoice(banner, playedVoiceBannerRef.current, voice)) return;
    playedVoiceBannerRef.current = banner.id;
    playSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character: voiceCharacter, params: voiceParams, audioSettings });
  }, [banner, voiceCharacter, effectType, audioSettings]);

  return (
    <div className="skill-burst" aria-live="polite">
      <img
        src={resolveCharacterPortrait(character, {
          itemEffects: banner.itemEffects,
          equippedCostumes: banner.equippedCostumes,
          costumeSnapshot: banner.costumeSnapshot
        })}
        alt={banner.characterName ?? character.name}
      />
      <div>
        <span>{banner.characterName ?? character.name}</span>
        <strong>{banner.skillName ?? character.skill.name}</strong>
      </div>
    </div>
  );
}

export function shouldPlaySkillBannerVoice(banner, playedBannerId, voice = {}) {
  if (!banner?.id || playedBannerId === banner.id) return false;
  return voice.type === "audio" || Boolean(voice.text);
}

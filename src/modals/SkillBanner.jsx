import { useEffect, useRef } from "react";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "../shared/systemVoices.js";
import { characterPortraitImageProps } from "../shared/characterPortraits.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import { SKILL_BANNER_DURATION_MS } from "../shared/skillPresentation.js";

const CUTIN_ACCENTS = { sigrika: "#8660ba", changli: "#df7165", qiuyuan: "#67988d" };

export default function SkillBanner({ banner, characters, audioSettings }) {
  const playedVoiceBannerRef = useRef("");
  const character = findCharacter(characters, banner.character ?? banner.characterId);
  const effectType = banner.effectType;
  const skillName = banner.skillName ?? character.skill.name;
  const portrait = characterPortraitImageProps(character, {
    variant: "full",
    itemEffects: banner.itemEffects,
    equippedCostumes: banner.equippedCostumes,
    costumeSnapshot: banner.costumeSnapshot
  });
  const requestedDuration = Number(banner.bannerDurationMs);
  const duration = Number.isFinite(requestedDuration) && requestedDuration > 0
    ? requestedDuration : SKILL_BANNER_DURATION_MS;

  useEffect(() => {
    const voiceCharacter = { ...character, itemEffects: banner.itemEffects ?? {} };
    const voiceParams = { effectType };
    const voice = resolveSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character: voiceCharacter, params: voiceParams });
    if (!shouldPlaySkillBannerVoice(banner, playedVoiceBannerRef.current, voice)) return;
    playedVoiceBannerRef.current = banner.id;
    playSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character: voiceCharacter, params: voiceParams, audioSettings });
  }, [banner, character, effectType, audioSettings]);

  return (
    <div key={banner.id} className="skill-cutin-scene" aria-live="polite" aria-atomic="true"
      style={{ "--cutin-accent": CUTIN_ACCENTS[character.id] ?? character.palette ?? "#8660ba", "--cutin-duration": `${duration}ms` }}>
      <div className="skill-cutin-scrim" aria-hidden="true" />
      <div className="skill-cutin">
        <div className="skill-cutin-streak skill-cutin-streak-top" aria-hidden="true" />
        <div className="skill-cutin-streak skill-cutin-streak-bottom" aria-hidden="true" />
        <div className="skill-cutin-backing" aria-hidden="true" />
        <div className="skill-cutin-ribbon" aria-hidden="true">
          <div className="skill-cutin-color" />
          <div className="skill-cutin-dots" />
          <div className="skill-cutin-divider" />
          <div className="skill-cutin-sweep" />
        </div>
        <div className="skill-cutin-portrait" aria-hidden="true">
          <img {...portrait} className="skill-cutin-echo" alt="" />
          <img {...portrait} className="skill-cutin-art" alt="" />
        </div>
        <div className={`skill-cutin-copy${Array.from(skillName).length > 6 ? " skill-cutin-long-name" : ""}`}>
          <span className="skill-cutin-name">{banner.characterName ?? character.name}</span>
          <strong className="skill-cutin-title">{skillName}</strong>
          <div className="skill-cutin-underline" aria-hidden="true" />
        </div>
        <span className="skill-cutin-spark skill-cutin-spark-top" aria-hidden="true">✦</span>
        <span className="skill-cutin-spark skill-cutin-spark-bottom" aria-hidden="true">✧</span>
      </div>
    </div>
  );
}

export function shouldPlaySkillBannerVoice(banner, playedBannerId, voice = {}) {
  if (!banner?.id || playedBannerId === banner.id) return false;
  return voice.type === "audio" || Boolean(voice.text);
}

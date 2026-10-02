import { playSkillEffectSound, skillEffectSoundCues } from "../audio/skillEffectSounds.js";

export function scheduleBoardSkillEffectSounds({
  pendingSkill,
  durationMs,
  reducedMotion,
  audioSettings,
  setTimeoutFn = globalThis.setTimeout,
  playSound = playSkillEffectSound
}) {
  if (reducedMotion || !pendingSkill?.effectType) return [];
  const cues = skillEffectSoundCues(pendingSkill.effectType);
  return [
    setTimeoutFn(
      () => playSound(pendingSkill.effectType, "start", audioSettings),
      Math.max(0, cues.startAt * durationMs)
    ),
    setTimeoutFn(
      () => playSound(pendingSkill.effectType, "impact", audioSettings),
      Math.max(0, cues.impactAt * durationMs)
    )
  ];
}

export function clearBoardSkillEffectSoundTimers(timerIds = [], clearTimeoutFn = globalThis.clearTimeout) {
  for (const timerId of timerIds) {
    clearTimeoutFn(timerId);
  }
}

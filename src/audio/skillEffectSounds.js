import { DEFAULT_AUDIO_SETTINGS, audioVolume } from "./audioSettings.js";
import { browserAudioContextClass } from "./audioRuntime.js";
import { skillEffectSoundCues as catalogSkillEffectSoundCues } from "../shared/skillEffectCatalog.js";

const SKILL_EFFECT_SOUND_TYPES = {
  start: "start",
  impact: "impact"
};

let sharedSkillEffectContext = null;

export function playSkillEffectSound(effectType, cue, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "sfx");
  if (volume <= 0) return;
  const context = getSkillEffectAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume().catch(() => {});
  const now = context.currentTime;
  if (effectType === "erase-point") {
    playMeteorSound(context, cue, volume, now);
    return;
  }
  if (effectType === "flip-stone") {
    playBubbleSound(context, cue, volume, now);
    return;
  }
  if (effectType === "random-blast") {
    playBlastSound(context, cue, volume, now);
    return;
  }
  if (effectType === "hidden-hand") {
    playDataStreamSound(context, cue, volume, now);
    return;
  }
  if (effectType === "row-slash") {
    playSlashSound(context, cue, volume, now);
  }
}

export function skillEffectSoundCues(effectType) {
  return catalogSkillEffectSoundCues(effectType);
}

function getSkillEffectAudioContext() {
  if (sharedSkillEffectContext && sharedSkillEffectContext.state !== "closed") return sharedSkillEffectContext;
  const AudioContextClass = browserAudioContextClass();
  if (!AudioContextClass) return null;
  try {
    sharedSkillEffectContext = new AudioContextClass();
  } catch {
    sharedSkillEffectContext = null;
  }
  return sharedSkillEffectContext;
}

function playMeteorSound(context, cue, volume, now) {
  if (cue === SKILL_EFFECT_SOUND_TYPES.start) {
    scheduleTone(context, { type: "sawtooth", frequency: 740, endFrequency: 210, start: now, length: 0.48, volume: 0.09 * volume });
    scheduleNoise(context, { start: now + 0.04, length: 0.36, volume: 0.08 * volume, highpass: 420 });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleTone(context, { type: "triangle", frequency: 92, endFrequency: 44, start: now, length: 0.46, volume: 0.28 * volume });
    scheduleNoise(context, { start: now, length: 0.28, volume: 0.26 * volume, lowpass: 820 });
  }
}

function playBubbleSound(context, cue, volume, now) {
  if (cue === SKILL_EFFECT_SOUND_TYPES.start) {
    scheduleTone(context, { type: "sine", frequency: 520, endFrequency: 860, start: now, length: 0.28, volume: 0.1 * volume });
    scheduleTone(context, { type: "sine", frequency: 980, endFrequency: 620, start: now + 0.08, length: 0.24, volume: 0.06 * volume });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleTone(context, { type: "sine", frequency: 1180, endFrequency: 420, start: now, length: 0.16, volume: 0.16 * volume });
    scheduleNoise(context, { start: now + 0.02, length: 0.18, volume: 0.14 * volume, highpass: 900 });
  }
}

function playBlastSound(context, cue, volume, now) {
  if (cue === SKILL_EFFECT_SOUND_TYPES.start) {
    scheduleTone(context, { type: "sine", frequency: 260, endFrequency: 120, start: now, length: 0.32, volume: 0.12 * volume });
    scheduleNoise(context, { start: now + 0.04, length: 0.18, volume: 0.06 * volume, highpass: 520 });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleTone(context, { type: "square", frequency: 76, endFrequency: 38, start: now, length: 0.34, volume: 0.2 * volume });
    scheduleNoise(context, { start: now, length: 0.34, volume: 0.24 * volume, lowpass: 680 });
  }
}

function playDataStreamSound(context, cue, volume, now) {
  if (cue === SKILL_EFFECT_SOUND_TYPES.start) {
    scheduleTone(context, { type: "square", frequency: 960, endFrequency: 1320, start: now, length: 0.12, volume: 0.05 * volume });
    scheduleTone(context, { type: "sine", frequency: 520, endFrequency: 780, start: now + 0.06, length: 0.24, volume: 0.08 * volume });
    scheduleNoise(context, { start: now + 0.02, length: 0.2, volume: 0.045 * volume, highpass: 1200 });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleTone(context, { type: "triangle", frequency: 380, endFrequency: 1160, start: now, length: 0.28, volume: 0.1 * volume });
    scheduleNoise(context, { start: now + 0.04, length: 0.16, volume: 0.055 * volume, highpass: 1600 });
  }
}

function playSlashSound(context, cue, volume, now) {
  if (cue === SKILL_EFFECT_SOUND_TYPES.start) {
    scheduleNoise(context, { start: now, length: 0.16, volume: 0.06 * volume, highpass: 1800 });
    scheduleTone(context, { type: "triangle", frequency: 820, endFrequency: 1240, start: now + 0.02, length: 0.18, volume: 0.08 * volume });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleNoise(context, { start: now, length: 0.22, volume: 0.16 * volume, highpass: 950 });
    scheduleTone(context, { type: "sawtooth", frequency: 210, endFrequency: 72, start: now, length: 0.2, volume: 0.12 * volume });
  }
}

function scheduleTone(context, { type, frequency, endFrequency, start, length, volume }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + length);
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, start + length);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + length + 0.04);
}

function scheduleNoise(context, { start, length, volume, lowpass = null, highpass = null }) {
  const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * length)), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }
  const source = context.createBufferSource();
  const gain = context.createGain();
  let output = source;
  source.buffer = buffer;
  if (lowpass || highpass) {
    const filter = context.createBiquadFilter();
    filter.type = lowpass ? "lowpass" : "highpass";
    filter.frequency.setValueAtTime(lowpass ?? highpass, start);
    source.connect(filter);
    output = filter;
  }
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, start + length);
  output.connect(gain);
  gain.connect(context.destination);
  source.start(start);
  source.stop(start + length + 0.03);
}

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
  if (effectType === "protocol-takeover") {
    playProtocolTakeoverSound(context, cue, volume, now);
    return;
  }
  if (effectType === "double-move") {
    playPhoenixFireSound(context, cue, volume, now);
    return;
  }
  if (effectType === "voyage-star") {
    playVoyageStarSound(context, cue, volume, now);
    return;
  }
  if (effectType === "row-slash") {
    playSlashSound(context, cue, volume, now);
  }
}

export function skillEffectSoundCues(effectType) {
  return catalogSkillEffectSoundCues(effectType);
}

export function resetSkillEffectSoundContextForTest() {
  sharedSkillEffectContext?.close?.();
  sharedSkillEffectContext = null;
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
    scheduleTone(context, { type: "sine", frequency: 82, endFrequency: 168, start: now, length: 0.42, volume: 0.14 * volume });
    scheduleTone(context, { type: "square", frequency: 760, endFrequency: 1480, start: now + 0.06, length: 0.34, volume: 0.065 * volume });
    scheduleTone(context, { type: "triangle", frequency: 1520, endFrequency: 2160, start: now + 0.16, length: 0.22, volume: 0.05 * volume });
    scheduleNoise(context, { start: now + 0.04, length: 0.36, volume: 0.07 * volume, highpass: 1400 });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleTone(context, { type: "sawtooth", frequency: 190, endFrequency: 64, start: now, length: 0.2, volume: 0.16 * volume });
    scheduleTone(context, { type: "square", frequency: 1840, endFrequency: 920, start: now + 0.01, length: 0.12, volume: 0.085 * volume });
    scheduleTone(context, { type: "triangle", frequency: 620, endFrequency: 1540, start: now + 0.08, length: 0.24, volume: 0.095 * volume });
    scheduleNoise(context, { start: now, length: 0.18, volume: 0.1 * volume, highpass: 2200 });
    scheduleNoise(context, { start: now + 0.12, length: 0.2, volume: 0.055 * volume, highpass: 1500 });
  }
}

function playProtocolTakeoverSound(context, cue, volume, now) {
  if (cue === SKILL_EFFECT_SOUND_TYPES.start) {
    scheduleTone(context, { type: "sine", frequency: 620, endFrequency: 1540, start: now, length: 0.3, volume: 0.13 * volume });
    scheduleTone(context, { type: "triangle", frequency: 1240, endFrequency: 1860, start: now + 0.05, length: 0.2, volume: 0.08 * volume });
    scheduleNoise(context, { start: now + 0.02, length: 0.26, volume: 0.08 * volume, highpass: 1800 });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleTone(context, { type: "triangle", frequency: 440, endFrequency: 1280, start: now, length: 0.26, volume: 0.16 * volume });
    scheduleTone(context, { type: "square", frequency: 1720, endFrequency: 860, start: now + 0.02, length: 0.09, volume: 0.09 * volume });
    scheduleTone(context, { type: "sine", frequency: 1960, endFrequency: 1480, start: now + 0.11, length: 0.18, volume: 0.08 * volume });
    scheduleNoise(context, { start: now + 0.01, length: 0.2, volume: 0.09 * volume, highpass: 2400 });
  }
}

function playPhoenixFireSound(context, cue, volume, now) {
  if (cue === SKILL_EFFECT_SOUND_TYPES.start) {
    scheduleTone(context, { type: "sawtooth", frequency: 340, endFrequency: 920, start: now, length: 0.34, volume: 0.08 * volume });
    scheduleTone(context, { type: "triangle", frequency: 680, endFrequency: 1380, start: now + 0.08, length: 0.24, volume: 0.06 * volume });
    scheduleNoise(context, { start: now + 0.04, length: 0.32, volume: 0.07 * volume, highpass: 720 });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleTone(context, { type: "sawtooth", frequency: 156, endFrequency: 52, start: now, length: 0.34, volume: 0.18 * volume });
    scheduleNoise(context, { start: now, length: 0.4, volume: 0.2 * volume, lowpass: 900 });
    scheduleNoise(context, { start: now + 0.08, length: 0.18, volume: 0.08 * volume, highpass: 1600 });
  }
}

function playVoyageStarSound(context, cue, volume, now) {
  if (cue === SKILL_EFFECT_SOUND_TYPES.start) {
    scheduleTone(context, { type: "triangle", frequency: 980, endFrequency: 420, start: now, length: 0.36, volume: 0.1 * volume });
    scheduleTone(context, { type: "sine", frequency: 1960, endFrequency: 2460, start: now + 0.08, length: 0.22, volume: 0.06 * volume });
    scheduleNoise(context, { start: now + 0.03, length: 0.3, volume: 0.08 * volume, highpass: 1600 });
    return;
  }
  if (cue === SKILL_EFFECT_SOUND_TYPES.impact) {
    scheduleTone(context, { type: "sawtooth", frequency: 220, endFrequency: 58, start: now, length: 0.34, volume: 0.19 * volume });
    scheduleTone(context, { type: "sine", frequency: 2440, endFrequency: 1220, start: now + 0.02, length: 0.18, volume: 0.08 * volume });
    scheduleNoise(context, { start: now, length: 0.34, volume: 0.2 * volume, highpass: 1100 });
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

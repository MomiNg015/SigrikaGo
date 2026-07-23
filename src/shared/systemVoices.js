import { canonicalCharacterId } from "./characterAliases.js";

export const SYSTEM_VOICE_EVENTS = {
  gameStart: "game-start",
  skillCast: "skill-cast",
  sortie: "sortie",
  byoYomiStart: "byo-yomi-start",
  byoYomiPeriods: "byo-yomi-periods",
  byoYomiPeriod2: "byo-yomi-period-2",
  byoYomiPeriod1: "byo-yomi-period-1",
  byoYomiCountdown: "byo-yomi-countdown",
  houseDetail: "house-detail",
  timeout: "timeout",
  resultVictory: "result-victory",
  resultDefeat: "result-defeat",
  resultDraw: "result-draw",
  countdown: (seconds) => `countdown-${seconds}`
};

export const SYSTEM_VOICE_MODE_EVENTS = {
  gomokuGameStart: `${SYSTEM_VOICE_EVENTS.gameStart}:gomoku`
};

export const SYSTEM_VOICE_SKILL_EVENTS = {
  voyageStarSkillCast: `${SYSTEM_VOICE_EVENTS.skillCast}:voyage-star`
};

export const LYNAE_CONTRARY_VOICE_EFFECT_KEY = "lynaeContraryVoice";

export function voiceSourceCandidates(value) {
  if (Array.isArray(value)) return value.map(normalizeVoiceSource).filter(Boolean);
  return [normalizeVoiceSource(value)].filter(Boolean);
}

export function resolveVoiceSource(value, random = Math.random) {
  const candidates = voiceSourceCandidates(value);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const rawIndex = Math.floor(random() * candidates.length);
  const index = Math.min(candidates.length - 1, Math.max(0, rawIndex));
  return candidates[index] ?? candidates[0];
}

const DEFAULT_SYSTEM_VOICE_TEXT = {
  [SYSTEM_VOICE_EVENTS.gameStart]: "对局开始",
  [SYSTEM_VOICE_EVENTS.sortie]: "出战",
  [SYSTEM_VOICE_EVENTS.byoYomiStart]: "开始读秒",
  [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: "还剩2次读秒",
  [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: "还剩1次读秒",
  [SYSTEM_VOICE_EVENTS.resultVictory]: "对局胜利",
  [SYSTEM_VOICE_EVENTS.resultDefeat]: "对局失败",
  [SYSTEM_VOICE_EVENTS.resultDraw]: "和棋"
};

export function resolveSystemVoice(event, { character = null, params = {} } = {}) {
  if (event === SYSTEM_VOICE_EVENTS.byoYomiCountdown) {
    const text = countdownText(params.seconds);
    if (!text) return { type: "tts", text: "" };
  }
  const countdownMatch = /^(countdown-(1|2|3|4|5|6|7|8|9|10))$/.exec(event);
  if (typeof event === "string" && event.startsWith("countdown-") && !countdownMatch) {
    return { type: "tts", text: "" };
  }
  if (countdownMatch) {
    const text = countdownText(Number(countdownMatch[2]));
    if (!text) return { type: "tts", text: "" };
  }
  if (event === SYSTEM_VOICE_EVENTS.timeout) {
    return { type: "tts", text: "" };
  }
  const resolvedEvent = contraryLynaeVoiceEvent(event, { character, params });
  const modeVoiceEvent = modeSpecificVoiceEvent(resolvedEvent, params.mode);
  const modeCharacterVoice = resolveVoiceSource(character?.systemVoices?.[modeVoiceEvent]);
  if (modeCharacterVoice) return { type: "audio", src: modeCharacterVoice };

  const skillVoiceEvent = skillSpecificVoiceEvent(resolvedEvent, params.effectType);
  const skillCharacterVoice = resolveVoiceSource(character?.systemVoices?.[skillVoiceEvent]);
  if (skillCharacterVoice) return { type: "audio", src: skillCharacterVoice };

  const characterVoice = resolveVoiceSource(character?.systemVoices?.[resolvedEvent]);
  if (characterVoice) return { type: "audio", src: characterVoice };
  if (resolvedEvent === SYSTEM_VOICE_EVENTS.byoYomiPeriods) {
    if (params.periods === 2) {
      return resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriod2, { character, params });
    }
    if (params.periods === 1) {
      return resolveSystemVoice(SYSTEM_VOICE_EVENTS.byoYomiPeriod1, { character, params });
    }
    return { type: "tts", text: `还剩${params.periods}次读秒` };
  }
  if (resolvedEvent === SYSTEM_VOICE_EVENTS.byoYomiCountdown) {
    return { type: "tts", text: countdownText(params.seconds) };
  }
  const resolvedCountdownMatch = /^(countdown-(1|2|3|4|5|6|7|8|9|10))$/.exec(resolvedEvent);
  if (resolvedCountdownMatch) {
    return { type: "tts", text: countdownText(Number(resolvedCountdownMatch[2])) };
  }
  return { type: "tts", text: DEFAULT_SYSTEM_VOICE_TEXT[resolvedEvent] ?? "" };
}

export function contraryLynaeVoiceEvent(event, { character = null, params = {} } = {}) {
  if (
    canonicalCharacterId(character?.id) !== "lynae"
    || character?.itemEffects?.[LYNAE_CONTRARY_VOICE_EFFECT_KEY] !== true
  ) {
    return event;
  }
  const pairedEvent = {
    [SYSTEM_VOICE_EVENTS.gameStart]: SYSTEM_VOICE_EVENTS.byoYomiStart,
    [SYSTEM_VOICE_EVENTS.byoYomiStart]: SYSTEM_VOICE_EVENTS.gameStart,
    [SYSTEM_VOICE_EVENTS.sortie]: SYSTEM_VOICE_EVENTS.skillCast,
    [SYSTEM_VOICE_EVENTS.skillCast]: SYSTEM_VOICE_EVENTS.sortie,
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod2]: SYSTEM_VOICE_EVENTS.byoYomiPeriod1,
    [SYSTEM_VOICE_EVENTS.byoYomiPeriod1]: SYSTEM_VOICE_EVENTS.byoYomiPeriod2,
    [SYSTEM_VOICE_EVENTS.resultVictory]: SYSTEM_VOICE_EVENTS.resultDefeat,
    [SYSTEM_VOICE_EVENTS.resultDefeat]: SYSTEM_VOICE_EVENTS.resultVictory
  }[event];
  if (pairedEvent) return pairedEvent;
  if (event === SYSTEM_VOICE_EVENTS.byoYomiCountdown) {
    return Number.isInteger(params.seconds) && params.seconds >= 1 && params.seconds <= 10
      ? SYSTEM_VOICE_EVENTS.countdown(11 - params.seconds)
      : event;
  }
  const countdownMatch = /^countdown-(1|2|3|4|5|6|7|8|9|10)$/.exec(event);
  return countdownMatch
    ? SYSTEM_VOICE_EVENTS.countdown(11 - Number(countdownMatch[1]))
    : event;
}

function modeSpecificVoiceEvent(event, mode) {
  if (event === SYSTEM_VOICE_EVENTS.gameStart && mode === "gomoku") {
    return SYSTEM_VOICE_MODE_EVENTS.gomokuGameStart;
  }
  return null;
}

function skillSpecificVoiceEvent(event, effectType) {
  if (event === SYSTEM_VOICE_EVENTS.skillCast && effectType === "voyage-star") {
    return SYSTEM_VOICE_SKILL_EVENTS.voyageStarSkillCast;
  }
  return null;
}

function countdownText(seconds) {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10) return "";
  return String(seconds);
}

function normalizeVoiceSource(value) {
  const source = String(value ?? "").trim();
  return source || null;
}

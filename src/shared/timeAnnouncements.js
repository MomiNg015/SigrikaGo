import { SYSTEM_VOICE_EVENTS } from "./systemVoices.js";

export function nextTimeAnnouncement({ previous, current } = {}) {
  if (!previous || !current) return null;
  if (typeof previous.main === "number" && previous.main > 0 && current.main <= 0) {
    return { type: "voice", event: SYSTEM_VOICE_EVENTS.byoYomiStart, text: "开始读秒" };
  }
  if (typeof previous.periods === "number" && current.periods < previous.periods) {
    if (current.periods <= 0) return { type: "voice", event: SYSTEM_VOICE_EVENTS.timeout, text: "超时" };
    const event = current.periods === 2
      ? SYSTEM_VOICE_EVENTS.byoYomiPeriod2
      : current.periods === 1
        ? SYSTEM_VOICE_EVENTS.byoYomiPeriod1
        : SYSTEM_VOICE_EVENTS.byoYomiPeriods;
    return {
      type: "voice",
      event,
      params: { periods: current.periods },
      text: `还剩${current.periods}次读秒`
    };
  }
  return null;
}

export function nextCountdownAnnouncement({ seconds } = {}) {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10) return null;
  return {
    type: "voice",
    event: SYSTEM_VOICE_EVENTS.countdown(seconds),
    params: { seconds },
    text: String(seconds)
  };
}

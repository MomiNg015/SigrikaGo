import { SYSTEM_VOICE_EVENTS } from "./systemVoices.js";

export function nextTimeAnnouncement({ previous, current } = {}) {
  if (!previous || !current) return null;
  if (typeof previous.main === "number" && previous.main > 0 && current.main <= 0) {
    return { type: "voice", event: SYSTEM_VOICE_EVENTS.byoYomiStart, text: "开始读秒" };
  }
  if (typeof previous.periods === "number" && current.periods < previous.periods) {
    if (current.periods <= 0) return { type: "voice", event: SYSTEM_VOICE_EVENTS.timeout, text: "超时" };
    return {
      type: "voice",
      event: SYSTEM_VOICE_EVENTS.byoYomiPeriods,
      params: { periods: current.periods },
      text: `还剩${current.periods}次读秒`
    };
  }
  return null;
}

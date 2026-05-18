import { describe, expect, it } from "vitest";
import { nextTimeAnnouncement } from "./timeAnnouncements.js";
import { SYSTEM_VOICE_EVENTS } from "./systemVoices.js";

describe("time announcements", () => {
  it("announces timeout instead of zero byo-yomi periods", () => {
    expect(nextTimeAnnouncement({
      previous: { main: 0, periods: 1 },
      current: { main: 0, periods: 0, periodRemaining: 30 }
    })).toMatchObject({ type: "voice", event: SYSTEM_VOICE_EVENTS.timeout, text: "超时" });
  });

  it("announces remaining byo-yomi periods before timeout", () => {
    expect(nextTimeAnnouncement({
      previous: { main: 0, periods: 3 },
      current: { main: 0, periods: 2, periodRemaining: 30 }
    })).toMatchObject({
      type: "voice",
      event: SYSTEM_VOICE_EVENTS.byoYomiPeriods,
      params: { periods: 2 },
      text: "还剩2次读秒"
    });
  });
});

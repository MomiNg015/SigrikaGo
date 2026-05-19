import { describe, expect, it } from "vitest";
import { nextCountdownAnnouncement, nextTimeAnnouncement } from "./timeAnnouncements.js";
import { SYSTEM_VOICE_EVENTS } from "./systemVoices.js";

describe("time announcements", () => {
  it("announces timeout instead of zero byo-yomi periods", () => {
    expect(nextTimeAnnouncement({
      previous: { main: 0, periods: 1 },
      current: { main: 0, periods: 0, periodRemaining: 30 }
    })).toMatchObject({ type: "voice", event: SYSTEM_VOICE_EVENTS.timeout, text: "超时" });
  });

  it("announces explicit byo-yomi period 2 event before timeout", () => {
    expect(nextTimeAnnouncement({
      previous: { main: 0, periods: 3 },
      current: { main: 0, periods: 2, periodRemaining: 30 }
    })).toMatchObject({
      type: "voice",
      event: SYSTEM_VOICE_EVENTS.byoYomiPeriod2,
      params: { periods: 2 },
      text: "还剩2次读秒"
    });
  });

  it("announces explicit byo-yomi period 1 event before timeout", () => {
    expect(nextTimeAnnouncement({
      previous: { main: 0, periods: 2 },
      current: { main: 0, periods: 1, periodRemaining: 30 }
    })).toMatchObject({
      type: "voice",
      event: SYSTEM_VOICE_EVENTS.byoYomiPeriod1,
      params: { periods: 1 },
      text: "还剩1次读秒"
    });
  });

  it("announces generic remaining byo-yomi periods for other positive drops", () => {
    expect(nextTimeAnnouncement({
      previous: { main: 0, periods: 5 },
      current: { main: 0, periods: 4, periodRemaining: 30 }
    })).toMatchObject({
      type: "voice",
      event: SYSTEM_VOICE_EVENTS.byoYomiPeriods,
      params: { periods: 4 },
      text: "还剩4次读秒"
    });
  });

  it("builds countdown announcements for valid seconds only", () => {
    expect(nextCountdownAnnouncement({ seconds: 10 })).toEqual({
      type: "voice",
      event: SYSTEM_VOICE_EVENTS.countdown(10),
      params: { seconds: 10 },
      text: "10"
    });
    expect(nextCountdownAnnouncement({ seconds: 0 })).toBeNull();
    expect(nextCountdownAnnouncement({ seconds: 11 })).toBeNull();
    expect(nextCountdownAnnouncement({ seconds: undefined })).toBeNull();
  });
});

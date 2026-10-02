import { describe, expect, it } from "vitest";
import { countdownVoiceOffset } from "./countdownVoiceTiming.js";

function buffer(...channels) {
  return { sampleRate: 1000, length: channels[0].length, numberOfChannels: channels.length, getChannelData: (index) => channels[index] };
}

describe("countdown voice onset", () => {
  it("aligns differing silence lengths while retaining a 10 ms lead-in", () => {
    for (const silence of [0, 20, 35, 83, 150]) {
      expect(countdownVoiceOffset(buffer([...Array(silence).fill(0), 0.1, 0.2])))
        .toBeCloseTo(Math.max(0, silence / 1000 - 0.01));
    }
  });

  it("preserves quiet consonants ahead of a louder vowel and checks both channels", () => {
    const left = [...Array(80).fill(0), 0.8];
    const right = [...Array(30).fill(0), ...Array(50).fill(-0.012), 0.8];
    expect(countdownVoiceOffset(buffer(left, right))).toBeCloseTo(0.02);
  });

  it("leaves completely silent clips at offset zero", () => {
    expect(countdownVoiceOffset(buffer(Array(100).fill(0)))).toBe(0);
  });
});

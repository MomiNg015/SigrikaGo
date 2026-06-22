import fs from "node:fs";
import { describe, expect, test } from "vitest";

const criticalRuntimeFiles = [
  "server/index.js",
  "server/roomClockLifecycle.js",
  "server/roomGameActions.js",
  "server/socketDuelEvents.js",
  "server/socketGuards.js",
  "server/socketMatchEvents.js",
  "server/socketRoomEvents.js",
  "src/app/socketHandlers.js",
  "src/app/resumeSession.js"
];

const mojibakePattern = /[�閹閻闁濠閸鐠娴鎴鐧瓒榛鏈缍妫]|\?{4,}/;

describe("critical user-facing text", () => {
  test("does not contain common UTF-8 mojibake fragments in auth and socket paths", () => {
    const offenders = [];

    for (const file of criticalRuntimeFiles) {
      const text = fs.readFileSync(file, "utf8");
      const match = text.match(mojibakePattern);
      if (match) offenders.push(`${file}: ${match[0]}`);
    }

    expect(offenders).toEqual([]);
  });
});

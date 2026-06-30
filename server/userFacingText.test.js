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

const mojibakePattern = /[\ufffd\u95b9\u95bb\u95c1\u6fe0\u95b8\u9420\u5a34\u93b4\u9427\u74d2\u699b\u93c8\u7f0d\u59ab]|\?{4,}/;

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

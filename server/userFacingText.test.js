import fs from "node:fs";
import { describe, expect, test } from "vitest";

const criticalRuntimeFiles = [
  "server/index.js",
  "src/app/socketHandlers.js",
  "src/app/resumeSession.js"
];

const mojibakeFragments = [
  "鐧",
  "鎴块",
  "閻",
  "婢惰鲸",
  "鍙嶉",
  "璐﹀",
  "浣跨敤"
];

describe("critical user-facing text", () => {
  test("does not contain common UTF-8 mojibake fragments in auth and socket paths", () => {
    const offenders = [];

    for (const file of criticalRuntimeFiles) {
      const text = fs.readFileSync(file, "utf8");
      for (const fragment of mojibakeFragments) {
        if (text.includes(fragment)) offenders.push(`${file}: ${fragment}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

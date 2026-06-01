import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("personal replay route", () => {
  it("does not limit records used by the player manual stats to the latest 30 games", () => {
    const source = readFileSync(new URL("./index.js", import.meta.url), "utf8");
    const routeBlock = source.match(/app\.get\("\/api\/replays"[\s\S]+?app\.get\("\/api\/replays\/:id"/)?.[0] ?? "";

    expect(routeBlock).toContain('app.get("/api/replays"');
    expect(routeBlock).not.toContain("take: 30");
  });

  it("returns player ids so manual stats do not depend on stored display names", () => {
    const source = readFileSync(new URL("./index.js", import.meta.url), "utf8");
    const routeBlock = source.match(/app\.get\("\/api\/replays"[\s\S]+?app\.get\("\/api\/replays\/:id"/)?.[0] ?? "";

    expect(routeBlock).toContain("blackUserId: record.blackUserId");
    expect(routeBlock).toContain("whiteUserId: record.whiteUserId");
  });
});

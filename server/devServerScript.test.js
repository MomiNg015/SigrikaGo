import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("dev server script", () => {
  it("watches source paths without watching the SQLite database", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8"));

    expect(pkg.scripts["dev:server"]).toContain("--watch-path=server");
    expect(pkg.scripts["dev:server"]).toContain("--watch-path=src/shared");
    expect(pkg.scripts["dev:server"]).not.toBe("node --watch server/index.js");
  });
});

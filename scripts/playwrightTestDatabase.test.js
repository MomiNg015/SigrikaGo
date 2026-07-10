import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(() => ({ status: 0, stdout: "", stderr: "" }))
}));

import { preparePlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";

describe("Playwright test database", () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it("uses a unique temporary database instead of prisma/dev.db", async () => {
    const prepared = await preparePlaywrightTestDatabase({ label: "test", port: "4999", runId: "unit-run" });
    expect(prepared.databasePath).toContain(`${".tmp"}`);
    expect(prepared.databasePath).toContain("test-4999-unit-run.db");
    expect(prepared.databasePath.replaceAll("\\", "/")).not.toContain("prisma/dev.db");
    expect(process.env.DATABASE_URL).toBe(prepared.databaseUrl);
    fs.writeFileSync(prepared.databasePath, "temporary");
    prepared.cleanup();
    expect(fs.existsSync(prepared.databasePath)).toBe(false);
  });
});

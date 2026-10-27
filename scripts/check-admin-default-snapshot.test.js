import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { mismatchedAdminDefaultDomains } from "./check-admin-default-snapshot.mjs";

it("retains the authored-content comparison for deployment", () => {
  expect(mismatchedAdminDefaultDomains({ siteSettings: [{ key: "announcement", value: "draft" }] },
    { siteSettings: [{ key: "announcement", value: "published" }] })).toEqual(["siteSettings"]);
});

it("round-trips the committed snapshot without opening or changing the configured authoring database", async () => {
  const directory = await mkdtemp(join(tmpdir(), "snapshot-check-sentinel-"));
  const sentinel = join(directory, "authoring.db");
  const content = "Do not open the author's database for CI checks";
  await writeFile(sentinel, content);
  try {
    const { stdout } = await promisify(execFile)(process.execPath,
      ["scripts/check-admin-default-snapshot.mjs", "--isolated"], {
        env: { ...process.env, DATABASE_URL: `file:${sentinel.replaceAll("\\", "/")}` },
        timeout: 20_000
      });
    expect(stdout).toContain("round-trip passed in disposable SQLite");
    expect(await readFile(sentinel, "utf8")).toBe(content);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 25_000);

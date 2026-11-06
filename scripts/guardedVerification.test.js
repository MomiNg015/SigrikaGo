import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

test.each([0, 7])("guard wrapper preserves complete output and true child status %i", (exitCode) => {
  const root = path.resolve(".tmp");
  fs.mkdirSync(root, { recursive: true });
  const directory = fs.mkdtempSync(path.join(root, "guard-report-"));
  try {
    const output = "x".repeat(150_000) + "complete\n";
    const result = spawnSync(process.execPath, ["scripts/run-guarded-check.mjs", "report-test", "-e",
      `process.stdout.write('x'.repeat(150000) + 'complete\\n', () => { process.exitCode = ${exitCode}; });`], {
      env: { ...process.env, CAPACITY_WINDOWS_LIMITS: "0", VERIFICATION_REPORT_DIR: directory },
      encoding: "utf8", windowsHide: true, timeout: 10_000
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(exitCode === 0 ? 0 : 1);
    const reportPath = fs.readdirSync(directory).find(name => name.endsWith(".json"));
    const report = JSON.parse(fs.readFileSync(path.join(directory, reportPath), "utf8"));
    expect(report.status).toBe(exitCode === 0 ? "passed" : "failed");
    expect(report.exitCode).toBe(exitCode);
    expect(report.completedAt).toBeTruthy();
    expect(fs.readFileSync(report.logPath, "utf8")).toBe(output);
  } finally {
    if (directory.startsWith(root + path.sep)) fs.rmSync(directory, { recursive: true, force: true });
  }
});

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = path.join(process.cwd(), "scripts", "check-production-config.mjs");

describe("production config check script", () => {
  it("loads the production values from the current working directory .env", () => {
    const workingDirectory = mkdtempSync(path.join(tmpdir(), "sigrikago-production-config-"));
    const env = { ...process.env, NODE_ENV: "production" };
    for (const key of [
      "JWT_SECRET",
      "PUBLIC_ORIGIN",
      "SITE_ORIGIN",
      "ALLOWED_ORIGINS",
      "ENABLE_TEST_ACTIONS",
      "WEB_CONCURRENCY",
      "PM2_INSTANCES",
      "NODE_APP_INSTANCE"
    ]) {
      delete env[key];
    }

    try {
      writeFileSync(
        path.join(workingDirectory, ".env"),
        "JWT_SECRET=0123456789abcdef0123456789abcdef\nPUBLIC_ORIGIN=https://sigrikago.com\n",
        "utf8"
      );

      const output = execFileSync(process.execPath, [scriptPath], {
        cwd: workingDirectory,
        env,
        encoding: "utf8"
      });

      expect(output).toContain("Production deployment configuration OK");
    } finally {
      rmSync(workingDirectory, { recursive: true, force: true });
    }
  });

  it("prints ok for valid production deployment config", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
        JWT_SECRET: "0123456789abcdef0123456789abcdef",
        PUBLIC_ORIGIN: "https://sigrika.fun"
      },
      encoding: "utf8"
    });

    expect(output).toContain("Production deployment configuration OK");
  });

  it("exits non-zero and prints errors for invalid production deployment config", () => {
    let error;
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "production",
          JWT_SECRET: "dev-secret",
          PUBLIC_ORIGIN: ""
        },
        encoding: "utf8",
        stdio: "pipe"
      });
    } catch (caught) {
      error = caught;
    }

    expect(error?.status).toBe(1);
    expect(String(error?.stderr)).toContain("Invalid production deployment configuration");
    expect(String(error?.stderr)).toContain("JWT_SECRET must be at least 32 characters in production");
  });

  it("checks production rules even when NODE_ENV is omitted", () => {
    let error;
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "",
          JWT_SECRET: "dev-secret",
          PUBLIC_ORIGIN: ""
        },
        encoding: "utf8",
        stdio: "pipe"
      });
    } catch (caught) {
      error = caught;
    }

    expect(error?.status).toBe(1);
    expect(String(error?.stderr)).toContain("JWT_SECRET must be at least 32 characters in production");
  });

  it("rejects enabled test actions in production checks", () => {
    let error;
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "production",
          JWT_SECRET: "0123456789abcdef0123456789abcdef",
          PUBLIC_ORIGIN: "https://sigrika.fun",
          ENABLE_TEST_ACTIONS: "true"
        },
        encoding: "utf8",
        stdio: "pipe"
      });
    } catch (caught) {
      error = caught;
    }

    expect(error?.status).toBe(1);
    expect(String(error?.stderr)).toContain("ENABLE_TEST_ACTIONS must not be enabled in production");
  });

  it("rejects explicit multi-instance production checks", () => {
    let error;
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "production",
          JWT_SECRET: "0123456789abcdef0123456789abcdef",
          PUBLIC_ORIGIN: "https://sigrika.fun",
          WEB_CONCURRENCY: "2"
        },
        encoding: "utf8",
        stdio: "pipe"
      });
    } catch (caught) {
      error = caught;
    }

    expect(error?.status).toBe(1);
    expect(String(error?.stderr)).toContain("Production must run a single Node instance");
  });
});

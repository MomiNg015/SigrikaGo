import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = path.join(process.cwd(), "scripts", "check-production-config.mjs");

describe("production config check script", () => {
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
});

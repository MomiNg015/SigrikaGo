import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("local stability verification command", () => {
  it("exposes scripts for the full local production-like stability gate", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8"));

    expect(pkg.scripts["verify:stability"]).toBe("node scripts/verify-stability.mjs");
    expect(pkg.scripts["test:stability"]).toBe("node scripts/run-playwright-suite.mjs stability");
    expect(pkg.scripts.test).toContain('--exclude "tests/stability/**"');
  });

  it("starts the built app with local production static assets but without production guards", async () => {
    const source = await readFile("scripts/start-stability-server.mjs", "utf8");

    expect(source).toContain('process.env.NODE_ENV = "stability"');
    expect(source).toContain('process.env.LOCAL_PROD_STATIC = "1"');
    expect(source).toContain("process.env.STABILITY_PORT");
    expect(source).toContain("process.env.STABILITY_PORT ?? process.env.PORT");
    expect(source).toContain('process.env.ENABLE_TEST_ACTIONS = "true"');
    expect(source).toContain('await import("../server/index.js")');
  });

  it("builds before running the stability Playwright project", async () => {
    const source = await readFile("scripts/verify-stability.mjs", "utf8");

    expect(source).toContain('run("npm", ["run", "build"])');
    expect(source).toContain('"scripts/run-playwright-suite.mjs"');
    expect(source).toContain('"stability"');
    expect(source).toContain('"cmd.exe"');
    expect(source).toContain("commandLineForWindows");
    expect(source).toContain("command === process.execPath");
    expect(source).toContain('args.includes("--skip-build")');
  });

  it("uses a dedicated Playwright config against the built Node server", async () => {
    const source = await readFile("playwright.stability.config.js", "utf8");

    expect(source).toContain('testDir: "./tests/stability"');
    expect(source).toContain('process.env.STABILITY_PORT ?? process.env.PORT ?? "4173"');
    expect(source).toContain("baseURL: stabilityBaseURL");
    expect(source).toContain('command: "node scripts/start-stability-server.mjs"');
    expect(source).not.toContain("npm run dev");
  });
});

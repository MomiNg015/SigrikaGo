import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { stabilityServerEnvironment } from "./start-stability-server.mjs";

describe("local stability verification command", () => {
  it("exposes scripts for the full local production-like stability gate", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8"));

    expect(pkg.scripts["verify:stability"]).toBe("node scripts/verify-stability.mjs");
    expect(pkg.scripts["test:stability"]).toBe("node scripts/run-playwright-suite.mjs stability");
    expect(pkg.scripts.test).toContain('--exclude "tests/stability/**"');
  });

  it("starts the built app with local production static assets but without production guards", async () => {
    const source = await readFile("scripts/start-stability-server.mjs", "utf8");

    const env = stabilityServerEnvironment({ PORT: "3001", DATABASE_URL: "file:dev.db", PUBLIC_ORIGIN: "http://localhost:5173", UPLOAD_DIR: "uploads", ZHIZI_ENABLED: "true" });
    expect(env).toMatchObject({ NODE_ENV: "stability", LOCAL_PROD_STATIC: "1", PORT: "4173", DATABASE_URL: "", ENABLE_TEST_ACTIONS: "true", ZHIZI_ENABLED: "false", PUBLIC_ORIGIN: "http://127.0.0.1:4173" });
    expect(env.UPLOAD_DIR).toContain("stability-uploads-4173-");
    expect(stabilityServerEnvironment({ PORT: "3001", STABILITY_PORT: "4189" }).PORT).toBe("4189");
    expect(source).toContain('await assertTestPortAvailable(process.env.PORT)');
    expect(source).toContain('await preparePlaywrightTestDatabase');
    expect(source).not.toContain('if (!process.env.DATABASE_URL)');
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
    expect(source).toContain('process.env.STABILITY_PORT ?? "4173"');
    expect(source).not.toContain('process.env.STABILITY_PORT ?? process.env.PORT');
    expect(source).toContain("baseURL: stabilityBaseURL");
    expect(source).toContain('command: "node scripts/start-stability-server.mjs"');
    expect(source).toContain("viewport: { width: 1440, height: 768 }");
    expect(source).not.toContain("npm run dev");
  });
});

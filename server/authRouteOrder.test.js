import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("server auth route ordering", () => {
  it("mounts /api/auth before broad authenticated /api routers", () => {
    const source = readFileSync(new URL("./index.js", import.meta.url), "utf8");
    const authMount = source.indexOf('app.use("/api/auth", createAuthRouter');
    const broadAuthenticatedMount = source.indexOf('app.use("/api", authHttp,');

    expect(authMount).toBeGreaterThanOrEqual(0);
    expect(broadAuthenticatedMount).toBeGreaterThanOrEqual(0);
    expect(authMount).toBeLessThan(broadAuthenticatedMount);
  });
});

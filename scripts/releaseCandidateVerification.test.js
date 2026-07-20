import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { releaseCandidateStages } from "./releaseCandidateVerification.mjs";

describe("release candidate verification", () => {
  it("runs the local phase 3 gates once in fail-fast deployment order", () => {
    const stages = releaseCandidateStages({ EXISTING: "kept" });
    expect(stages.map((stage) => stage.name)).toEqual([
      "prisma-client",
      "migrations",
      "production-config",
      "build",
      "stability",
      "backup-restore",
      "capacity-smoke"
    ]);
    expect(stages.find((stage) => stage.name === "stability")?.args).toContain("--skip-build");
    expect(stages.find((stage) => stage.name === "capacity-smoke")?.args).toEqual(
      expect.arrayContaining(["--profile", "smoke", "--skip-build"])
    );
    expect(stages.find((stage) => stage.name === "production-config")?.env).toMatchObject({
      EXISTING: "kept",
      NODE_ENV: "production",
      PUBLIC_ORIGIN: "https://sigrika.example",
      ENABLE_TEST_ACTIONS: ""
    });
  });

  it("exposes one npm command and generates Prisma Client after dependency installation", () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    expect(pkg.scripts["verify:release-candidate"]).toBe("node scripts/verify-release-candidate.mjs");
    expect(pkg.scripts.postinstall).toBe("prisma generate");
  });
});

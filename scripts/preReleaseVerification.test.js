import { expect, test } from "vitest";
import { selectPreReleaseStages } from "./preReleaseVerification.mjs";

test("pre-release checks build before browser/static checks and retain isolated recovery gates", () => {
  const stages = selectPreReleaseStages();
  expect(stages.map(stage => stage.id)).toEqual(["quality", "dependencies", "migrations", "backup", "browser", "stability", "practice", "capacity-smoke"]);
  expect(stages.find(stage => stage.id === "browser").args).toEqual(["run", "test:e2e:all", "--", "--skip-build"]);
  expect(stages.find(stage => stage.id === "capacity-smoke").args).not.toContain("--skip-restart");
});
test("targeted reruns are explicit and reject typos instead of silently omitting checks", () => {
  expect(selectPreReleaseStages(["backup", "stability"]).map(stage => stage.id)).toEqual(["backup", "stability"]);
  expect(() => selectPreReleaseStages(["backpu"])).toThrow("Unknown");
  expect(() => selectPreReleaseStages(["backup", "backup"])).toThrow("Duplicate");
});

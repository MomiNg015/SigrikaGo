export const PRE_RELEASE_STAGES = Object.freeze([
  { id: "quality", args: ["run", "check"], purpose: "Lint, unit/integration tests, committed assets, isolated defaults, build and docs" },
  { id: "dependencies", args: ["audit", "--omit=dev", "--audit-level=moderate", "--json"], purpose: "Read-only runtime dependency advisory audit" },
  { id: "migrations", args: ["run", "verify:migrations"], purpose: "Fresh database and legacy migration verification" },
  { id: "backup", args: ["run", "verify:backup-restore"], purpose: "Real isolated SQLite backup, restore, integrity and sentinel read" },
  { id: "browser", args: ["run", "test:e2e:all", "--", "--skip-build"], purpose: "Serial full-system and dedicated browser suites" },
  { id: "stability", args: ["run", "verify:stability", "--", "--skip-build"], purpose: "Desktop/portrait recovery, real effects and production static delivery" },
  { id: "practice", args: ["run", "verify:practice-wasm"], purpose: "WASM hashes, legal moves and native parity when available" },
  { id: "capacity-smoke", args: ["run", "verify:capacity", "--", "--profile", "smoke", "--skip-build"], purpose: "Small topology with loaded-service restart" }
]);

export function selectPreReleaseStages(ids = []) {
  if (!ids.length) return PRE_RELEASE_STAGES;
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate pre-release stage");
  return ids.map(id => {
    const stage = PRE_RELEASE_STAGES.find(candidate => candidate.id === id);
    if (!stage) throw new Error(`Unknown pre-release stage: ${id}`);
    return stage;
  });
}

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vitest";

const bash = process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";
const update = fs.readFileSync("deploy/update-production.sh", "utf8");
const recoveryFunctions = update.slice(update.indexOf("log() {"), update.indexOf("trap on_exit EXIT"));

test.each([0, 1])("failed deployment restarts only before database migration (touched=%s)", (touched) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sigrikago-recovery-"));
  const scenario = `set -Eeuo pipefail
PROJECT_DIR="$1/project"
BUILD_ROOT="$1/release"
NEW_RELEASE="$BUILD_ROOT/release"
PREVIOUS_RELEASE="$BUILD_ROOT/previous-release"
PREVIOUS_DIST="$BUILD_ROOT/previous-dist"
RELEASE_DROPIN="$1/dropin/90-release.conf"
BACKUP_DIR="$1/backups"
STOPPED_DATABASE_BACKUP="$BACKUP_DIR/pre-migration.db"
SERVICE_NAME=sigrikago
SERVICE_STOPPED=1
DATABASE_TOUCHED=${touched}
DIST_SWAPPED=1
RELEASE_SWITCHED=1
NGINX_CHANGED=0
mkdir -p "$PROJECT_DIR/dist" "$PREVIOUS_DIST" "$PREVIOUS_RELEASE/server"
printf new > "$PROJECT_DIR/dist/index.html"
printf old > "$PREVIOUS_DIST/index.html"
systemctl() { printf '%s\\n' "$*" >> "$1_LOG"; }
${recoveryFunctions}
trap on_exit EXIT
false
`.replaceAll('"$1_LOG"', '"$AUDIT_LOG"');
  try {
    let failure;
    try {
      execFileSync(bash, ["-c", scenario, "recovery-test", directory.replaceAll("\\", "/")], {
        env: { ...process.env, AUDIT_LOG: path.join(directory, "actions.log").replaceAll("\\", "/") },
        encoding: "utf8", stdio: "pipe"
      });
    } catch (error) { failure = error; }
    expect(failure?.status).toBe(1);
    const actions = fs.readFileSync(path.join(directory, "actions.log"), "utf8");
    expect(actions.includes("start sigrikago")).toBe(touched === 0);
    expect(actions.includes("stop sigrikago")).toBe(touched === 1);
    expect(fs.readFileSync(path.join(directory, "project/dist/index.html"), "utf8")).toBe("old");
    expect(fs.readFileSync(path.join(directory, "dropin/90-release.conf"), "utf8")).toContain("previous-release/server/index.js");
    if (touched) expect(String(failure.stderr)).toContain("restore-production.sh");
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("failed recovery explicitly stops a partially started service and preserves the failure status", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sigrikago-restore-trap-"));
  const restore = fs.readFileSync("deploy/restore-production.sh", "utf8");
  const failureHandler = restore.slice(restore.indexOf("on_restore_failure() {"), restore.indexOf("trap on_restore_failure ERR"));
  const scenario = `set -Eeuo pipefail
SERVICE_NAME=sigrikago
systemctl() { printf '%s\\n' "$*" >> "$AUDIT_LOG"; if [[ "$1" == start ]]; then return 42; fi; }
${failureHandler}
trap on_restore_failure ERR
systemctl start "$SERVICE_NAME"
`;
  try {
    let failure;
    try {
      execFileSync(bash, ["-c", scenario], {
        env: { ...process.env, AUDIT_LOG: path.join(directory, "actions.log").replaceAll("\\", "/") },
        encoding: "utf8", stdio: "pipe"
      });
    } catch (error) { failure = error; }
    expect(failure?.status).toBe(42);
    expect(fs.readFileSync(path.join(directory, "actions.log"), "utf8").trim().split("\n"))
      .toEqual(["start sigrikago", "stop sigrikago"]);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

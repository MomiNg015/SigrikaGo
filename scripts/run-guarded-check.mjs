import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { applyCapacityWindowsLimits } from "./capacityWindowsLimits.mjs";

// Run one local check under the same opt-in Windows resource guard as capacity.
// Usage: node scripts/run-guarded-check.mjs <label> <node-script> [args...]
const [label, script, ...args] = process.argv.slice(2);
if (!label || !script || !/^[a-z0-9_-]+$/i.test(label)) throw new Error("Expected a safe label and Node script path");
const root = path.resolve(process.env.VERIFICATION_REPORT_DIR ?? ".tmp/pre-release");
fs.mkdirSync(root, { recursive: true });
const run = `${label}-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
const logPath = path.join(root, `${run}.log`);
const statePath = path.join(root, `${run}.json`);
const state = { label, command: [process.execPath, script, ...args], startedAt: new Date().toISOString(),
  status: "running", logPath };
const save = () => fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
save();
process.env.VERIFICATION_GUARD_STATE = statePath;
const log = fs.createWriteStream(logPath);
const append = (chunk) => { log.write(chunk); process.stdout.write(chunk); };
try {
  await applyCapacityWindowsLimits("server");
  const child = spawn(process.execPath, [script, ...args], { windowsHide: true,
    env: { ...process.env, CAPACITY_WINDOWS_LIMITS: "0" }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("close", resolve); });
  Object.assign(state, { status: code === 0 ? "passed" : "failed", exitCode: code, completedAt: new Date().toISOString() });
  process.exitCode = code === 0 ? 0 : 1;
} catch (error) {
  Object.assign(state, { status: "failed", error: error.message, completedAt: new Date().toISOString() });
  process.exitCode = 1;
} finally { save(); log.end(); }

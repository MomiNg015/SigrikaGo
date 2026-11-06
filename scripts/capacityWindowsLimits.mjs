import { spawn } from "node:child_process";
import path from "node:path";

// Opt-in local reference testing only; production startup does not import this module.
export async function applyCapacityWindowsLimits(role) {
  if (process.env.CAPACITY_WINDOWS_LIMITS !== "1") return;
  if (process.platform !== "win32") throw new Error("CAPACITY_WINDOWS_LIMITS requires Windows");
  const helper = spawn("py", ["-3", path.resolve("scripts/capacity-windows-job.py"), String(process.pid), role], {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });
  await new Promise((resolve, reject) => {
    let output = "";
    let errors = "";
    const timer = setTimeout(() => { helper.kill(); reject(new Error("Capacity resource limiter timed out")); }, 10_000);
    helper.stderr.on("data", (chunk) => { errors += chunk; });
    helper.once("error", (error) => { clearTimeout(timer); reject(error); });
    helper.once("exit", (code) => {
      clearTimeout(timer);
      if (!output.includes('"ready": true')) reject(new Error(`Capacity resource limiter failed (${code}): ${errors}`));
    });
    helper.stdout.on("data", (chunk) => {
      output += chunk;
      if (!output.includes("\n")) return;
      clearTimeout(timer);
      console.log(`[capacity-limits] ${output.trim()}`);
      resolve();
      helper.stdout.destroy();
      helper.stderr.destroy();
      helper.unref();
    });
  });
}

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { selectPreReleaseStages } from "./preReleaseVerification.mjs";

const args = process.argv.slice(2);
const stages = selectPreReleaseStages(args.filter(arg => arg !== "--list"));
if (args.includes("--list")) {
  console.log(JSON.stringify(stages, null, 2));
} else {
  const npmCli = process.env.npm_execpath;
  if (!npmCli || !fs.existsSync(npmCli)) throw new Error("Run through npm run verify:pre-release -- [stage ...]");
  const root = path.resolve(process.env.VERIFICATION_REPORT_DIR ?? path.join(".tmp", "pre-release", new Date().toISOString().replaceAll(/[:.]/g, "-")));
  fs.mkdirSync(root, { recursive: true });
  const git = (...gitArgs) => spawnSync("git", gitArgs, { encoding: "utf8" }).stdout?.trim();
  const report = { startedAt: new Date().toISOString(), head: git("rev-parse", "HEAD"),
    initialStatus: git("status", "--short"), platform: process.platform, node: process.version,
    scope: "Local pre-release checks only; target-cloud capacity, public bandwidth, real devices and production rollout remain separate.", stages: [] };
  const reportPath = path.join(root, `suite-${Date.now()}.json`);
  const save = () => fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  save();
  for (const stage of stages) {
    const result = { ...stage, startedAt: new Date().toISOString(), status: "running" };
    report.stages.push(result);
    save();
    console.log(`[pre-release] ${stage.id}: ${stage.purpose}`);
    const child = spawn(process.execPath, ["scripts/run-guarded-check.mjs", stage.id, npmCli, ...stage.args], {
      env: { ...process.env, VERIFICATION_REPORT_DIR: root }, stdio: "inherit", windowsHide: true
    });
    const code = await new Promise((resolve) => {
      child.once("error", error => { result.error = error.message; resolve(1); });
      child.once("exit", resolve);
    });
    Object.assign(result, { exitCode: code, status: code === 0 ? "passed" : code === 75 ? "resource-aborted" : "failed", completedAt: new Date().toISOString() });
    save();
    if (code !== 0) { process.exitCode = 1; break; }
  }
  report.completedAt = new Date().toISOString();
  report.passed = report.stages.length === stages.length && report.stages.every(stage => stage.status === "passed");
  save();
  console.log(`[pre-release] report: ${reportPath}`);
}

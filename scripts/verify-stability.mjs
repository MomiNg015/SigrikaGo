import { spawnSync } from "node:child_process";
import process from "node:process";

const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const extraPlaywrightArgs = args.filter((argument) => argument !== "--skip-build");

if (!skipBuild) run("npm", ["run", "build"]);
run(process.execPath, [
  "scripts/run-playwright-suite.mjs",
  "stability",
  "--reporter=list",
  ...extraPlaywrightArgs
]);

function run(command, args) {
  const invocation = command === process.execPath
    ? [command, args]
    : spawnArgs(command, args);
  const result = spawnSync(...invocation, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function spawnArgs(command, args) {
  if (process.platform !== "win32") return [command, args];
  return ["cmd.exe", ["/d", "/s", "/c", commandLineForWindows(command, args)]];
}

function commandLineForWindows(command, args) {
  return [command, ...args].map(quoteCmdArgument).join(" ");
}

function quoteCmdArgument(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `"${text.replace(/(["^&|<>%])/g, "^$1")}"`;
}

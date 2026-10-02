import { spawnSync } from "node:child_process";

export function releaseCandidateStages(env = process.env) {
  const productionCheckEnv = {
    ...env,
    NODE_ENV: "production",
    JWT_SECRET: "release-candidate-local-secret-0123456789",
    PUBLIC_ORIGIN: "https://sigrika.example",
    ENABLE_TEST_ACTIONS: ""
  };
  return [
    { name: "prisma-client", command: "npm", args: ["run", "prisma:generate"] },
    { name: "migrations", command: "npm", args: ["run", "verify:migrations"] },
    {
      name: "production-config",
      command: process.execPath,
      args: ["scripts/check-production-config.mjs"],
      env: productionCheckEnv
    },
    { name: "build", command: "npm", args: ["run", "build"] },
    {
      name: "stability",
      command: process.execPath,
      args: ["scripts/verify-stability.mjs", "--skip-build"]
    },
    { name: "backup-restore", command: "npm", args: ["run", "verify:backup-restore"] },
    {
      name: "capacity-smoke",
      command: process.execPath,
      args: ["scripts/verify-capacity.mjs", "--profile", "smoke", "--skip-build"]
    }
  ];
}

export function runReleaseCandidateVerification({ env = process.env } = {}) {
  for (const stage of releaseCandidateStages(env)) {
    console.log(`[release-candidate] ${stage.name}`);
    const invocation = stage.command === process.execPath
      ? [stage.command, stage.args]
      : spawnArgs(stage.command, stage.args);
    const result = spawnSync(...invocation, {
      cwd: process.cwd(),
      env: stage.env ?? env,
      stdio: "inherit"
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Release candidate stage failed: ${stage.name} (status ${result.status ?? "unknown"})`);
    }
  }
  console.log("[release-candidate] all local gates passed");
}

function spawnArgs(command, args) {
  if (process.platform !== "win32") return [command, args];
  return ["cmd.exe", ["/d", "/s", "/c", [command, ...args].map(quoteCmdArgument).join(" ")]];
}

function quoteCmdArgument(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `"${text.replace(/(["^&|<>%])/g, "^$1")}"`;
}

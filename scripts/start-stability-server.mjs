import path from "node:path";
import { pathToFileURL } from "node:url";
import { preparePlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";
import { assertTestPortAvailable } from "./stop-test-processes.mjs";

export function stabilityServerEnvironment(env = process.env) {
  const port = env.STABILITY_PORT ?? "4173";
  const run = String(env.PLAYWRIGHT_RUN_ID ?? process.pid).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
  return { ...env, NODE_ENV: "stability", LOCAL_PROD_STATIC: "1", PORT: port,
    DATABASE_URL: "", JWT_SECRET: "stability-local-secret-0123456789",
    PUBLIC_ORIGIN: `http://127.0.0.1:${port}`, ENABLE_TEST_ACTIONS: "true", ZHIZI_ENABLED: "false",
    UPLOAD_DIR: path.resolve(".tmp/playwright", `stability-uploads-${port}-${run}`) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  Object.assign(process.env, stabilityServerEnvironment());
  await assertTestPortAvailable(process.env.PORT);
  const { cleanup } = await preparePlaywrightTestDatabase({ label: "stability", port: process.env.PORT, manageSignals: false });
  process.once("exit", cleanup);
  await import("../server/index.js");
}

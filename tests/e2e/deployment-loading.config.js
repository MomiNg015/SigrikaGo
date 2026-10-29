import base from "./interface-polish.config.js";
export default { ...base, testMatch: "deployment-loading.spec.js", timeout: 60000,
  outputDir: "../../.codex-run/deployment-loading-browser" };

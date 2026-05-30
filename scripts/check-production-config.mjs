import { validateProductionDeployment } from "../server/security.js";

const env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || "production"
};
const result = validateProductionDeployment(env);

if (!result.ok) {
  console.error(`Invalid production deployment configuration:\n${result.errors.join("\n")}`);
  process.exit(1);
}

console.log("Production deployment configuration OK");

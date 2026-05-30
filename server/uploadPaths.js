import path from "node:path";

export function resolveUploadRoot({
  env = process.env,
  projectRoot = process.cwd()
} = {}) {
  const configured = String(env.UPLOAD_DIR ?? "").trim();
  if (!configured) return path.join(projectRoot, "public", "uploads");
  return path.isAbsolute(configured) ? configured : path.resolve(projectRoot, configured);
}

export function resolveCharacterUploadDir(options = {}) {
  return path.join(resolveUploadRoot(options), "characters");
}

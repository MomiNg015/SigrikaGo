import express from "express";
import fs from "node:fs";
import path from "node:path";

const SPA_FALLBACK_ROUTE = /^(?!\/api|\/socket\.io|\/uploads).*/;
const HASHED_ASSET_PATTERN = /-[A-Za-z0-9_-]{8,}\.(?:css|js)$/i;
const RUNTIME_ASSET_PATTERN = /[\\/]assets[\\/]/;
const TRUTHY_ENV_PATTERN = /^(1|true|yes|on)$/i;

export const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const RUNTIME_ASSET_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
export const HTML_CACHE_CONTROL = "no-cache";

export function installProductionStaticAssets(app, {
  distDir,
  env = process.env,
  existsSync = fs.existsSync,
  joinPath = path.join,
  staticMiddleware = express.static
} = {}) {
  if (!shouldServeBuiltStaticAssets(env) || !existsSync(distDir)) return false;

  app.use(staticMiddleware(distDir, {
    index: false,
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (HASHED_ASSET_PATTERN.test(filePath)) {
        res.setHeader("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
      } else if (RUNTIME_ASSET_PATTERN.test(filePath)) {
        res.setHeader("Cache-Control", RUNTIME_ASSET_CACHE_CONTROL);
      }
    }
  }));
  app.get(SPA_FALLBACK_ROUTE, (_req, res) => {
    res.setHeader("Cache-Control", HTML_CACHE_CONTROL);
    res.sendFile(joinPath(distDir, "index.html"));
  });
  return true;
}

function shouldServeBuiltStaticAssets(env = process.env) {
  return env.NODE_ENV === "production"
    || TRUTHY_ENV_PATTERN.test(String(env.LOCAL_PROD_STATIC ?? "").trim());
}

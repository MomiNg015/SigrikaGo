import express from "express";
import fs from "node:fs";
import path from "node:path";

const SPA_FALLBACK_ROUTE = /^(?!\/api|\/socket\.io|\/uploads).*/;
const HASHED_ASSET_PATTERN = /[-.][A-Za-z0-9_-]{8,}\./;
const PUBLIC_ASSET_PATTERN = /[\\/]assets[\\/]/;

export function installProductionStaticAssets(app, {
  distDir,
  env = process.env,
  existsSync = fs.existsSync,
  joinPath = path.join,
  staticMiddleware = express.static
} = {}) {
  if (env.NODE_ENV !== "production" || !existsSync(distDir)) return false;

  app.use(staticMiddleware(distDir, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (HASHED_ASSET_PATTERN.test(filePath) || PUBLIC_ASSET_PATTERN.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));
  app.get(SPA_FALLBACK_ROUTE, (_req, res) => {
    res.sendFile(joinPath(distDir, "index.html"));
  });
  return true;
}

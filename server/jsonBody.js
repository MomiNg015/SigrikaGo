import express from "express";

export const DEFAULT_JSON_BODY_LIMIT = "64kb";
export const STORY_SCRIPT_JSON_BODY_LIMIT = "2mb";

export function createJsonBodyParser() {
  const defaultParser = express.json({ limit: DEFAULT_JSON_BODY_LIMIT });
  const storyScriptParser = express.json({ limit: STORY_SCRIPT_JSON_BODY_LIMIT });

  return function jsonBodyParser(req, res, next) {
    const parser = isAdminStoryScriptWrite(req) ? storyScriptParser : defaultParser;
    parser(req, res, next);
  };
}

export function isAdminStoryScriptWrite(req) {
  if (String(req?.method ?? "").toUpperCase() !== "PATCH") return false;
  const path = requestPath(req);
  const prefix = "/api/admin/story-scripts/";
  if (!path.startsWith(prefix)) return false;
  const key = path.slice(prefix.length);
  return Boolean(key) && !key.includes("/");
}

function requestPath(req) {
  const path = req?.path ?? req?.originalUrl ?? req?.url ?? "";
  return String(path).split("?", 1)[0];
}

import { STORY_SCRIPT_JSON_BODY_LIMIT, isAdminStoryScriptWrite } from "./jsonBody.js";

export function requestBodyErrorHandler(error, req, res, next) {
  if (error?.type !== "entity.too.large" && error?.status !== 413) {
    next(error);
    return;
  }

  const errorMessage = isAdminStoryScriptWrite(req)
    ? `剧情脚本草稿超过 ${STORY_SCRIPT_JSON_BODY_LIMIT} 上限，请拆分剧情或精简节点后重试`
    : "请求内容过大，请减少提交内容后重试";
  res.status(413).json({ error: errorMessage, code: "REQUEST_BODY_TOO_LARGE" });
}

export function jsonSyntaxErrorHandler(error, _req, res, next) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({ error: "请求 JSON 格式错误" });
    return;
  }
  next(error);
}

export function apiErrorHandler(error, _req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = normalizeErrorStatus(error?.status);
  const exposeMessage = status < 500 || process.env.NODE_ENV !== "production";
  const payload = {
    error: exposeMessage && error?.message ? error.message : "服务器内部错误"
  };
  if (error?.code) payload.code = error.code;
  res.status(status).json(payload);
}

function normalizeErrorStatus(status) {
  const numeric = Number(status);
  return Number.isInteger(numeric) && numeric >= 400 && numeric <= 599 ? numeric : 500;
}

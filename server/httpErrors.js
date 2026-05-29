export function jsonSyntaxErrorHandler(error, _req, res, next) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({ error: "请求 JSON 格式错误" });
    return;
  }
  next(error);
}

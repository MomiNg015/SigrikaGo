import { describe, expect, it, vi } from "vitest";
import { apiErrorHandler, jsonSyntaxErrorHandler } from "./httpErrors.js";

describe("HTTP error handlers", () => {
  it("returns JSON for malformed JSON body errors", () => {
    const error = new SyntaxError("bad json");
    error.status = 400;
    error.body = "{bad";
    const res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };
    const next = vi.fn();

    jsonSyntaxErrorHandler(error, {}, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "请求 JSON 格式错误" });
    expect(next).not.toHaveBeenCalled();
  });

  it("passes unrelated errors to the next handler", () => {
    const error = new Error("boom");
    const next = vi.fn();

    jsonSyntaxErrorHandler(error, {}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("apiErrorHandler", () => {
  it("preserves domain status, message, and code as JSON", () => {
    const error = Object.assign(new Error("asset is locked"), { status: 400, code: "ASSET_LOCKED" });
    const res = response();
    apiErrorHandler(error, {}, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "asset is locked", code: "ASSET_LOCKED" });
  });

  it("hides unexpected production error details", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = response();
      apiErrorHandler(new Error("database password leaked"), {}, res, () => {});
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "服务器内部错误" });
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});

function response() {
  return {
    headersSent: false,
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

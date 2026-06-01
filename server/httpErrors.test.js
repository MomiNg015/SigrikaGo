import { describe, expect, it, vi } from "vitest";
import { jsonSyntaxErrorHandler } from "./httpErrors.js";

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

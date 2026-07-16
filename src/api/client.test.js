import { afterEach, describe, expect, it, vi } from "vitest";
import { api, configureAuthRefresh, uploadPortrait } from "./client.js";

describe("api client auth refresh", () => {
  afterEach(() => {
    configureAuthRefresh(null);
    vi.unstubAllGlobals();
  });

  it("retries an authenticated request once after refreshing the access token", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: "请先登录" }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    configureAuthRefresh(() => Promise.resolve({ token: "next-token" }));

    await expect(api("/api/me", { token: "old-token" })).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer next-token");
    expect(fetchMock.mock.calls[1][1].credentials).toBe("same-origin");
  });

  it("does not retry refresh calls recursively", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "请先登录" }, 401));
    const refresh = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    configureAuthRefresh(refresh);

    await expect(api("/api/auth/refresh", {
      method: "POST",
      skipAuthRefresh: true
    })).rejects.toThrow("请先登录");

    expect(refresh).not.toHaveBeenCalled();
  });

  it("preserves Retry-After metadata on API errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(
      { error: "\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5" },
      429,
      { "retry-after": "75" }
    )));

    const error = await api("/api/auth/login", { method: "POST" }).catch((caught) => caught);

    expect(error).toMatchObject({ status: 429, retryAfter: 75 });
  });

  it("rejects instead of waiting forever when a request never settles", async () => {
    const fetchMock = vi.fn((_url, options = {}) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      });
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await Promise.race([
      api("/api/auth/refresh", {
        method: "POST",
        requestTimeoutMs: 1,
        skipAuthRefresh: true
      }).then(
        () => "resolved",
        (error) => error.message
      ),
      new Promise((resolve) => setTimeout(() => resolve("stuck"), 25))
    ]);

    expect(result).toBe("请求超时，请稍后重试。");
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("retries portrait uploads once after refreshing the access token", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: "请先登录" }, 401))
      .mockResolvedValueOnce(jsonResponse({ url: "/uploads/characters/avatar.png" }));
    vi.stubGlobal("fetch", fetchMock);
    configureAuthRefresh(() => Promise.resolve({ token: "next-token" }));

    await expect(uploadPortrait(new Blob(["avatar"]), "old-token")).resolves.toBe("/uploads/characters/avatar.png");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer old-token");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer next-token");
    expect(fetchMock.mock.calls[1][1].credentials).toBe("same-origin");
  });
});

function jsonResponse(body, status = 200, responseHeaders = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => name.toLowerCase() === "content-type"
        ? "application/json"
        : responseHeaders[name.toLowerCase()] ?? ""
    },
    json: () => Promise.resolve(body)
  };
}

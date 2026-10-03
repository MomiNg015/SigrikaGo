import { afterEach, describe, expect, it, vi } from "vitest";
import { api, configureAuthRefresh, uploadPortrait } from "./client.js";

describe("api client auth refresh", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    configureAuthRefresh(null);
    vi.unstubAllGlobals();
  });

  it("bounds local backend recovery and preserves the final service error", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({
      error: "本地后端服务正在启动或重启，请稍后重试。", code: "dev_backend_unavailable"
    }, 503)));
    vi.stubGlobal("fetch", fetchMock);
    const result = api("/api/announcements", { retryDevBackend: true }).catch((error) => error);
    await vi.runAllTimersAsync();
    expect(await result).toMatchObject({ status: 503, code: "dev_backend_unavailable" });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["POST", 503, "dev_backend_unavailable"],
    ["GET", 503, "server_starting"],
    ["GET", 401, "dev_backend_unavailable"]
  ])("does not replay %s errors with status %s and code %s", async (method, status, code) => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "失败", code }, status));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/api/announcements/1/read", { method, retryDevBackend: true })).rejects.toMatchObject({ status, code });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cancels local backend recovery when the caller aborts", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(() => {
      setTimeout(() => controller.abort(), 0);
      return Promise.resolve(jsonResponse({ code: "dev_backend_unavailable" }, 503));
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/api/announcements", { signal: controller.signal, retryDevBackend: true })).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not enable local backend retries for other API callers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ code: "dev_backend_unavailable" }, 503));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/api/me")).rejects.toMatchObject({ status: 503, code: "dev_backend_unavailable" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares the bounded recovery budget across an access-token refresh", async () => {
    vi.useFakeTimers();
    const unavailable = () => jsonResponse({ code: "dev_backend_unavailable" }, 503);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(unavailable())
      .mockResolvedValueOnce(jsonResponse({ error: "请先登录" }, 401))
      .mockImplementation(() => Promise.resolve(unavailable()));
    const refresh = vi.fn().mockResolvedValue({ token: "next-token" });
    configureAuthRefresh(refresh);
    vi.stubGlobal("fetch", fetchMock);
    const result = api("/api/announcements", { token: "old-token", retryDevBackend: true }).catch((error) => error);
    await vi.runAllTimersAsync();
    expect(await result).toMatchObject({ status: 503, code: "dev_backend_unavailable" });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock.mock.calls.slice(2).every(([, options]) => options.headers.Authorization === "Bearer next-token")).toBe(true);
  });

  it("preserves an abort that arrives before the recovery wait begins", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(() => {
      const response = jsonResponse({ code: "dev_backend_unavailable" }, 503);
      response.json = async () => {
        controller.abort();
        return { code: "dev_backend_unavailable" };
      };
      return Promise.resolve(response);
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/api/announcements", { signal: controller.signal, retryDevBackend: true })).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves malformed JSON bodies without retrying", async () => {
    const response = jsonResponse({}, 503);
    response.json = async () => { throw new SyntaxError("Invalid JSON"); };
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/api/announcements", { retryDevBackend: true })).rejects.toThrow("Invalid JSON");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retains malformed success errors without retrying them", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200, headers: { get: () => "text/plain" }, text: async () => "invalid"
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/api/announcements", { retryDevBackend: true })).rejects.toThrow("接口返回格式不是 JSON。");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("[api] unexpected announcement response", {
      path: "/api/announcements", status: 200, contentType: "text/plain"
    });
  });

  it("diagnoses malformed announcement JSON without logging authentication or response contents", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200, headers: { get: () => "application/json" },
      json: async () => { throw new SyntaxError("broken JSON"); }
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/api/announcements/notice-1", {
      token: "secret-token", retryDevBackend: true
    })).rejects.toThrow("broken JSON");
    expect(warn).toHaveBeenCalledWith("[api] unexpected announcement response", {
      path: "/api/announcements/notice-1", status: 200, contentType: "application/json"
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

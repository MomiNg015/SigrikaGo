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

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => name.toLowerCase() === "content-type" ? "application/json" : ""
    },
    json: () => Promise.resolve(body)
  };
}

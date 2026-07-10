import { describe, expect, it, vi } from "vitest";
import {
  HTML_CACHE_CONTROL,
  IMMUTABLE_ASSET_CACHE_CONTROL,
  installProductionStaticAssets,
  RUNTIME_ASSET_CACHE_CONTROL
} from "./staticAssets.js";

function createApp() {
  return {
    get: vi.fn(),
    use: vi.fn()
  };
}

describe("production static assets", () => {
  it("does not mount static assets outside production", () => {
    const app = createApp();

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "development" },
      existsSync: () => true,
      staticMiddleware: vi.fn()
    });

    expect(app.use).not.toHaveBeenCalled();
    expect(app.get).not.toHaveBeenCalled();
  });

  it("mounts built assets in local production-like stability mode", () => {
    const app = createApp();
    const middleware = vi.fn();
    const staticMiddleware = vi.fn(() => middleware);

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "development", LOCAL_PROD_STATIC: "1" },
      existsSync: () => true,
      staticMiddleware
    });

    expect(staticMiddleware).toHaveBeenCalledWith("/app/dist", expect.objectContaining({
      index: false,
      maxAge: "1h"
    }));
    expect(app.use).toHaveBeenCalledWith(middleware);
    expect(app.get).toHaveBeenCalledWith(/^(?!\/api|\/socket\.io|\/uploads).*/, expect.any(Function));
  });

  it("does not mount static assets when the dist directory is absent", () => {
    const app = createApp();

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "production" },
      existsSync: () => false,
      staticMiddleware: vi.fn()
    });

    expect(app.use).not.toHaveBeenCalled();
    expect(app.get).not.toHaveBeenCalled();
  });

  it("mounts production static middleware and SPA fallback when dist exists", () => {
    const app = createApp();
    const middleware = vi.fn();
    const staticMiddleware = vi.fn(() => middleware);

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "production" },
      existsSync: () => true,
      joinPath: (...parts) => parts.join("/"),
      staticMiddleware
    });

    expect(staticMiddleware).toHaveBeenCalledWith("/app/dist", expect.objectContaining({
      index: false,
      maxAge: "1h"
    }));
    expect(app.use).toHaveBeenCalledWith(middleware);
    expect(app.get).toHaveBeenCalledWith(/^(?!\/api|\/socket\.io|\/uploads).*/, expect.any(Function));
  });

  it("marks hashed assets as immutable", () => {
    const app = createApp();
    let setHeaders;
    const staticMiddleware = vi.fn((_distDir, options) => {
      setHeaders = options.setHeaders;
      return vi.fn();
    });
    const res = { setHeader: vi.fn() };

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "production" },
      existsSync: () => true,
      staticMiddleware
    });
    setHeaders(res, "/app/dist/assets/index-abcdef12.js");

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  });

  it("marks Vite hashes containing dash characters as immutable", () => {
    const app = createApp();
    let setHeaders;
    const staticMiddleware = vi.fn((_distDir, options) => {
      setHeaders = options.setHeaders;
      return vi.fn();
    });
    const res = { setHeader: vi.fn() };

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "production" },
      existsSync: () => true,
      staticMiddleware
    });
    setHeaders(res, "/app/dist/assets/clock-HwmNdd-t.js");

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  });

  it("serves mutable runtime assets with a short stale-while-revalidate cache", () => {
    const app = createApp();
    let setHeaders;
    const staticMiddleware = vi.fn((_distDir, options) => {
      setHeaders = options.setHeaders;
      return vi.fn();
    });
    const res = { setHeader: vi.fn() };

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "production" },
      existsSync: () => true,
      staticMiddleware
    });
    setHeaders(res, "/app/dist/assets/music/main_bgm.ogg");

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", RUNTIME_ASSET_CACHE_CONTROL);
    expect(res.setHeader).not.toHaveBeenCalledWith("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  });

  it("does not treat descriptive hyphenated public effect filenames as Vite hashes", () => {
    const app = createApp();
    let setHeaders;
    const staticMiddleware = vi.fn((_distDir, options) => {
      setHeaders = options.setHeaders;
      return vi.fn();
    });
    const res = { setHeader: vi.fn() };

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "production" },
      existsSync: () => true,
      staticMiddleware
    });
    setHeaders(res, "/app/dist/assets/effects/changli-fire-phoenix.svg");

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", RUNTIME_ASSET_CACHE_CONTROL);
    expect(res.setHeader).not.toHaveBeenCalledWith("Cache-Control", IMMUTABLE_ASSET_CACHE_CONTROL);
  });

  it("keeps the SPA shell revalidating instead of caching an old release", () => {
    const app = createApp();
    const res = { setHeader: vi.fn(), sendFile: vi.fn() };

    installProductionStaticAssets(app, {
      distDir: "/app/dist",
      env: { NODE_ENV: "production" },
      existsSync: () => true,
      joinPath: (...parts) => parts.join("/"),
      staticMiddleware: vi.fn(() => vi.fn())
    });

    const fallback = app.get.mock.calls[0][1];
    fallback({}, res);

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", HTML_CACHE_CONTROL);
    expect(res.sendFile).toHaveBeenCalledWith("/app/dist/index.html");
  });
});

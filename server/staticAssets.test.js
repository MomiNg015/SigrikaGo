import { describe, expect, it, vi } from "vitest";
import { installProductionStaticAssets } from "./staticAssets.js";

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

    expect(staticMiddleware).toHaveBeenCalledWith("/app/dist", expect.objectContaining({ maxAge: "1h" }));
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

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "public, max-age=31536000, immutable");
  });

  it("marks public asset resources as immutable so repeat visits use the browser cache", () => {
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

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "public, max-age=31536000, immutable");
  });
});

// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { startSiteEntry } from "./siteEntryBootstrap.js";

afterEach(() => { document.body.innerHTML = ""; });

function shell() {
  const html = readFileSync("index.html", "utf8");
  document.body.innerHTML = html.match(/<body>([\s\S]*?)<script type="module"/)[1];
  return document.getElementById("root");
}

describe("site entry handoff", () => {
  it("keeps the real HTML progress visible until both application code and resources finish", async () => {
    const root = shell();
    let releaseApp;
    let releaseAssets;
    const app = new Promise(resolve => { releaseApp = resolve; });
    const assets = new Promise(resolve => { releaseAssets = resolve; });
    const mountApplication = vi.fn();
    const pending = startSiteEntry({ root, loadApplication: () => app, mountApplication,
      preload: ({ onProgress }) => { onProgress(1); return assets; }
    });
    expect(root.querySelector('[role="progressbar"]').getAttribute("aria-valuenow")).toBe("95");
    releaseAssets({ characters: {}, siteSettings: { preloadTips: "ready" } });
    await Promise.resolve();
    expect(mountApplication).not.toHaveBeenCalled();
    const application = { default: "App" };
    releaseApp(application);
    expect(await pending).toBe(true);
    expect(mountApplication).toHaveBeenCalledWith(application, { characters: {}, siteSettings: { preloadTips: "ready" } });
    expect(root.querySelector('[role="progressbar"]').getAttribute("aria-valuenow")).toBe("100");
  });

  it("provides a visible reload action when the application module cannot load", async () => {
    const root = shell();
    const reload = vi.fn();
    const mountApplication = vi.fn();
    expect(await startSiteEntry({ root, reload, mountApplication,
      loadApplication: async () => { throw new Error("chunk unavailable"); },
      preload: async () => ({})
    })).toBe(false);
    expect(root.querySelector('[role="alert"]').textContent).toContain("刷新重试");
    const button = root.querySelector("button");
    expect(button.hidden).toBe(false);
    button.click();
    expect(reload).toHaveBeenCalledOnce();
    expect(mountApplication).not.toHaveBeenCalled();
  });
});

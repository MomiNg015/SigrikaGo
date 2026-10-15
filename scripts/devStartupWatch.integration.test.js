import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { once } from "node:events";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";
import { expect, test } from "vitest";
import config from "../vite.config.js";

test("watches application edits without crawling temporary toolchains", async () => {
  const root = await mkdtemp(path.join(process.cwd(), ".dev-watch-test-"));
  let server;
  try {
    const directories = ["src", "public", ".codex-run", ".tmp", ".worktrees",
      ".codex-temp", ".trellis", ".releases", "output", "outputs", "prototypes",
      "artifacts", "test-results", "playwright-report"];
    for (const directory of directories) {
      await mkdir(path.join(root, directory));
      await writeFile(path.join(root, directory, "probe.js"), "export const value = 1;\n");
    }
    await writeFile(path.join(root, "index.html"), '<script type="module" src="/src/probe.js"></script>');
    const reservation = createHttpServer();
    reservation.listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const port = reservation.address().port;
    await new Promise((resolve) => reservation.close(resolve));
    server = await createServer({
      configFile: false, root: root.replaceAll("\\", "/"), logLevel: "silent",
      optimizeDeps: { entries: config.optimizeDeps.entries, noDiscovery: true },
      server: { port, strictPort: true, host: "127.0.0.1", watch: config.server.watch }
    });
    const ready = once(server.watcher, "ready");
    await server.listen();
    await ready;
    // Chokidar can emit ready for env-file additions before the root crawl ends.
    await expect.poll(() => Object.entries(server.watcher.getWatched())
      .find(([directory]) => path.resolve(directory) === path.join(root, "src"))?.[1],
    { timeout: 5000 }).toContain("probe.js");
    const watched = Object.fromEntries(Object.entries(server.watcher.getWatched())
      .map(([directory, files]) => [directory.replaceAll("\\", "/"), files]));
    for (const directory of directories) {
      const files = watched[path.join(root, directory).replaceAll("\\", "/")] ?? [];
      if (directory === "src" || directory === "public") {
        expect(files, directory).toContain("probe.js");
      } else {
        expect(files, directory).not.toContain("probe.js");
      }
    }
    const changed = once(server.watcher, "change", { signal: AbortSignal.timeout(5000) });
    await writeFile(path.join(root, "src", "probe.js"), "export const value = 2;\n");
    expect(path.resolve((await changed)[0])).toBe(path.join(root, "src", "probe.js"));
    expect(config.optimizeDeps.entries).toEqual(["index.html"]);
  } finally {
    await server?.close();
    if (path.dirname(root) === process.cwd() && path.basename(root).startsWith(".dev-watch-test-")) {
      await rm(root, { recursive: true, force: true });
    }
  }
}, 15000);

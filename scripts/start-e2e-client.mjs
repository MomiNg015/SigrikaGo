import { createServer } from "vite";
import { pathToFileURL } from "node:url";

export function e2eClientEnvironment(env = process.env) {
  // Vite otherwise treats a closed automation stdin as a request to exit.
  return { ...env, CI: "true" };
}

export function e2eClientConfig(env = process.env) {
  const apiOrigin = `http://127.0.0.1:${env.E2E_SERVER_PORT ?? "3317"}`;
  return {
    cacheDir: `node_modules/.vite-e2e-${env.E2E_CLIENT_PORT ?? "5317"}`,
    optimizeDeps: { entries: ["index.html"] },
    server: {
      host: "127.0.0.1", port: Number(env.E2E_CLIENT_PORT ?? "5317"), strictPort: true,
      watch: { ignored: ["**/.tmp/**", "**/.codex-run/**", "**/.worktrees/**"] },
      proxy: {
        "/api": apiOrigin,
        "/uploads": apiOrigin,
        "/socket.io": { target: apiOrigin, ws: true }
      }
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await createServer(e2eClientConfig());
  await server.listen();
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => { await server.close(); process.exit(0); });
  }
}

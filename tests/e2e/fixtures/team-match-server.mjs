import { build, preview } from "vite";

const outDir = ".codex-run/team-e2e-dist";
await build({ build: { outDir, rollupOptions: { input: "tests/e2e/fixtures/team-match.html" } } });
const server = await preview({
  build: { outDir },
  preview: { host: "127.0.0.1", port: Number(process.env.TEAM_VISUAL_PORT ?? 5290), strictPort: true }
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.httpServer.close(() => process.exit(0)));
}

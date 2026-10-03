import { preview } from "vite";

const server = await preview({ preview: { host: "127.0.0.1", port: 5291, strictPort: true, proxy: {} } });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.httpServer.close(() => process.exit(0)));
}

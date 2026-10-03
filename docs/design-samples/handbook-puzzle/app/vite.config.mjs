import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from 'node:url';

export default defineConfig({
  publicDir: fileURLToPath(new URL('../../../../public', import.meta.url)),
  build: { copyPublicDir: false },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
    fs: { allow: [fileURLToPath(new URL('../../../../', import.meta.url))] },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});

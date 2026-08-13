import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repoRoot = path.resolve("C:/codex/SigrikaGo");
const previewRoot = path.join(
  repoRoot,
  ".trellis/tasks/08-11-design-aemeath-nameplate-v2/nameplate-preview"
);

export default defineConfig({
  root: previewRoot,
  publicDir: path.join(repoRoot, "public"),
  plugins: [react()]
});

// TEMPORARY: production build of the emoji perf page. Deleted after measuring.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  logLevel: "warn",
  build: {
    outDir: process.env.PERF_OUT,
    emptyOutDir: true,
    minify: process.env.PERF_MINIFY !== "0",
    rollupOptions: { input: `${root}__emoji-perf.html` },
  },
});

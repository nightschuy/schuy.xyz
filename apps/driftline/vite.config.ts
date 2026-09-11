import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Schuy.xyz itself has no build step, so this concept is built here and the
// static output is committed to /concepts/driftline/ for GitHub Pages to serve.
// Relative base keeps asset URLs working from that subpath.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "../../concepts/driftline"),
    emptyOutDir: true,
  },
});

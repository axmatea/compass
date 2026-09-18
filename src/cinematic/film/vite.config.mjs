// Standalone build for the film, isolated from the product build.
//   dev:   npx vite --config src/cinematic/film/vite.config.mjs
//   build: npx vite build --config src/cinematic/film/vite.config.mjs
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = fileURLToPath(new URL("../../../", import.meta.url));

export default defineConfig({
  root: here,
  base: "./",
  publicDir: false,
  server: { port: 5188, strictPort: false, fs: { allow: [repo] } },
  build: { outDir: "dist", emptyOutDir: true },
});

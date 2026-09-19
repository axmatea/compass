import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), {
    name: "compass-demo-route",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/demo\/?(?:\?|$)/.test(req.url)) req.url = req.url.replace(/^\/demo\/?/, "/live.html");
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/demo\/?(?:\?|$)/.test(req.url)) req.url = req.url.replace(/^\/demo\/?/, "/live.html");
        next();
      });
    },
  }],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        website: fileURLToPath(new URL("./index.html", import.meta.url)),
        story: fileURLToPath(new URL("./story.html", import.meta.url)),
        presentation: fileURLToPath(new URL("./present.html", import.meta.url)),
        live: fileURLToPath(new URL("./live.html", import.meta.url)),
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), {
    name: "compass-demo-route",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/(acquisition(?:\/app)?|login)\/?(?:\?|$)/.test(req.url)) req.url = "/acquisition.html" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
        else if (req.url && /^\/(app|demo|presentation|present|story)\/?(?:\?|$)/.test(req.url)) req.url = req.url.replace(/^\/[^/?]+\/?/, "/index.html");
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/(acquisition(?:\/app)?|login)\/?(?:\?|$)/.test(req.url)) req.url = "/acquisition.html" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
        else if (req.url && /^\/(app|demo|presentation|present|story)\/?(?:\?|$)/.test(req.url)) req.url = req.url.replace(/^\/[^/?]+\/?/, "/index.html");
        next();
      });
    },
  }],
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8770', ws: true } } },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        website: fileURLToPath(new URL("./index.html", import.meta.url)),
        acquisition: fileURLToPath(new URL("./acquisition.html", import.meta.url)),
        story: fileURLToPath(new URL("./story.html", import.meta.url)),
        presentation: fileURLToPath(new URL("./present.html", import.meta.url)),
        live: fileURLToPath(new URL("./live.html", import.meta.url)),
      },
    },
  },
});

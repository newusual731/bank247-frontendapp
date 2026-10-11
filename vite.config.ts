import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Local nginx gateway — browser stays on :5173; Vite proxies API + Keycloak. */
const gateway = process.env.VITE_DEV_PROXY_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: gateway, changeOrigin: true },
      "/realms": { target: gateway, changeOrigin: true },
      "/resources": { target: gateway, changeOrigin: true },
      "/health": { target: gateway, changeOrigin: true },
    },
  },
});

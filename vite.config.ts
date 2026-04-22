import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR configuration
      hmr: process.env.DISABLE_HMR !== "true",
      allowedHosts: [
        "defamingly-nongelatinizing-payton.ngrok-free.dev"
      ],
    },
  };
});
import { createHash } from "node:crypto";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (typeof globalThis.crypto.hash !== "function") {
  globalThis.crypto.hash = (algorithm, data) => {
    const normalized = typeof algorithm === "string" ? algorithm.toLowerCase() : "sha256";
    const hash = createHash(normalized);
    hash.update(Buffer.from(data));
    return hash.digest();
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/md2img/",
  plugins: [vue(), tailwindcss()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});

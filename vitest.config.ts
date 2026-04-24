import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Resolve "@" to THIS project's src/ regardless of checkout path.
// An absolute hardcoded dev path here caused CI to load
// src/app/layout.tsx from my laptop's working copy while importing
// node_modules/react from the CI checkout — two different React
// instances ended up in the tree, hooks broke with "Cannot read
// properties of null (reading 'useState')" and "Geist is not a
// function". Using fileURLToPath(new URL(...)) makes this portable.
const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: {
    alias: {
      "@": srcPath,
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: { include: ["tests/unit/**/*.test.ts"], fileParallelism: false, testTimeout: 20000 },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});

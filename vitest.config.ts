import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      DATABASE_URL: "postgres://titanbay:titanbay@localhost:5432/titanbay_test",
      JWT_SECRET: "test-secret-do-not-use-in-prod",
      NODE_ENV: "test",
    },
  },
});

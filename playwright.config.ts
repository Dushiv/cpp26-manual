import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:8901",
  },
  webServer: {
    command: "npx http-server . -p 8901 --cors -c-1",
    url: "http://127.0.0.1:8901/prototype/index.html",
    reuseExistingServer: true,
  },
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: false, // tests share auth state; run serially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Runs once before all tests — creates the E2E test user in Supabase
  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    serviceWorkers: "block",
  },

  projects: [
    // Auth tests run WITHOUT saved session (they test login themselves)
    {
      name: "auth-tests",
      testMatch: /01-auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: undefined, // no saved session
      },
    },

    // Public menu tests — no auth needed
    {
      name: "public-tests",
      testMatch: /05-public-menu\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // All other tests reuse the logged-in session saved by global-setup
    {
      name: "chromium",
      testIgnore: [/01-auth\.spec\.ts/, /05-public-menu\.spec\.ts/],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

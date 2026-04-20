/**
 * global-setup.ts
 * Runs once before all tests.
 * Creates a confirmed E2E test user via Supabase Admin API, then logs in
 * via the browser so Supabase sets both cookies and localStorage correctly.
 */
import * as fs from "fs";
import * as path from "path";
import { chromium, FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually — global-setup runs outside Next.js
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || "e2e-test@menuzai.test",
  password: process.env.E2E_TEST_PASSWORD || "TestPassword123!",
};

async function globalSetup(_config: FullConfig) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
        "These are required so global-setup can create a confirmed test user."
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  async function findTestUser(): Promise<string | undefined> {
    let pageNum = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page: pageNum, perPage: 1000 });
      if (error || !data?.users?.length) break;
      const found = data.users.find((u) => u.email === TEST_USER.email);
      if (found) return found.id;
      if (data.users.length < 1000) break;
      pageNum++;
    }
    return undefined;
  }

  async function upsertTestUser(id: string): Promise<string> {
    const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
      id,
      { password: TEST_USER.password, email_confirm: true }
    );
    if (updateError || !updated.user) {
      throw new Error(`Failed to reset test user: ${updateError?.message}`);
    }
    return updated.user.id;
  }

  let testUserId: string;
  const existingUserId = await findTestUser();

  if (existingUserId) {
    testUserId = await upsertTestUser(existingUserId);
    // Clear any leftover restaurant row so onboarding starts fresh
    await admin.from("restaurants").delete().eq("user_id", testUserId);
    console.log(`✓ Existing test user reset: ${TEST_USER.email}`);
  } else {
    // Create a fresh pre-confirmed test user
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
    });

    if (createError?.message?.toLowerCase().includes("already")) {
      // listUsers had a transient miss — search again and update
      const retryId = await findTestUser();
      if (!retryId) {
        throw new Error(
          `Test user exists but cannot be found via listUsers. ` +
          `Check SUPABASE_SERVICE_ROLE_KEY or delete ${TEST_USER.email} manually.`
        );
      }
      testUserId = await upsertTestUser(retryId);
      await admin.from("restaurants").delete().eq("user_id", testUserId);
      console.log(`✓ Existing test user reset (retry path): ${TEST_USER.email}`);
    } else if (createError || !created.user) {
      throw new Error(`Failed to create test user: ${createError?.message}`);
    } else {
      testUserId = created.user.id;
    }
  }

  // Log in via the browser — this sets both Supabase cookies AND localStorage,
  // which is required for SSR-based auth checks in the dashboard layout.
  const authDir = path.resolve(__dirname, ".auth");
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`);
  // Wait for the React form to hydrate
  await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 60000 });

  await page.locator('input[type="email"]').fill(TEST_USER.email);
  await page.locator('input[type="password"]').fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for post-login redirect (new user → onboarding; returning user → dashboard)
  await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 20000 });

  await context.storageState({ path: path.join(authDir, "user.json") });
  await browser.close();

  console.log(`✓ E2E test user created and logged in: ${TEST_USER.email}`);
  console.log(`✓ Session (cookies + localStorage) saved to e2e/.auth/user.json`);
}

export default globalSetup;

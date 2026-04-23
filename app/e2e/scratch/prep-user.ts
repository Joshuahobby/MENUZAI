import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.resolve(__dirname, "../../.env.local");
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || "e2e-test@menuzai.test",
  password: process.env.E2E_TEST_PASSWORD || "TestPassword123!",
};

async function main() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  console.log(`Ensuring user ${TEST_USER.email} exists...`);
  
  const { data: { users } } = await admin.auth.admin.listUsers();
  let user = users.find(u => u.email === TEST_USER.email);
  
  if (user) {
    console.log("User exists, resetting...");
    await admin.auth.admin.updateUserById(user.id, { password: TEST_USER.password, email_confirm: true });
    await admin.from("restaurants").delete().eq("user_id", user.id);
  } else {
    console.log("Creating user...");
    const { data: created, error } = await admin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
    });
    if (error) throw error;
    user = created.user;
  }
  
  console.log(`User ${TEST_USER.email} is ready.`);
}

main().catch(console.error);

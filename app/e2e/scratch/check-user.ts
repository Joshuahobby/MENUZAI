
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

async function check() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const email = "e2e-test@menuzai.test";
  
  const { data: { users } } = await admin.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log("User not found");
    return;
  }
  
  console.log("User ID:", user.id);
  
  const { data: restaurant } = await admin.from("restaurants").select("*").eq("user_id", user.id).single();
  console.log("Restaurant:", restaurant);
}

check();

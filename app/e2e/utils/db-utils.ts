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

export async function resetOnboarding(email: string) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing Supabase credentials for DB reset");
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  // Find user ID by email
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  
  const user = users.find(u => u.email === email);
  if (!user) return;

  // Reset onboarded status and optionally clear the restaurant row
  await admin.from("restaurants").update({ onboarded: false }).eq("user_id", user.id);
  console.log(`[E2E DB] Reset onboarding for ${email}`);
}

export async function ensureOnboarded(email: string) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const { data: { users } } = await admin.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) throw new Error(`User ${email} not found`);

  const { data: restaurant } = await admin.from("restaurants").select("id").eq("user_id", user.id).single();
  
  if (restaurant) {
    const { error: updateError } = await admin.from("restaurants").update({ 
      onboarded: true,
      name: "E2E Test Restaurant",
      tagline: "The best test restaurant in town",
      hours: "Mon-Sun 24/7"
    }).eq("user_id", user.id);
    if (updateError) throw updateError;
    console.log(`[E2E DB] Updated restaurant for ${email}`);
  } else {
    const { error: insertError } = await admin.from("restaurants").insert({
      user_id: user.id,
      name: "E2E Test Restaurant",
      tagline: "The best test restaurant in town",
      hours: "Mon-Sun 24/7",
      onboarded: true
    });
    if (insertError) throw insertError;
    console.log(`[E2E DB] Inserted new restaurant for ${email}`);
  }
  
  // Verify it's actually there
  const { data: verify } = await admin.from("restaurants").select("onboarded").eq("user_id", user.id).single();
  console.log(`[E2E DB] Verified state for ${email}: onboarded=${verify?.onboarded}`);
}

export async function deleteRestaurant(email: string) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const { data: { users } } = await admin.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) return;

  await admin.from("restaurants").delete().eq("user_id", user.id);
  console.log(`[E2E DB] Deleted restaurant for ${email}`);
}

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: "./app/.env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { error } = await supabase.rpc('setup_platform_settings', {
    sql: `
      CREATE TABLE IF NOT EXISTS platform_settings (
        id text PRIMARY KEY,
        ai_provider text DEFAULT 'openrouter',
        ai_model text DEFAULT 'google/gemma-4-31b-it:free',
        updated_at timestamp with time zone DEFAULT now()
      );
      INSERT INTO platform_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;
    `
  });
  
  if (error) {
    // Fallback: we might not have a generic eval function. Let's just instruct the user.
    console.log("Could not run via RPC, please create the table manually or use Supabase Studio.");
    console.error(error);
  } else {
    console.log("Table created.");
  }
}

main();

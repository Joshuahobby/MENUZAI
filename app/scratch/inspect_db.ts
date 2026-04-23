import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function inspectTable() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  console.log("Supabase URL:", SUPABASE_URL);
  
  const { data, error } = await admin.from("restaurants").select("*").limit(1);
  if (error) {
    console.error("Error fetching restaurants:", error);
  } else {
    console.log("Restaurant data:", data);
    if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("Table is empty.");
      // Try to get columns by inserting a dummy row and rolling back (or just trust error)
      const { data: cols, error: colError } = await admin.rpc('get_table_columns', { table_name: 'restaurants' });
      if (colError) {
          console.error("Error getting columns via RPC:", colError);
          // Try a simple select of one column to see if it exists
          const testCols = ['id', 'user_id', 'name', 'slug', 'onboarded', 'tagline', 'cuisine'];
          for (const col of testCols) {
              const { error: e } = await admin.from("restaurants").select(col).limit(1);
              if (e) {
                  console.log(`Column ${col} does NOT exist.`);
              } else {
                  console.log(`Column ${col} exists.`);
              }
          }
      } else {
          console.log("Columns via RPC:", cols);
      }
    }
  }
}

inspectTable();

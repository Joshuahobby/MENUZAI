const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }

  // Parse .env.local
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      env[key] = value.replace(/^["']|["']$/g, '');
    }
  });

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Get policies from pg_policies via rpc if possible
    console.log("Fetching policies for 'menus' table...");
    const { data: policies, error: policiesErr } = await supabase.rpc('setup_platform_settings', {
      sql: `SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'menus';`
    });

    if (policiesErr) {
      console.warn("Could not fetch policies via setup_platform_settings direct call:", policiesErr.message);
      // Let's try another query to see if we can get policy list or if the function setup_platform_settings returns something else
    } else {
      console.log("Policies on 'menus':", JSON.stringify(policies, null, 2));
    }

    // Let's also query some rows from menus to see their structure and constraints
    console.log("\nFetching sample menus...");
    const { data: menus, error: menusErr } = await supabase
      .from('menus')
      .select('id, user_id, restaurant_id, name, slug, status')
      .limit(5);

    if (menusErr) {
      console.error("Error fetching menus:", menusErr);
    } else {
      console.log("Sample menus in DB:", menus);
    }

    // Let's check the schema of the menus table (columns)
    console.log("\nFetching column schema of 'menus'...");
    const { data: columns, error: colErr } = await supabase.rpc('setup_platform_settings', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'menus' AND table_schema = 'public';
      `
    });

    if (colErr) {
      console.warn("Could not get columns:", colErr.message);
    } else {
      console.log("Columns:", columns);
    }

  } catch (err) {
    console.error("Error:", err);
  }
}

main();

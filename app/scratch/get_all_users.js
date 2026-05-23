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
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  console.log("Connecting to Supabase at:", supabaseUrl);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    console.log("Fetching users from auth.users...");
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (authError) {
      throw authError;
    }

    console.log(`Retrieved ${authData.users.length} users from auth.`);

    console.log("Fetching restaurant_staff rows...");
    const { data: staffData, error: staffError } = await supabase
      .from('restaurant_staff')
      .select('*');

    if (staffError) {
      console.warn("Could not fetch restaurant_staff (maybe table doesn't exist or error):", staffError.message);
    }

    console.log("Fetching restaurants rows...");
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*');

    if (restaurantError) {
      console.warn("Could not fetch restaurants:", restaurantError.message);
    }

    const staffMap = {};
    if (staffData) {
      staffData.forEach(s => {
        if (!staffMap[s.user_id]) staffMap[s.user_id] = [];
        staffMap[s.user_id].push(s);
      });
    }

    const restaurantMap = {};
    if (restaurantData) {
      restaurantData.forEach(r => {
        restaurantMap[r.user_id] = r;
      });
    }

    console.log("\n=== USER CREDENTIALS AND DETAILS ===");
    authData.users.forEach((u, i) => {
      const staffRoles = staffMap[u.id] || [];
      const restaurant = restaurantMap[u.id] || restaurantMap[u.user_metadata?.sub] || null;

      console.log(`\nUser #${i + 1}:`);
      console.log(`- Email: ${u.email}`);
      console.log(`- ID: ${u.id}`);
      console.log(`- Created At: ${u.created_at}`);
      console.log(`- Last Sign In: ${u.last_sign_in_at}`);
      
      if (staffRoles.length > 0) {
        console.log(`- Roles:`);
        staffRoles.forEach(sr => {
          console.log(`  * Restaurant ID: ${sr.restaurant_id}, Role: ${sr.role}`);
        });
      } else {
        console.log(`- Roles: None (Not in restaurant_staff table)`);
      }

      if (restaurant) {
        console.log(`- Restaurant: "${restaurant.name || 'Unnamed'}" (Slug: ${restaurant.slug || 'none'}, Onboarded: ${restaurant.onboarded}, Plan: ${restaurant.plan_tier})`);
      } else {
        console.log(`- Restaurant: None`);
      }
    });

    console.log("\n=== TEST ACCOUNTS SUGGESTION ===");
    console.log(`You can test using the standard E2E test email:`);
    console.log(`Email: ${env.E2E_TEST_EMAIL || 'e2e-test@menuzai.test'}`);
    console.log(`Password: ${env.E2E_TEST_PASSWORD || 'TestPassword123!'}`);

  } catch (error) {
    console.error("Error executing query:", error);
  }
}

main();

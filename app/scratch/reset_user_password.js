const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const emailArg = process.argv[2];
  const newPassword = process.argv[3] || 'TestPassword123!';

  if (!emailArg) {
    console.error("Usage: node scratch/reset_user_password.js <email> [new_password]");
    console.error("Example: node scratch/reset_user_password.js selektajaba@gmail.com MyNewPassword123!");
    process.exit(1);
  }

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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  console.log(`Searching for user with email: ${emailArg}`);

  try {
    // List users to find the correct ID
    let foundUser = null;
    let pageNum = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: pageNum,
        perPage: 1000
      });

      if (error) {
        throw error;
      }

      if (!data || !data.users || data.users.length === 0) {
        break;
      }

      foundUser = data.users.find(u => u.email.toLowerCase() === emailArg.toLowerCase());
      if (foundUser) {
        break;
      }

      if (data.users.length < 1000) {
        break;
      }
      pageNum++;
    }

    if (!foundUser) {
      console.error(`User with email "${emailArg}" not found in auth.users.`);
      process.exit(1);
    }

    console.log(`Found user: ${foundUser.email} (ID: ${foundUser.id})`);
    console.log(`Updating password to: ${newPassword}...`);

    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
      foundUser.id,
      { 
        password: newPassword,
        email_confirm: true 
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`\n✓ Successfully reset password for ${foundUser.email}!`);
    console.log(`Credentials for login:`);
    console.log(`- Email: ${foundUser.email}`);
    console.log(`- Password: ${newPassword}`);

  } catch (error) {
    console.error("Error resetting user password:", error.message || error);
  }
}

main();

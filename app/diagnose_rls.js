/**
 * diagnose_rls.js — Comprehensive RLS diagnostics for MENUZAI
 * 
 * Tests:
 *  1. Migration 010 applied? (check_staff_role function exists)
 *  2. Authenticated restaurant SELECT (was giving 500)
 *  3. Authenticated restaurant_staff SELECT (was giving 500)
 *  4. Menu upsert WITHOUT restaurant_id (reproduces 403)
 *  5. Menu upsert WITH restaurant_id (should pass)
 *  6. Verify menus in DB have restaurant_id set
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  content.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;
    const idx = line.indexOf("=");
    if (idx < 0) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  });
  return env;
}

const envPath = path.join(__dirname, ".env.local");
const env = parseEnv(envPath);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = env.E2E_TEST_EMAIL;
const TEST_PASSWORD = env.E2E_TEST_PASSWORD;

function pass(label, data) { console.log(`  ✅ PASS: ${label}`, data !== undefined ? JSON.stringify(data).slice(0, 200) : ""); }
function fail(label, err) { console.error(`  ❌ FAIL: ${label}`, err?.message ?? err); }
function section(title) { console.log(`\n${"─".repeat(60)}\n  ${title}\n${"─".repeat(60)}`); }

async function main() {
  console.log(`\n🔍 MENUZAI RLS Diagnostics`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Test user: ${TEST_EMAIL}\n`);

  // ── 1. Admin: Verify migration 010 is applied ─────────────────────────────
  section("1. Admin: Check check_staff_role function exists");
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: fnCheck, error: fnErr } = await admin.rpc("check_staff_role", {
    r_id: "00000000-0000-0000-0000-000000000000",
    u_id: "00000000-0000-0000-0000-000000000000",
    allowed_roles: ["owner"]
  });
  if (fnErr) fail("check_staff_role RPC", fnErr);
  else pass("check_staff_role function exists and is callable", { result: fnCheck });

  // ── 2. Admin: List all menus and check restaurant_id column ────────────────
  section("2. Admin: Check menus for NULL restaurant_id (root cause of 403)");
  const { data: menuAudit, error: menuAuditErr } = await admin
    .from("menus")
    .select("id, name, user_id, restaurant_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10);
  if (menuAuditErr) {
    fail("Menu audit", menuAuditErr);
  } else {
    const nullRid = menuAudit.filter(m => !m.restaurant_id);
    console.log(`  Total menus checked: ${menuAudit.length}`);
    console.log(`  Menus with NULL restaurant_id: ${nullRid.length}`);
    if (nullRid.length > 0) {
      console.warn("  ⚠️  PROBLEM FOUND: these menus will always 403 on upsert:");
      nullRid.forEach(m => console.warn(`     id=${m.id} name="${m.name}" user_id=${m.user_id}`));
    } else {
      pass("All menus have restaurant_id set");
    }
  }

  // ── 3. Admin: List current RLS policies on menus ───────────────────────────
  section("3. Admin: Current RLS policies on menus table");
  const { data: policies, error: polErr } = await admin
    .from("pg_policies")
    .select("policyname, cmd, qual, with_check")
    .eq("tablename", "menus");

  if (polErr) {
    // pg_policies isn't directly queryable via postgREST — use raw SQL via RPC
    console.log("  (pg_policies not accessible via REST — skipping this check)");
  } else {
    policies?.forEach(p => console.log(`  Policy: "${p.policyname}" [${p.cmd}]`));
  }

  // ── 4. Authenticated: Sign in as test user ─────────────────────────────────
  section("4. Authenticated: Sign in");
  const client = createClient(SUPABASE_URL, ANON_KEY);
  const { data: authData, error: authErr } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (authErr || !authData.user) {
    fail("Login", authErr);
    process.exit(1);
  }
  const user = authData.user;
  pass(`Signed in`, { userId: user.id });

  // ── 5. Authenticated: SELECT restaurants (was 500) ─────────────────────────
  section("5. Authenticated: SELECT from restaurants");
  const { data: rests, error: restsErr, status: restsStatus } = await client
    .from("restaurants")
    .select("id, name, phone, plan, logo_url, onboarded, user_id")
    .order("created_at", { ascending: true })
    .limit(1);
  if (restsErr) fail(`SELECT restaurants [HTTP ${restsStatus}]`, restsErr);
  else pass(`SELECT restaurants [HTTP ${restsStatus}]`, rests?.[0] ?? "empty");

  const restaurantId = rests?.[0]?.id ?? null;

  // ── 6. Authenticated: SELECT restaurant_staff (was 500) ────────────────────
  section("6. Authenticated: SELECT from restaurant_staff");
  const { data: staff, error: staffErr, status: staffStatus } = await client
    .from("restaurant_staff")
    .select("restaurant_id, role")
    .eq("user_id", user.id)
    .limit(1);
  if (staffErr) fail(`SELECT restaurant_staff [HTTP ${staffStatus}]`, staffErr);
  else pass(`SELECT restaurant_staff [HTTP ${staffStatus}]`, staff?.[0] ?? "empty");

  // ── 7. Authenticated: Upsert menu WITHOUT restaurant_id (reproduces 403) ───
  section("7. Authenticated: Upsert menu WITHOUT restaurant_id (expect 403)");
  if (restaurantId) {
    // First, get the active menu id
    const { data: menus } = await client
      .from("menus")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .limit(1);
    const menuId = menus?.[0]?.id;

    if (menuId) {
      const { error: upsertErrNoRid, status: upsertStatusNoRid } = await client
        .from("menus")
        .upsert(
          { id: menuId, user_id: user.id, categories: [], items: [], style: {}, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
      if (upsertErrNoRid) {
        if (upsertStatusNoRid === 403) fail(`Upsert WITHOUT restaurant_id [403 - BUG CONFIRMED]`, upsertErrNoRid);
        else fail(`Upsert WITHOUT restaurant_id [HTTP ${upsertStatusNoRid}]`, upsertErrNoRid);
      } else {
        pass(`Upsert WITHOUT restaurant_id [HTTP ${upsertStatusNoRid}] — OK (restaurant_id was already on the row)`);
      }

      // ── 8. Authenticated: Upsert menu WITH restaurant_id (should pass) ────────
      section("8. Authenticated: Upsert menu WITH restaurant_id (expect 200)");
      const { error: upsertErrWithRid, status: upsertStatusWithRid } = await client
        .from("menus")
        .upsert(
          {
            id: menuId,
            user_id: user.id,
            restaurant_id: restaurantId, // ← key fix
            categories: [],
            items: [],
            style: {},
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );
      if (upsertErrWithRid) fail(`Upsert WITH restaurant_id [HTTP ${upsertStatusWithRid}]`, upsertErrWithRid);
      else pass(`Upsert WITH restaurant_id [HTTP ${upsertStatusWithRid}]`);
    } else {
      console.log("  (No menu found for this restaurant — skipping upsert tests)");
    }
  } else {
    console.log("  (No restaurant found — skipping upsert tests)");
  }

  console.log("\n✅ Diagnostics complete.\n");
}

main().catch(err => { console.error("\nFatal:", err); process.exit(1); });

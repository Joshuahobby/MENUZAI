import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TestMenu {
  restaurantId: string;
  menuId: string;
  slug: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTestUserId(admin: any): Promise<string> {
  const email = process.env.E2E_TEST_EMAIL || "e2e-test@menuzai.test";
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error || !data?.users?.length) throw new Error(`Failed to list users: ${error?.message}`);
  const user = data.users.find((u: { email: string }) => u.email === email);
  if (!user) throw new Error(`Test user not found: ${email}`);
  return user.id;
}

export async function createTestMenu(): Promise<TestMenu> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await getTestUserId(admin);
  const slug = `e2e-test-menu-${Date.now()}`;

  // Clean up any existing restaurants for this user so the location-limit
  // DB trigger (migration 033) doesn't block creation
  await admin.from("menus").delete().eq("user_id", userId);
  await admin.from("restaurants").delete().eq("user_id", userId);

  // Create a restaurant for the test
  const { data: restaurant, error: rErr } = await admin
    .from("restaurants")
    .insert({
      user_id: userId,
      name: "E2E Test Restaurant",
      phone: "+250788000000",
      onboarded: true,
      plan: "free",
    })
    .select("id")
    .single();

  if (rErr || !restaurant) throw new Error(`Failed to create test restaurant: ${rErr?.message}`);

  // Create a published menu
  const { data: menu, error: mErr } = await admin
    .from("menus")
    .insert({
      restaurant_id: restaurant.id,
      user_id: userId,
      name: "E2E Test Menu",
      slug,
      status: "published",
      categories: [
        { id: "cat-1", name: "Starters", hidden: false },
        { id: "cat-2", name: "Mains", hidden: false },
      ],
      items: [
        { id: "item-1", name: "Samosa", price: 1500, description: "Crispy pastry", category: "cat-1", tags: ["vegetarian"], available: true },
        { id: "item-2", name: "Beef Burger", price: 4500, description: "Grilled beef patty", category: "cat-2", tags: [], available: true },
        { id: "item-3", name: "Lemonade", price: 2000, description: "Fresh lemon", category: "cat-1", tags: ["vegan"], available: true },
      ],
      style: {
        primaryColor: "#a04100",
        headlineFont: "Plus Jakarta Sans",
        bodyFont: "Inter",
        borderRadius: "1.5rem",
        layoutDensity: "comfortable",
        currency: "RWF",
      },
    })
    .select("id")
    .single();

  if (mErr || !menu) throw new Error(`Failed to create test menu: ${mErr?.message}`);

  return { restaurantId: restaurant.id, menuId: menu.id, slug };
}

export async function cleanupTestMenu(restaurantId: string): Promise<void> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await admin.from("menus").delete().eq("restaurant_id", restaurantId);
  await admin.from("restaurants").delete().eq("id", restaurantId);
}

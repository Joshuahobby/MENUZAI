import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TestMenu {
  restaurantId: string;
  menuId: string;
  slug: string;
}

export async function createTestMenu(): Promise<TestMenu> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const slug = `e2e-test-menu-${Date.now()}`;

  // Create a restaurant for the test
  const { data: restaurant, error: rErr } = await admin
    .from("restaurants")
    .insert({
      user_id: "00000000-0000-0000-0000-000000000000",
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
      user_id: "00000000-0000-0000-0000-000000000000",
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

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { allowed } = await checkRateLimit(`history:${getClientIp(req)}`, {
    id: "order_history",
    max: 10,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  let body: { ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ids } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validIds = ids.filter((id) => uuidRegex.test(id));

  if (validIds.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const { data: orders, error } = await admin
    .from("orders")
    .select("id, status, items, total, created_at, customer_name, table_number, source, restaurant_id")
    .in("id", validIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const restaurantIds = [...new Set(orders?.map((o) => o.restaurant_id).filter(Boolean) as string[])];

  const restaurants: Record<string, { name: string; logo_url: string | null; slug: string | null }> = {};
  if (restaurantIds.length > 0) {
    const { data: restaurantRows } = await admin
      .from("restaurants")
      .select("id, name, logo_url, slug")
      .in("id", restaurantIds);
    if (restaurantRows) {
      for (const r of restaurantRows) {
        restaurants[r.id] = { name: r.name, logo_url: r.logo_url, slug: r.slug };
      }
    }
  }

  return NextResponse.json({ orders, restaurants });
}

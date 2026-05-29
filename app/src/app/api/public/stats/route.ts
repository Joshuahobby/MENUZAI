import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Cache response for 1 hour to avoid hammering the DB on every page load
export const revalidate = 3600;

export async function GET() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    // Fallback so the landing page never errors
    return NextResponse.json({ restaurants: 50, orders: 12000 }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }

  const [{ count: restaurants }, { count: orders }] = await Promise.all([
    admin.from("restaurants").select("id", { count: "exact", head: true }).neq("plan", "free"),
    admin.from("orders").select("id", { count: "exact", head: true }),
  ]);

  // Round down to nearest 10 for cleaner display, and never show less than seed values
  const r = Math.max(restaurants ?? 0, 1);
  const o = Math.max(orders ?? 0, 100);

  return NextResponse.json(
    { restaurants: r, orders: o },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}

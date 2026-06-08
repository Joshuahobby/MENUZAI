import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

export interface TransactionRow {
  id: string;
  depositId: string;
  restaurantId: string;
  restaurantName: string | null;
  ownerEmail: string | null;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    const [{ data: txns }, { data: restaurants }, { data: { users } }] = await Promise.all([
      admin.from("transactions").select("*").order("created_at", { ascending: false }),
      admin.from("restaurants").select("id, name, user_id"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const restaurantMap = new Map<string, { name: string; userId: string }>();
    (restaurants ?? []).forEach(r => restaurantMap.set(r.id, { name: r.name, userId: r.user_id }));

    const userEmailMap = new Map<string, string>();
    (users ?? []).forEach(u => { if (u.email) userEmailMap.set(u.id, u.email); });

    const rows: TransactionRow[] = (txns ?? []).map(tx => {
      const rest = restaurantMap.get(tx.restaurant_id);
      return {
        id: tx.id,
        depositId: tx.deposit_id,
        restaurantId: tx.restaurant_id,
        restaurantName: rest?.name ?? null,
        ownerEmail: rest?.userId ? (userEmailMap.get(rest.userId) ?? null) : null,
        plan: tx.plan_name ?? "",
        amount: Number(tx.amount),
        currency: tx.currency ?? "RWF",
        status: tx.status ?? "pending",
        createdAt: tx.created_at,
      };
    });

    return NextResponse.json({ transactions: rows, total: rows.length });
  } catch (err) {
    console.error("admin/transactions error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Cancel a pending transaction
export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    const body = await req.json().catch(() => ({})) as { id?: string };
    if (!body.id) return NextResponse.json({ error: "Missing transaction id" }, { status: 400 });

    const { data: tx } = await admin
      .from("transactions")
      .select("id, status, restaurant_id, plan_name")
      .eq("id", body.id)
      .single();

    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (tx.status !== "pending") {
      return NextResponse.json({ error: `Cannot cancel a ${tx.status} transaction` }, { status: 400 });
    }

    const { error } = await admin
      .from("transactions")
      .update({ status: "failed" })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin/transactions PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

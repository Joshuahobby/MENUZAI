import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { allowed } = await checkRateLimit(`cancel:${getClientIp(req)}`, {
    id: "order_cancel",
    max: 5,
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

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orderId } = body;
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const { data: order, error: fetchErr } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "cancelled") {
    return NextResponse.json({ message: "Order already cancelled" }, { status: 200 });
  }

  if (order.status !== "pending" && order.status !== "pending_payment") {
    return NextResponse.json({ error: "Order can no longer be cancelled" }, { status: 422 });
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

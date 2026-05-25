import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function getWebPushConfig() {
  // NEXT_PUBLIC_ prefix is intentional — the same key is needed on both client and server
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_CONTACT_EMAIL;
  if (!publicKey || !privateKey || !contact) return null;
  return { publicKey, privateKey, contact };
}

export async function POST(req: Request) {
  try {
    const vapid = getWebPushConfig();
    if (!vapid) {
      return NextResponse.json({ sent: 0, reason: "VAPID keys not configured" });
    }

    webpush.setVapidDetails(`mailto:${vapid.contact}`, vapid.publicKey, vapid.privateKey);

    const { restaurantId, title, body, url } = await req.json();
    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Configuration missing" }, { status: 500 });

    const { data: subscriptions } = await admin
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("restaurant_id", restaurantId);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({ title, body, url: url ?? "/dashboard/orders" });
    const staleIds: string[] = [];

    const results = await Promise.allSettled(
      subscriptions.map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription as webpush.PushSubscription, payload);
        } catch (err: unknown) {
          // 410 Gone = subscription expired, remove it
          if (err instanceof Error && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
            staleIds.push(row.id);
          }
          throw err;
        }
      })
    );

    if (staleIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", staleIds);
    }

    const sent = results.filter(r => r.status === "fulfilled").length;
    return NextResponse.json({ sent });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

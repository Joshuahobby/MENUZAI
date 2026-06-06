import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";


// GET: List all staff for a restaurant
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is owner or manager
    const { data: staffData, error: staffError } = await supabase
      .from("restaurant_staff")
      .select("role")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .single();

    if (staffError || !staffData || (staffData.role !== 'owner' && staffData.role !== 'manager')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Get all staff for this restaurant
    const { data: allStaff, error: allStaffError } = await adminClient
      .from("restaurant_staff")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: true });

    if (allStaffError) {
      return NextResponse.json({ error: allStaffError.message }, { status: 500 });
    }

    // Fetch each user's email in parallel rather than loading all workspace users
    const staffWithEmails = await Promise.all(
      allStaff.map(async (staff) => {
        const { data } = await adminClient.auth.admin.getUserById(staff.user_id);
        return { ...staff, email: data.user?.email ?? "Unknown" };
      })
    );

    return NextResponse.json({ staff: staffWithEmails });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Add a new staff member
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId, email, role } = await req.json();

    if (!email || !role || !restaurantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Only owners can add staff
    const { data: staffData, error: staffError } = await supabase
      .from("restaurant_staff")
      .select("role")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .single();

    if (staffError || !staffData || staffData.role !== 'owner') {
      return NextResponse.json({ error: "Forbidden: Only owners can add staff" }, { status: 403 });
    }

    const adminClient = getSupabaseAdmin();
    if (!adminClient) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });

    // Plan gate: staff management is Pro-only
    const { data: restaurant } = await adminClient
      .from("restaurants")
      .select("plan")
      .eq("id", restaurantId)
      .single();

    if (!restaurant || restaurant.plan === "free") {
      return NextResponse.json(
        { error: "Staff management requires a Pro plan. Upgrade in Settings to unlock." },
        { status: 402 }
      );
    }

    // Attempt to invite the user. If they already exist, this sends an invite magic link
    // and returns their existing user object safely.
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const targetUserId = inviteData.user.id;

    // Check if they are already in the staff list
    const { data: existingStaff } = await adminClient
      .from("restaurant_staff")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", targetUserId)
      .single();

    if (existingStaff) {
      return NextResponse.json({ error: "User is already staff for this restaurant." }, { status: 400 });
    }

    // Add them to restaurant_staff
    const { error: insertError } = await adminClient
      .from("restaurant_staff")
      .insert({
        restaurant_id: restaurantId,
        user_id: targetUserId,
        role: role
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Send branded welcome email to the new staff member
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuzaai.com";
    const resendKey = process.env.RESEND_API_KEY;
    const { data: restaurantData } = await adminClient
      .from("restaurants")
      .select("name")
      .eq("id", restaurantId)
      .single();
    const restaurantDisplayName = restaurantData?.name ?? "your restaurant";
    const roleLabel = (role as string).charAt(0).toUpperCase() + (role as string).slice(1);

    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: `MENUZA AI <${process.env.RESEND_FROM_EMAIL ?? "hello@menuzaai.com"}>`,
          to: [email],
          subject: `You've been added to ${restaurantDisplayName} on MENUZA AI`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
              <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
                <h1 style="color:white;margin:0;font-size:20px">Welcome to ${restaurantDisplayName}</h1>
              </div>
              <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
                <p style="font-size:16px">Hi there,</p>
                <p>You've been added as a <strong>${roleLabel}</strong> at <strong>${restaurantDisplayName}</strong> on MENUZA AI.</p>
                <p>MENUZA AI is the restaurant's digital menu and ordering platform. As ${roleLabel === "Staff" ? "a staff member" : `a ${roleLabel.toLowerCase()}`}, you can:</p>
                <ul style="line-height:2.2">
                  ${roleLabel === "Staff"
                    ? "<li>Monitor incoming orders in real-time</li><li>Manage table requests</li><li>Update order status</li>"
                    : "<li>Monitor and manage all orders</li><li>View analytics and reports</li><li>Manage menu items and categories</li><li>Manage staff members</li>"}
                </ul>
                <a href="${siteUrl}/dashboard/orders" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#FF6B00;color:white;font-weight:bold;border-radius:12px;text-decoration:none">
                  Open Orders Dashboard
                </a>
                <p style="font-size:13px;color:#555;margin-top:24px">If you don't have an account yet, check your inbox for a separate sign-up link from MENUZA AI.</p>
                <p style="font-size:12px;color:#888;margin-top:16px">Sent by MENUZA AI on behalf of ${restaurantDisplayName}</p>
              </div>
            </div>`,
        }),
      }).catch((e) => console.error("Staff invite email failed:", e));
    }

    return NextResponse.json({ success: true, message: "Staff added successfully." });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Remove a staff member
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const targetUserId = searchParams.get("userId");

    if (!restaurantId || !targetUserId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id === targetUserId) {
      return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
    }

    const { data: staffData, error: staffError } = await supabase
      .from("restaurant_staff")
      .select("role")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .single();

    if (staffError || !staffData || staffData.role !== 'owner') {
      return NextResponse.json({ error: "Forbidden: Only owners can remove staff" }, { status: 403 });
    }

    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const { error: deleteError } = await adminClient
      .from("restaurant_staff")
      .delete()
      .eq("restaurant_id", restaurantId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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

    // Get all users to map emails
    // Note: For large projects, this should be an RPC function inside Supabase
    const { data: authUsers, error: usersError } = await adminClient.auth.admin.listUsers();
    
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const staffWithEmails = allStaff.map(staff => {
      const authUser = authUsers.users.find(u => u.id === staff.user_id);
      return {
        ...staff,
        email: authUser?.email || "Unknown",
      };
    });

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

    // Only owners can add staff (or managers, depending on exact logic. Let's restrict to owner for now)
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
    if (!adminClient) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
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

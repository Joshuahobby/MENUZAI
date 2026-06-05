import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden: Platform Admin only" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    const { data, error } = await admin
      .from("platform_settings")
      .select("*")
      .eq("id", "global")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found, which is fine, we just return default
      throw error;
    }

    return NextResponse.json({
      provider: data?.ai_provider || "openrouter",
      model: data?.ai_model || "meta-llama/llama-3.2-11b-vision-instruct:free",
      updated_at: data?.updated_at || null,
    });
  } catch (err) {
    console.warn("Failed to fetch platform_settings (table might not exist yet):", err);
    return NextResponse.json({ provider: "openrouter", model: "meta-llama/llama-3.2-11b-vision-instruct:free" });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden: Platform Admin only" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    const { provider, model } = await req.json();

    if (!["openrouter", "anthropic"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // Read current config for audit log old_value
    const { data: current } = await admin
      .from("platform_settings")
      .select("ai_provider, ai_model")
      .eq("id", "global")
      .single();

    const savedAt = new Date().toISOString();
    const { error } = await admin
      .from("platform_settings")
      .upsert(
        { id: "global", ai_provider: provider, ai_model: model, updated_at: savedAt },
        { onConflict: "id" }
      );

    if (error) throw error;

    // Write audit log (non-blocking)
    void Promise.resolve(
      admin.from("admin_audit_log").insert({
        action: "ai_config_change",
        performed_by: user.email!,
        target_type: "platform",
        old_value: { provider: current?.ai_provider ?? null, model: current?.ai_model ?? null },
        new_value: { provider, model },
      })
    ).catch((e: unknown) => console.warn("audit log insert failed", e));

    return NextResponse.json({ success: true, provider, model, updated_at: savedAt });
  } catch (err: unknown) {
    console.error("Failed to update platform_settings:", err);
    return NextResponse.json({ 
      error: "Failed to update settings. Please ensure the platform_settings table exists.",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}


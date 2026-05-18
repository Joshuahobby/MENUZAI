import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
  }

  try {
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
    });
  } catch (err) {
    console.warn("Failed to fetch platform_settings (table might not exist yet):", err);
    return NextResponse.json({ provider: "openrouter", model: "meta-llama/llama-3.2-11b-vision-instruct:free" });
  }
}

export async function POST(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
  }

  try {
    const { provider, model } = await req.json();

    if (!["openrouter", "anthropic"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const { error } = await admin
      .from("platform_settings")
      .upsert(
        { id: "global", ai_provider: provider, ai_model: model, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, provider, model });
  } catch (err: unknown) {
    console.error("Failed to update platform_settings:", err);
    return NextResponse.json({ 
      error: "Failed to update settings. Please ensure the platform_settings table exists.",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

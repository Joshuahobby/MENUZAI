import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

const JOBS = [
  { name: "expire-transactions",  schedule: "Daily 02:00 UTC" },
  { name: "expire-subscriptions", schedule: "Daily 03:00 UTC" },
  { name: "remind-subscriptions", schedule: "Daily 09:00 UTC" },
];

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    const results = await Promise.all(
      JOBS.map(async (job) => {
        const { data } = await admin
          .from("cron_execution_logs")
          .select("started_at, completed_at, status, rows_affected, error_message")
          .eq("job_name", job.name)
          .order("started_at", { ascending: false })
          .limit(1)
          .single();

        return {
          jobName: job.name,
          schedule: job.schedule,
          lastRun: data?.started_at ?? null,
          completedAt: data?.completed_at ?? null,
          status: (data?.status ?? "never") as "success" | "error" | "running" | "never",
          rowsAffected: data?.rows_affected ?? 0,
          errorMessage: data?.error_message ?? null,
        };
      })
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error("admin/cron-status error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

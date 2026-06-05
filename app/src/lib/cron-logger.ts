import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Fails silently throughout — cron routes must never break due to logging failures.

export async function startCronRun(jobName: string): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data } = await admin
      .from("cron_execution_logs")
      .insert({ job_name: jobName, status: "running" })
      .select("id")
      .single();
    return data?.id ?? null;
  } catch (e) {
    console.warn(`cron-logger: failed to start log for "${jobName}"`, e);
    return null;
  }
}

export async function completeCronRun(
  id: string | null,
  rowsAffected: number,
  details: object = {}
): Promise<void> {
  if (!id) return;
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin
      .from("cron_execution_logs")
      .update({ status: "success", completed_at: new Date().toISOString(), rows_affected: rowsAffected, details })
      .eq("id", id);
  } catch (e) {
    console.warn(`cron-logger: failed to complete log "${id}"`, e);
  }
}

export async function failCronRun(id: string | null, error: string): Promise<void> {
  if (!id) return;
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin
      .from("cron_execution_logs")
      .update({ status: "error", completed_at: new Date().toISOString(), error_message: error })
      .eq("id", id);
  } catch (e) {
    console.warn(`cron-logger: failed to record error for log "${id}"`, e);
  }
}

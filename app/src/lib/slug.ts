import { supabase } from "./supabase";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "menu";
}

export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("menus")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (!data) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

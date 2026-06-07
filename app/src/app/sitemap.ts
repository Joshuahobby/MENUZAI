import { MetadataRoute } from "next";
import { getSupabasePublicClient } from "@/lib/supabase-public";

export const revalidate = 3600; // regenerate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://menuzaai.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl,                  lastModified: new Date(), changeFrequency: "weekly",  priority: 1   },
    { url: `${baseUrl}/features`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/pricing`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/demo`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/terms`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/privacy`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  try {
    const supabase = getSupabasePublicClient();
    const { data: menus } = await supabase
      .from("menus")
      .select("slug, updated_at")
      .eq("status", "published")
      .not("slug", "is", null);

    const menuRoutes: MetadataRoute.Sitemap = (menus ?? []).map((m: { slug: string; updated_at: string | null }) => ({
      url: `${baseUrl}/menu/${m.slug}`,
      lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...menuRoutes];
  } catch {
    return staticRoutes;
  }
}

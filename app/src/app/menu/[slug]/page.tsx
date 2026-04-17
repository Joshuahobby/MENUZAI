import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicMenuClient from "./PublicMenuClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: menu } = await supabase
    .from("menus")
    .select("name, restaurants!inner(name, tagline)")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (!menu) return { title: "Menu Not Found" };

  const restaurant = Array.isArray(menu.restaurants) ? menu.restaurants[0] : menu.restaurants;

  return {
    title: `${restaurant?.name ?? "Menu"} | MENUZA AI`,
    description: restaurant?.tagline ?? `View the menu for ${restaurant?.name} and order via WhatsApp.`,
    openGraph: {
      title: `${restaurant?.name} — Digital Menu`,
      description: `Browse ${menu.name} and order directly via WhatsApp.`,
      type: "website",
    },
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: menu } = await supabase
    .from("menus")
    .select("id, name, slug, categories, items, style, view_count, restaurant_id, restaurants!inner(name, phone, tagline, logo_url)")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (!menu) notFound();

  const restaurant = Array.isArray(menu.restaurants) ? menu.restaurants[0] : menu.restaurants;

  // Increment view count (fire and forget)
  supabase
    .from("menus")
    .update({ view_count: (menu.view_count ?? 0) + 1 })
    .eq("id", menu.id)
    .then(() => {});

  return (
    <PublicMenuClient
      menuId={menu.id}
      restaurantId={menu.restaurant_id}
      restaurantName={restaurant?.name ?? "Restaurant"}
      restaurantPhone={restaurant?.phone ?? ""}
      restaurantLogoUrl={(restaurant as { logo_url?: string })?.logo_url ?? ""}
      slug={slug}
      categories={menu.categories ?? []}
      items={menu.items ?? []}
      style={menu.style ?? {}}
    />
  );
}

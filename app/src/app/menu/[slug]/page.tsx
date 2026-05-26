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
    .select("name, items, restaurants!inner(name, tagline)")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (!menu) return { title: "Menu Not Found" };

  const restaurant = Array.isArray(menu.restaurants) ? menu.restaurants[0] : menu.restaurants;
  const items = (menu.items ?? []) as { image?: string }[];
  const ogImage = items.find((i) => i.image)?.image;

  const title = `${restaurant?.name ?? "Menu"} | MENUZA AI`;
  const description = restaurant?.tagline
    ? `${restaurant.tagline} — Browse ${menu.name} and order via WhatsApp.`
    : `Browse the menu for ${restaurant?.name ?? "this restaurant"} and order directly via WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title: `${restaurant?.name} — Digital Menu`,
      description,
      type: "website",
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: restaurant?.name ?? "Menu" }] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: menu } = await supabase
    .from("menus")
    .select("id, name, slug, categories, items, style, view_count, restaurant_id, restaurants!inner(name, phone, tagline, logo_url, plan)")
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
      restaurantPlan={(restaurant as { plan?: string })?.plan ?? "free"}
      slug={slug}
      categories={menu.categories ?? []}
      items={menu.items ?? []}
      style={menu.style ?? {}}
    />
  );
}

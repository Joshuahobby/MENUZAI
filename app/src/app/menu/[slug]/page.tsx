import { cache } from "react";
import { getSupabasePublicClient } from "@/lib/supabase-public";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import PublicMenuClient from "./PublicMenuClient";
import { showBranding } from "@/lib/plans";
import type { MenuItem } from "@/types/menu";

const fetchPublicMenu = cache(async (slug: string) => {
  const supabase = getSupabasePublicClient();
  const { data } = await supabase
    .from("menus")
    .select("id, name, slug, categories, items, style, view_count, restaurant_id, restaurants!inner(name, phone, tagline, logo_url, plan, trial_ends_at, payments_enabled)")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();
  return data;
});

// Re-render at most every 60 seconds — menu content rarely changes mid-service.
// View count increments fire on each regeneration only (approximate, intentional).
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await fetchPublicMenu(slug);

  if (!menu) return { title: "Menu Not Found" };

  const restaurant = Array.isArray(menu.restaurants) ? menu.restaurants[0] : menu.restaurants;
  const safeMenuItems = Array.isArray(menu.items) ? menu.items : [];
  const items = safeMenuItems as { image?: string }[];
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
  const menu = await fetchPublicMenu(slug);

  if (!menu) notFound();

  const restaurant = Array.isArray(menu.restaurants) ? menu.restaurants[0] : menu.restaurants;
  const plan = (restaurant as { plan?: string })?.plan ?? "free";
  const trialEndsAt = (restaurant as { trial_ends_at?: string | null })?.trial_ends_at ?? null;
  const branded = showBranding(plan, trialEndsAt);
  const aiWaiterEnabled = plan !== "free" || (trialEndsAt != null && new Date(trialEndsAt) > new Date());

  // Increment view count (fire and forget)
  getSupabasePublicClient()
    .from("menus")
    .update({ view_count: (menu.view_count ?? 0) + 1 })
    .eq("id", menu.id)
    .then(() => {});

  const safeCategories = Array.isArray(menu.categories) ? menu.categories as { id: string; name: string; hidden?: boolean; items?: string[] }[] : [];
  const safeItems = Array.isArray(menu.items) ? menu.items as MenuItem[] : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant?.name ?? "Restaurant",
    ...(restaurant?.tagline ? { description: restaurant.tagline } : {}),
    ...(restaurant?.phone ? { telephone: restaurant.phone } : {}),
    hasMenu: {
      "@type": "Menu",
      name: menu.name,
      hasMenuSection: safeCategories.filter(c => !c.hidden).map(cat => ({
        "@type": "MenuSection",
        name: cat.name,
        hasMenuItem: safeItems
          .filter(i => i.category === cat.id && i.available !== false)
          .map(item => ({
            "@type": "MenuItem",
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
            offers: {
              "@type": "Offer",
              price: item.price,
              priceCurrency: (menu.style as { currency?: string })?.currency ?? "RWF",
            },
            ...(item.image ? { image: item.image } : {}),
            ...(item.tags && item.tags.length > 0
              ? { suitableForDiet: item.tags.filter(t => ["vegan", "vegetarian", "gluten-free", "halal"].includes(t)).map(t => `https://schema.org/${t === "gluten-free" ? "GlutenFreeDiet" : t.charAt(0).toUpperCase() + t.slice(1) + "Diet"}`) }
              : {}),
          })),
      })),
    },
  };

  return (
    <section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-surface" />}>
        <PublicMenuClient
          menuId={menu.id}
          restaurantId={menu.restaurant_id}
          restaurantName={restaurant?.name ?? "Restaurant"}
          restaurantPhone={restaurant?.phone ?? ""}
          restaurantLogoUrl={(restaurant as { logo_url?: string })?.logo_url ?? ""}
          aiWaiterEnabled={aiWaiterEnabled}
          paymentsEnabled={(restaurant as { payments_enabled?: boolean })?.payments_enabled ?? false}
          branded={branded}
          slug={slug}
          categories={safeCategories}
          items={safeItems}
          style={menu.style ?? {}}
        />
      </Suspense>
    </section>
  );
}

import { notFound } from "next/navigation";
import { getSupabasePublicClient } from "@/lib/supabase-public";
import OrderHistory from "./OrderHistory";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HistoryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getSupabasePublicClient();

  const { data: menu } = await supabase
    .from("menus")
    .select("restaurant_id, style")
    .eq("slug", slug)
    .single();

  if (!menu) notFound();

  const currency = (menu.style as { currency?: string } | null)?.currency ?? "RWF";

  return <OrderHistory restaurantId={menu.restaurant_id} currency={currency} />;
}

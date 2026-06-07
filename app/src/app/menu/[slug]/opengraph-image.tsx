import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Restaurant Menu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  let restaurantName = "Restaurant Menu";
  let tagline = "";
  let itemCount = 0;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const slug = encodeURIComponent(params.slug);

    const res = await fetch(
      `${supabaseUrl}/rest/v1/menus?select=restaurant:restaurants(name,tagline),categories&slug=eq.${slug}&status=eq.published&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );

    if (res.ok) {
      const rows = await res.json() as Array<{
        restaurant?: { name?: string; tagline?: string } | null;
        categories?: Array<{ items?: unknown[] }>;
      }>;
      const row = rows?.[0];
      if (row?.restaurant?.name) restaurantName = row.restaurant.name;
      if (row?.restaurant?.tagline) tagline = row.restaurant.tagline;
      if (row?.categories) {
        itemCount = row.categories.reduce((n, c) => n + (c.items?.length ?? 0), 0);
      }
    }
  } catch {
    // fall through to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg, #0f0e0d 0%, #1a1714 60%, #0f0e0d 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(160,65,0,0.22) 0%, transparent 70%)",
          top: -250, right: -100,
        }} />
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 70%)",
          bottom: -200, left: -80,
        }} />

        {/* Content */}
        <div style={{
          display: "flex", flexDirection: "column",
          flex: 1, padding: "64px 80px", justifyContent: "space-between",
        }}>
          {/* Top: branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: "#a04100",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>
              🍽️
            </div>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 18, fontWeight: 700, letterSpacing: "0.05em" }}>
              MENUZA AI
            </span>
          </div>

          {/* Middle: restaurant name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.25)",
              borderRadius: 999, padding: "6px 16px", width: "fit-content",
            }}>
              <span style={{ color: "#FF6B00", fontSize: 14, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Digital Menu
              </span>
            </div>
            <div style={{
              color: "#ffffff", fontSize: restaurantName.length > 24 ? 56 : 68,
              fontWeight: 900, lineHeight: 1.05, letterSpacing: "-2px",
            }}>
              {restaurantName}
            </div>
            {tagline && (
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 24, fontWeight: 500 }}>
                {tagline}
              </div>
            )}
          </div>

          {/* Bottom: meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {itemCount > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "10px 20px", color: "rgba(255,255,255,0.7)",
                fontSize: 16, fontWeight: 600,
              }}>
                {itemCount} items on the menu
              </div>
            )}
            <div style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "10px 20px", color: "rgba(255,255,255,0.7)",
              fontSize: 16, fontWeight: 600,
            }}>
              Order via QR · WhatsApp · AI Waiter
            </div>
          </div>
        </div>

        {/* Right side accent bar */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 8,
          background: "linear-gradient(to bottom, #FF6B00, #a04100)",
        }} />
      </div>
    ),
    { ...size }
  );
}

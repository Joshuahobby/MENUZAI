// Currencies where cents are not used — display as rounded integers
const WHOLE_UNIT_CURRENCIES = new Set(["RWF", "UGX", "TZS", "BIF", "GNF", "KMF", "MGA", "JPY", "KRW", "VND", "IDR", "CLP"]);

export function formatPrice(amount: number, currency: string): string {
  const whole = WHOLE_UNIT_CURRENCIES.has(currency.toUpperCase());
  const num = whole
    ? Math.round(amount).toLocaleString()
    : amount.toFixed(2);
  return `${currency} ${num}`;
}

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatTimeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatEventType(type: string) {
  switch (type) {
    case "menu_view": return "viewed menu";
    case "item_view": return "viewed item";
    case "order_sent": return "placed an order";
    case "qr_scan": return "scanned QR code";
    default: return type;
  }
}

/**
 * Returns an optimized image URL for mobile-first delivery.
 *
 * - Supabase Storage URLs get WebP transform params via the built-in image transform API.
 * - Unsplash URLs get their own format/quality params.
 * - Other URLs are returned as-is.
 *
 * @param url    Raw image URL
 * @param width  Target display width in px (default: 600)
 */
export function getOptimizedImageUrl(url: string | null | undefined, width = 600): string {
  if (!url) return "";

  // Supabase Storage — e.g. https://<project>.supabase.co/storage/v1/object/public/...
  if (url.includes("supabase.co/storage")) {
    // Supabase image transform endpoint
    const transformBase = url.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    const sep = transformBase.includes("?") ? "&" : "?";
    return `${transformBase}${sep}width=${width}&quality=75&format=webp`;
  }

  // Unsplash CDN
  if (url.includes("images.unsplash.com")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}w=${width}&q=75&fm=webp&fit=crop`;
  }

  return url;
}

/**
 * Checks if a user's email belongs to a Platform Admin.
 * Uses the NEXT_PUBLIC_ADMIN_EMAILS environment variable, falling back to a safe default list.
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmailsStr = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@menuzai.com";
  const adminEmails = adminEmailsStr.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}
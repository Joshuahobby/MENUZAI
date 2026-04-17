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
    default: return type;
  }
}
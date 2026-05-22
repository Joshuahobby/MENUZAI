import { supabase } from "./supabase";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("menuzai_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("menuzai_session", id);
  }
  return id;
}

export function trackMenuView(menuId: string, restaurantId: string) {
  supabase.from("analytics_events").insert({
    menu_id: menuId,
    restaurant_id: restaurantId,
    event_type: "menu_view",
    session_id: getSessionId(),
  }).then(() => {});
}

export function trackItemView(menuId: string, restaurantId: string, itemId: string, itemName: string) {
  supabase.from("analytics_events").insert({
    menu_id: menuId,
    restaurant_id: restaurantId,
    event_type: "item_view",
    item_id: itemId,
    item_name: itemName,
    session_id: getSessionId(),
  }).then(() => {});
}

export function trackOrderClick(menuId: string, restaurantId: string, total: number) {
  supabase.from("analytics_events").insert({
    menu_id: menuId,
    restaurant_id: restaurantId,
    event_type: "order_sent",
    amount: total,
    session_id: getSessionId(),
  }).then(() => {});
}
export function trackQRScan(menuId: string, restaurantId: string) {
  supabase.from("analytics_events").insert({
    menu_id: menuId,
    restaurant_id: restaurantId,
    event_type: "qr_scan",
    session_id: getSessionId(),
  }).then(() => {});
}

export function trackAddToCart(menuId: string, restaurantId: string, itemId: string, itemName: string, price: number) {
  supabase.from("analytics_events").insert({
    menu_id: menuId,
    restaurant_id: restaurantId,
    event_type: "add_to_cart",
    item_id: itemId,
    item_name: itemName,
    amount: price,
    session_id: getSessionId(),
  }).then(() => {});
}

export function trackCartAbandon(menuId: string, restaurantId: string, itemCount: number) {
  supabase.from("analytics_events").insert({
    menu_id: menuId,
    restaurant_id: restaurantId,
    event_type: "cart_abandon",
    amount: itemCount,
    session_id: getSessionId(),
  }).then(() => {});
}

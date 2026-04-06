import type { CartItem } from "@/types/menu";

export type { CartItem };

export function buildWhatsAppMessage(items: CartItem[], customerName?: string, tableNumber?: string): string {
  let message = "Hello, I'd like to order:\n\n";

  items.forEach((item) => {
    message += `• ${item.name} x${item.quantity} — $${(item.price * item.quantity).toFixed(2)}\n`;
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  message += `\n💰 Total: $${total.toFixed(2)}`;

  if (customerName) {
    message += `\n👤 Name: ${customerName}`;
  }
  if (tableNumber) {
    message += `\n🪑 Table: ${tableNumber}`;
  }

  return message;
}

export function buildWhatsAppURL(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encoded}`;
}

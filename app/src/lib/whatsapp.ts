import type { CartItem } from "@/types/menu";

export type { CartItem };

export function buildWhatsAppMessage(items: CartItem[], customerName?: string, tableNumber?: string, currency: string = "RWF", note?: string): string {
  let message = "Hello, I'd like to order:\n\n";

  items.forEach((item) => {
    message += `• ${item.name} x${item.quantity} — ${currency} ${(item.price * item.quantity).toLocaleString()}\n`;
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  message += `\n💰 Total: ${currency} ${total.toLocaleString()}`;

  if (tableNumber) {
    message += `\n🪑 Table: ${tableNumber}`;
  }
  if (customerName) {
    message += `\n👤 Name: ${customerName}`;
  }
  if (note?.trim()) {
    message += `\n📝 Note: ${note.trim()}`;
  }

  return message;
}

export function buildWhatsAppURL(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encoded}`;
}

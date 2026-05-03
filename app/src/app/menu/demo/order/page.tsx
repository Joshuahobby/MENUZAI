"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buildWhatsAppMessage, buildWhatsAppURL, CartItem } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import { restaurant } from "@/data/mockData";

function OrderContent() {
  const searchParams = useSearchParams();
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  let items: CartItem[] = [];
  let currency = "RWF";
  try {
    const raw = searchParams.get("items");
    if (raw) items = JSON.parse(decodeURIComponent(raw));
    const rawCurrency = searchParams.get("currency");
    if (rawCurrency) currency = rawCurrency;
  } catch { /* fallback */ }

  if (items.length === 0) {
    items = [
      { id: "3", name: "The Menuza Royale", price: 18.5, quantity: 2, description: "", category: "specials", image: "", tags: [] },
      { id: "7", name: "Summer Spritz", price: 12.0, quantity: 1, description: "", category: "drinks", image: "", tags: [] },
    ];
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const message = buildWhatsAppMessage(items, customerName, tableNumber, currency);
  const whatsappUrl = buildWhatsAppURL(restaurant.phone, message);

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32">
      <header className="w-full sticky top-0 z-50 bg-surface/95 backdrop-blur-xl flex items-center px-6 h-16 gap-4">
        <Link href="/menu/demo" className="material-symbols-outlined text-secondary hover:text-primary transition-colors">arrow_back</Link>
        <h1 className="font-[var(--font-headline)] font-bold text-lg">Order Summary</h1>
      </header>

      <main className="px-6 py-8 max-w-lg mx-auto space-y-8">
        {/* Items List */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-container/50">
          <h3 className="font-[var(--font-headline)] font-bold mb-4">Your Order</h3>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-xs text-secondary">x{item.quantity}</p>
                </div>
                <span className="font-[var(--font-headline)] font-bold text-primary">{formatPrice(item.price * item.quantity, currency)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-surface-container flex justify-between items-center">
            <span className="font-[var(--font-headline)] font-bold text-lg">Total</span>
            <span className="font-[var(--font-headline)] font-extrabold text-2xl text-primary">{formatPrice(total, currency)}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-container/50 space-y-4">
          <h3 className="font-[var(--font-headline)] font-bold mb-2">Your Details (Optional)</h3>
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block">Name</label>
            <input className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block">Table Number</label>
            <input className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Table 5" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
          </div>
        </div>

        {/* WhatsApp Message Preview */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-container/50">
          <h3 className="font-[var(--font-headline)] font-bold mb-3">WhatsApp Message Preview</h3>
          <div className="bg-surface-container-low rounded-2xl p-4 text-sm whitespace-pre-wrap text-on-surface-variant">
            {message}
          </div>
        </div>
      </main>

      {/* WhatsApp CTA */}
      <div className="fixed bottom-0 left-0 w-full p-6 z-50">
        <div className="max-w-md mx-auto">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="w-full h-16 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-full flex items-center justify-center gap-3 shadow-[0_12px_40px_rgba(37,211,102,0.4)] active:scale-95 transition-all">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span className="font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm">Order via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><p>Loading...</p></div>}>
      <OrderContent />
    </Suspense>
  );
}

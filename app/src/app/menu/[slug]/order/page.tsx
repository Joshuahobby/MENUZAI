"use client";

import { useState, Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buildWhatsAppMessage, buildWhatsAppURL } from "@/lib/whatsapp";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

function OrderContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  // const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [tableNumber, setTableNumber] = useState(
    searchParams.get("table") ? `Table ${searchParams.get("table")}` : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Review states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const menuId = searchParams.get("menuId") || null;
  const restaurantId = searchParams.get("restaurantId") || null;
  const phone = searchParams.get("phone") || "";
  const currency = searchParams.get("currency") || "RWF";

  const { items, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "momo">("whatsapp");

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const message = buildWhatsAppMessage(items, customerName, tableNumber, currency);
  const whatsappUrl = buildWhatsAppURL(phone, message);

  const handlePlaceOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!restaurantId || items.length === 0) return;

    setIsSubmitting(true);

    // C6: Check DB insert error before opening WhatsApp
    const { error } = await supabase.from("orders").insert({
      menu_id: menuId,
      restaurant_id: restaurantId,
      items: items,
      total: total,
      customer_name: customerName || null,
      table_number: tableNumber || null,
      whatsapp_sent: true,
      status: "pending"
    });

    if (error) {
      toast.error("Failed to record order. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Fire-and-forget email notification
    fetch("/api/notifications/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, items, total, currency, customerName, customerEmail, tableNumber }),
    }).catch(() => {/* non-critical */});

    setIsSubmitting(false);
    setOrderPlaced(true);
    clearCart(); // Clear the cart after successful order!

    // Open WhatsApp
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmittingReview = async () => {
    if (rating === 0 || !restaurantId) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          rating,
          customerName: customerName || "Guest",
          comment: reviewComment,
          orderId: null,
        }),
      });
      if (res.ok) {
        setReviewSubmitted(true);
        toast.success("Thank you for your feedback! ❤️");
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch {
      toast.error("An error occurred while submitting feedback.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // H6: Order confirmation screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center py-10 px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-tertiary/10 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-tertiary text-4xl icon-fill">check_circle</span>
          </div>
          <div>
            <h1 className="font-[var(--font-headline)] font-extrabold text-2xl">Order Sent!</h1>
            <p className="text-secondary text-xs leading-relaxed mt-1">
              Your order has been sent to the restaurant via WhatsApp. They will confirm it shortly.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-container/50 text-left space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="font-medium">{item.name} <span className="text-secondary">x{item.quantity}</span></span>
                <span className="font-bold text-primary">{formatPrice(item.price * item.quantity, currency)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-surface-container flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total, currency)}</span>
            </div>
          </div>

          {/* Rate your experience interactive container */}
          <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-container/50 text-left space-y-4 shadow-sm">
            <h3 className="font-[var(--font-headline)] font-black text-center text-sm tracking-tight">Rate your dining experience!</h3>
            {reviewSubmitted ? (
              <div className="text-center py-4 space-y-2 animate-fadeIn">
                <span className="material-symbols-outlined text-emerald-500 text-4xl block">celebration</span>
                <p className="text-sm font-bold text-emerald-600">Review Submitted!</p>
                <p className="text-xs text-secondary">Thank you! Your feedback helps us improve.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 5-Star Row */}
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`transition-all duration-150 transform hover:scale-125 focus:outline-none cursor-pointer border-none bg-transparent ${
                          isActive ? "text-amber-500" : "text-surface-container-highest dark:text-neutral-700"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[32px] icon-fill select-none">
                          star
                        </span>
                      </button>
                    );
                  })}
                </div>

                {rating > 0 && (
                  <div className="space-y-3 pt-2">
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Optional: Tell us what you liked or what we can improve..."
                      className="w-full bg-surface-container-low border-none rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-primary/20 resize-none h-20 outline-none text-on-surface"
                    />
                    <button
                      type="button"
                      onClick={handleSubmittingReview}
                      disabled={isSubmittingReview}
                      className="w-full py-3.5 bg-primary text-white font-[var(--font-headline)] font-bold rounded-2xl text-xs active:scale-95 transition-all disabled:opacity-50 border-none cursor-pointer hover:opacity-90"
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            href={`/menu/${slug}`}
            className="block w-full py-4 bg-surface-container-lowest border border-surface-container rounded-2xl font-bold text-sm hover:bg-surface-container-low transition-all text-on-surface"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32">
      <header className="w-full sticky top-0 z-50 bg-surface/95 backdrop-blur-xl flex items-center px-6 h-16 gap-4 border-b border-surface-container/30">
        <Link href={`/menu/${slug}`} className="material-symbols-outlined text-secondary hover:text-primary transition-colors">arrow_back</Link>
        <h1 className="font-[var(--font-headline)] font-bold text-lg">Checkout</h1>
      </header>

      <main className="px-6 py-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Details & Payment */}
        <div className="space-y-8">
          
          <div className="bg-surface-container-lowest rounded-[2rem] p-6 lg:p-8 border border-surface-container/50 shadow-sm space-y-4">
            <h3 className="font-[var(--font-headline)] font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
              Your Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-1 block pl-1">Name</label>
                <input className="w-full bg-surface-container-low border-none rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                  placeholder="Your full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-1 block pl-1">Email</label>
                <input type="email" className="w-full bg-surface-container-low border-none rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                  placeholder="For your receipt" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-1 block pl-1">Table Number</label>
                <input className="w-full bg-surface-container-low border-none rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                  placeholder="e.g. Table 5" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-6 lg:p-8 border border-surface-container/50 shadow-sm space-y-4">
            <h3 className="font-[var(--font-headline)] font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
              Payment Method
            </h3>
            
            <div className="space-y-3">
              <label className={`relative flex items-start p-4 cursor-pointer rounded-2xl border-2 transition-all ${paymentMethod === "whatsapp" ? "border-primary bg-primary/5" : "border-surface-container hover:border-primary/30"}`}>
                <div className="flex items-center h-5">
                  <input type="radio" name="payment" className="w-4 h-4 text-primary focus:ring-primary/20" checked={paymentMethod === "whatsapp"} onChange={() => setPaymentMethod("whatsapp")} />
                </div>
                <div className="ml-3 flex-1">
                  <span className="block text-sm font-bold text-on-surface">Pay at Restaurant / Cash</span>
                  <span className="block text-xs text-secondary mt-0.5">Send order via WhatsApp and pay the waiter.</span>
                </div>
                <span className="material-symbols-outlined text-whatsapp text-2xl ml-2">chat</span>
              </label>

              <label className={`relative flex items-start p-4 cursor-not-allowed rounded-2xl border-2 transition-all opacity-60 bg-surface-container-low border-surface-container`}>
                <div className="flex items-center h-5">
                  <input type="radio" name="payment" className="w-4 h-4" disabled />
                </div>
                <div className="ml-3 flex-1">
                  <span className="block text-sm font-bold text-on-surface flex items-center gap-2">
                    Mobile Money (MTN/Airtel) 
                    <span className="bg-tertiary/20 text-tertiary text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Coming Soon</span>
                  </span>
                  <span className="block text-xs text-secondary mt-0.5">Pay online instantly from your phone.</span>
                </div>
                <span className="material-symbols-outlined text-secondary text-2xl ml-2">phone_iphone</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-[2rem] p-6 lg:p-8 border border-surface-container/50 shadow-sm sticky top-24">
            <h3 className="font-[var(--font-headline)] font-bold mb-6">Order Summary</h3>
            
            {items.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-secondary opacity-30 mb-2">shopping_bag</span>
                <p className="text-secondary text-sm">Your cart is empty.</p>
                <Link href={`/menu/${slug}`} className="text-primary font-bold inline-block mt-2">Go back to menu</Link>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {item.image ? (
                        <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-secondary/50">restaurant</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-[10px] text-secondary font-bold mb-1">Qty: {item.quantity}</p>
                        <p className="font-[var(--font-headline)] font-bold text-primary">{formatPrice(item.price * item.quantity, currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-surface-container">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-[var(--font-headline)] font-bold text-lg text-secondary">Total</span>
                    <span className="font-[var(--font-headline)] font-extrabold text-3xl text-primary">{formatPrice(total, currency)}</span>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || paymentMethod !== "whatsapp"}
                    className="w-full h-14 bg-[var(--primary-color)] hover:opacity-90 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined">send</span>
                    <span className="font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm">
                      {isSubmitting ? "Processing..." : "Complete Order"}
                    </span>
                  </button>
                  <p className="text-[10px] text-center text-secondary mt-3">You will be redirected to WhatsApp to confirm your order.</p>
                </div>
              </>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><p>Loading...</p></div>}>
      <OrderContent slug={slug} />
    </Suspense>
  );
}

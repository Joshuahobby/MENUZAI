"use client";

import NextImage from "next/image";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import OrderConfirmation from "./OrderConfirmation";
import type { MenuItem, MenuStyle, CartItem } from "@/types/menu";

interface CartSheetProps {
  isOpen: boolean;
  cart: CartItem[];
  totalPrice: number;
  orderPlaced: boolean;
  orderedSnapshot: { cart: CartItem[]; total: number } | null;
  resolvedTableNumber: string;
  customerName: string;
  orderTableNumber: string;
  currency: string;
  menuStyle: MenuStyle;
  paymentsEnabled: boolean;
  isPlacingOrder: boolean;
  isOffline: boolean;
  lastWhatsAppUrl: string | null;
  lastOrderId: string | null;
  isCancelling: boolean;
  upsellItems: MenuItem[];
  slug: string;
  tableFromUrl: string;
  onClose: () => void;
  onPlaceOrder: () => void;
  onCancelOrder: () => void;
  onIncrementQty: (id: string) => void;
  onDecrementQty: (id: string) => void;
  onAddToCart: (item: MenuItem) => void;
  onCustomerNameChange: (val: string) => void;
  onOrderTableNumberChange: (val: string) => void;
  orderNote: string;
  showNoteField: boolean;
  onOrderNoteChange: (val: string) => void;
  onShowNoteFieldChange: (val: boolean) => void;
  onShowPaymentModal: (show: boolean) => void;
  onTrackOrderClick: () => void;
  rating: number;
  hoverRating: number;
  reviewComment: string;
  reviewSubmitted: boolean;
  isSubmittingReview: boolean;
  onRatingChange: (val: number) => void;
  onHoverRatingChange: (val: number) => void;
  onReviewCommentChange: (val: string) => void;
  onSubmitReview: () => void;
}

export default function CartSheet({
  isOpen,
  cart,
  totalPrice,
  orderPlaced,
  orderedSnapshot,
  resolvedTableNumber,
  customerName,
  orderTableNumber,
  currency,
  menuStyle,
  paymentsEnabled,
  isPlacingOrder,
  isOffline,
  lastWhatsAppUrl,
  lastOrderId,
  isCancelling,
  upsellItems,
  slug,
  tableFromUrl,
  onClose,
  onPlaceOrder,
  onCancelOrder,
  onIncrementQty,
  onDecrementQty,
  onAddToCart,
  onCustomerNameChange,
  onOrderTableNumberChange,
  orderNote,
  showNoteField,
  onOrderNoteChange,
  onShowNoteFieldChange,
  onShowPaymentModal,
  onTrackOrderClick,
  rating,
  hoverRating,
  reviewComment,
  reviewSubmitted,
  isSubmittingReview,
  onRatingChange,
  onHoverRatingChange,
  onReviewCommentChange,
  onSubmitReview,
}: CartSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-surface rounded-t-[2.5rem] shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-black/10 rounded-full" />
        </div>

        {orderPlaced && orderedSnapshot ? (
          <OrderConfirmation
            orderedSnapshot={orderedSnapshot}
            resolvedTableNumber={resolvedTableNumber}
            customerName={customerName}
            lastWhatsAppUrl={lastWhatsAppUrl}
            currency={currency}
            slug={slug}
            lastOrderId={lastOrderId}
            isCancelling={isCancelling}
            onCancelOrder={onCancelOrder}
            onClose={onClose}
            rating={rating}
            hoverRating={hoverRating}
            reviewComment={reviewComment}
            reviewSubmitted={reviewSubmitted}
            isSubmittingReview={isSubmittingReview}
            onRatingChange={onRatingChange}
            onHoverRatingChange={onHoverRatingChange}
            onReviewCommentChange={onReviewCommentChange}
            onSubmitReview={onSubmitReview}
          />
        ) : (
          <>
            <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-outline-variant/10">
              <div>
                <h2 className="font-[var(--font-headline)] font-extrabold text-xl tracking-tight">Your Order</h2>
                {resolvedTableNumber && (
                  <p className="text-xs text-secondary font-bold flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">table_restaurant</span>
                    Table {resolvedTableNumber}
                  </p>
                )}
                {customerName.trim() && (
                  <p className="text-[10px] text-secondary flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[11px]">person</span>
                    {customerName.trim()}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-secondary/30 block mb-2">shopping_bag</span>
                  <p className="text-secondary font-bold text-sm">Your cart is empty</p>
                  <button onClick={onClose} className="text-primary font-bold text-sm mt-2">Browse menu</button>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center py-1">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-surface-container relative">
                        {item.image ? (
                          <NextImage src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-secondary/40 text-2xl absolute inset-0 flex items-center justify-center">restaurant</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-on-surface truncate">{item.name}</p>
                        <p className="text-xs text-primary font-bold mt-0.5">{formatPrice(item.price, currency)}</p>
                      </div>
                      <div className="flex items-center gap-0 bg-surface-container rounded-xl overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => onDecrementQty(item.id)}
                          className="w-9 h-9 flex items-center justify-center text-secondary hover:text-error hover:bg-error/5 transition-colors active:scale-90"
                        >
                          <span className="material-symbols-outlined text-[18px]">{item.quantity === 1 ? "delete" : "remove"}</span>
                        </button>
                        <span className="w-8 text-center font-black text-sm text-on-surface">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onIncrementQty(item.id)}
                          className="w-9 h-9 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors active:scale-90"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      </div>
                      <div className="min-w-[4.5rem] text-right shrink-0">
                        <p className="font-[var(--font-headline)] font-extrabold text-sm text-primary">{formatPrice(item.price * item.quantity, currency)}</p>
                      </div>
                    </div>
                  ))}

                  {upsellItems.length > 0 && (
                    <div className="pt-2 pb-1">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-[0.18em] mb-2">Pairs well with</p>
                      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                        {upsellItems.map(ui => (
                          <button
                            key={ui.id}
                            type="button"
                            onClick={() => onAddToCart(ui)}
                            className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-xl whitespace-nowrap hover:bg-primary/10 transition-colors group shrink-0"
                          >
                            <span className="text-xs font-bold text-on-surface">{ui.name}</span>
                            <span className="text-[10px] text-primary font-bold">{formatPrice(ui.price, currency)}</span>
                            <span className="material-symbols-outlined text-[14px] text-primary group-hover:scale-110 transition-transform">add_circle</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-3 border-t border-outline-variant/10">
                    <div>
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.18em] mb-1.5 block">Your Name (Optional)</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => onCustomerNameChange(e.target.value)}
                        placeholder="e.g. Alice"
                        className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    {!tableFromUrl && (
                      <div>
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.18em] mb-1.5 block">Table Number (Required)</label>
                        <input
                          type="text"
                          value={orderTableNumber}
                          onChange={(e) => onOrderTableNumberChange(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    )}
                  </div>

                  {showNoteField ? (
                    <div className="pt-1">
                      <textarea
                        value={orderNote}
                        onChange={(e) => onOrderNoteChange(e.target.value)}
                        placeholder="e.g. No onions, extra sauce, allergies..."
                        rows={2}
                        autoFocus
                        className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onShowNoteFieldChange(true)}
                      className="w-full flex items-center gap-2 py-3 text-secondary hover:text-primary transition-colors text-sm font-bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      Add special request
                    </button>
                  )}
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-5 bg-surface border-t border-outline-variant/10 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-[var(--font-headline)] font-bold text-lg text-secondary">Total</span>
                  <span className="font-[var(--font-headline)] font-extrabold text-2xl text-primary">{formatPrice(totalPrice, currency)}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={onPlaceOrder}
                    disabled={isPlacingOrder || isOffline}
                    className="w-full h-14 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-2xl flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(37,211,102,0.35)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm"
                  >
                    {isOffline ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">wifi_off</span>
                        No Internet Connection
                      </>
                    ) : isPlacingOrder ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Placing Order…
                      </>
                    ) : (
                      <>
                        <svg className="fill-current w-5 h-5" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Order via WhatsApp
                      </>
                    )}
                  </button>
                  {paymentsEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!resolvedTableNumber) {
                          toast.error("Please enter your table number first.");
                          return;
                        }
                        onShowPaymentModal(true);
                      }}
                      disabled={isPlacingOrder || isOffline}
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 font-bold text-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                      Pay with Mobile Money
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

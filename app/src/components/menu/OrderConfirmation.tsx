"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import ReviewWidget from "./ReviewWidget";
import type { CartItem } from "@/types/menu";

interface OrderConfirmationProps {
  orderedSnapshot: { cart: CartItem[]; total: number };
  resolvedTableNumber: string;
  customerName: string;
  lastWhatsAppUrl: string | null;
  currency: string;
  slug: string;
  lastOrderId: string | null;
  isCancelling: boolean;
  onCancelOrder: () => void;
  onClose: () => void;
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

export default function OrderConfirmation({
  orderedSnapshot,
  resolvedTableNumber,
  customerName,
  lastWhatsAppUrl,
  currency,
  slug,
  lastOrderId,
  isCancelling,
  onCancelOrder,
  onClose,
  rating,
  hoverRating,
  reviewComment,
  reviewSubmitted,
  isSubmittingReview,
  onRatingChange,
  onHoverRatingChange,
  onReviewCommentChange,
  onSubmitReview,
}: OrderConfirmationProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center space-y-6 pb-10">
      <div className="w-20 h-20 bg-tertiary/10 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-tertiary text-4xl icon-fill">check_circle</span>
      </div>
      <div className="text-center">
        <h2 className="font-[var(--font-headline)] font-extrabold text-2xl tracking-tight">Order Sent!</h2>
        <p className="text-secondary text-sm mt-1">WhatsApp is opening to confirm with the restaurant.</p>
        {resolvedTableNumber && (
          <div className="inline-flex items-center gap-1.5 mt-2 bg-surface-container px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-[14px] text-secondary">table_restaurant</span>
            <span className="text-xs font-bold text-secondary">Table {resolvedTableNumber}</span>
          </div>
        )}
        {customerName.trim() && (
          <div className="inline-flex items-center gap-1.5 mt-1 bg-surface-container px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-[14px] text-secondary">person</span>
            <span className="text-xs font-bold text-secondary">{customerName.trim()}</span>
          </div>
        )}
        {lastWhatsAppUrl && (
          <a
            href={lastWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-whatsapp hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            WhatsApp didn&apos;t open? Tap here
          </a>
        )}
      </div>

      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50 space-y-2.5">
        {orderedSnapshot.cart.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="font-medium text-on-surface">
              {item.name}
              <span className="text-secondary ml-1.5">×{item.quantity}</span>
            </span>
            <span className="font-bold text-primary">{formatPrice(item.price * item.quantity, currency)}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-surface-container flex justify-between font-bold text-base">
          <span>Total</span>
          <span className="text-primary">{formatPrice(orderedSnapshot.total, currency)}</span>
        </div>
      </div>

      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50 space-y-4">
        <h3 className="font-[var(--font-headline)] font-black text-center text-sm">Rate your experience</h3>
        <ReviewWidget
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
      </div>

      {lastOrderId && (
        <button
          type="button"
          onClick={onCancelOrder}
          disabled={isCancelling}
          className="w-full py-3 rounded-2xl text-sm font-bold border border-error/30 text-error bg-transparent hover:bg-error/5 transition-all disabled:opacity-40"
        >
          {isCancelling ? "Cancelling..." : "Cancel Order"}
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full py-4 bg-surface-container-lowest border border-surface-container rounded-2xl font-bold text-sm hover:bg-surface-container-low transition-all"
      >
        Back to Menu
      </button>

      <Link
        href={`/menu/${slug}/history`}
        className="block text-center text-xs text-secondary hover:text-on-surface underline underline-offset-2 transition-colors"
      >
        View Order History
      </Link>
    </div>
  );
}

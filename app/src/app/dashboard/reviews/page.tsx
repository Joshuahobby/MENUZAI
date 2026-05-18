"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMenu } from "@/context/MenuContext";
import { formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";

interface ReviewRow {
  id: string;
  rating: number;
  customer_name: string | null;
  comment: string | null;
  created_at: string;
}

const STARS = [1, 2, 3, 4, 5];

function StarRow({ rating, filled }: { rating: number; filled: boolean }) {
  return (
    <span
      className={`material-symbols-outlined text-[18px] ${filled ? "icon-fill text-amber-400" : "text-surface-container-high"}`}
    >
      star
    </span>
  );
}

export default function ReviewsPage() {
  const { restaurantId, userRole, isLoading: menuLoading } = useMenu();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, customer_name, comment, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (!error && data) setReviews(data as ReviewRow[]);
      setLoading(false);
    };

    fetchReviews();
  }, [restaurantId]);

  const filtered = filterRating ? reviews.filter((r) => r.rating === filterRating) : reviews;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const distribution = STARS.map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  if (menuLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole === "staff") {
    return (
      <div className="p-6 lg:p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-error/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-3xl icon-fill">gpp_maybe</span>
          </div>
          <h2 className="text-xl font-[var(--font-headline)] font-extrabold tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            Staff accounts are restricted to viewing and managing live orders only. Reviews require Manager or Owner permissions.
          </p>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-center block w-full"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">
          Customer Reviews
        </h1>
        <p className="text-secondary">Feedback collected after orders are placed</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Average rating */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-amber-400 text-3xl icon-fill">star</span>
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <p className="text-3xl font-extrabold leading-none">
                {reviews.length > 0 ? avgRating.toFixed(1) : "—"}
              </p>
            )}
            <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Avg Rating</p>
          </div>
        </div>

        {/* Total reviews */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-3xl icon-fill">rate_review</span>
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-8 w-12 mb-1" />
            ) : (
              <p className="text-3xl font-extrabold leading-none">{reviews.length}</p>
            )}
            <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Total Reviews</p>
          </div>
        </div>

        {/* Rating distribution */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Distribution</p>
          <div className="space-y-1.5">
            {[...distribution].reverse().map(({ star, count }) => (
              <button
                key={star}
                type="button"
                onClick={() => setFilterRating(filterRating === star ? null : star)}
                className={`w-full flex items-center gap-2 group rounded-lg px-1 transition-colors ${
                  filterRating === star ? "bg-amber-50" : "hover:bg-surface-container-low"
                }`}
              >
                <span className="text-[10px] font-bold text-secondary w-3 shrink-0">{star}</span>
                <span className="material-symbols-outlined text-amber-400 text-[12px] icon-fill shrink-0">star</span>
                <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-secondary w-4 text-right shrink-0">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter chip */}
      {filterRating && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-secondary">Showing:</span>
          <button
            type="button"
            onClick={() => setFilterRating(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            {filterRating} star{filterRating > 1 ? "s" : ""}
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-secondary">rate_review</span>
          </div>
          <h2 className="text-xl font-[var(--font-headline)] font-bold mb-2">
            {filterRating ? `No ${filterRating}-star reviews` : "No reviews yet"}
          </h2>
          <p className="text-secondary text-sm max-w-sm">
            {filterRating
              ? "Try a different rating filter."
              : "Reviews appear here after customers rate their dining experience on the order confirmation page."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <p className="font-[var(--font-headline)] font-bold text-sm">
                    {review.customer_name || "Guest"}
                  </p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {STARS.map((s) => (
                      <StarRow key={s} rating={s} filled={s <= review.rating} />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-secondary shrink-0">{formatRelativeTime(review.created_at)}</p>
              </div>
              {review.comment && (
                <p className="text-sm text-on-surface-variant leading-relaxed mt-3 border-t border-surface-container pt-3">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

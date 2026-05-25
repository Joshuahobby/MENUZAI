"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMenu } from "@/context/MenuContext";
import { formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";
import { toast } from "sonner";

interface ReviewRow {
  id: string;
  rating: number;
  customer_name: string | null;
  comment: string | null;
  sentiment: "positive" | "negative" | "neutral";
  reply: string | null;
  replied_at: string | null;
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
  const { restaurantId, restaurantName, userRole, isLoading: menuLoading } = useMenu();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);

  // AI draft states
  const [generatingForId, setGeneratingForId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!restaurantId) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, customer_name, comment, sentiment, reply, replied_at, created_at")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      // Map sentiment if it's missing in some records
      const processed = (data as ReviewRow[]).map((r) => ({
        ...r,
        sentiment: r.sentiment || (r.rating >= 4 ? "positive" : r.rating === 3 ? "neutral" : "negative"),
      }));
      setReviews(processed as ReviewRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    fetchReviews();
  }, [restaurantId]);

  const handleGenerateAiReply = async (review: ReviewRow) => {
    setGeneratingForId(review.id);
    try {
      const res = await fetch("/api/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: review.rating,
          customerName: review.customer_name,
          comment: review.comment,
          restaurantName: restaurantName || "our restaurant",
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setReplyDrafts((prev) => ({ ...prev, [review.id]: data.reply }));
        setEditingReplyId(review.id);
        toast.success("AI draft reply generated successfully!");
      } else {
        toast.error("Failed to generate AI response.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not reach AI response generator.");
    } finally {
      setGeneratingForId(null);
    }
  };

  const handleSaveReply = async (reviewId: string) => {
    const draftText = replyDrafts[reviewId];
    if (!draftText || !draftText.trim()) {
      toast.error("Reply text cannot be empty.");
      return;
    }

    setSavingReplyId(reviewId);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          reply: draftText.trim(),
          replied_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (error) {
        throw error;
      }

      toast.success("Response sent to customer successfully!");
      setEditingReplyId(null);
      fetchReviews();
    } catch (err) {
      toast.error("Failed to save response: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSavingReplyId(null);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this response?")) return;
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          reply: null,
          replied_at: null,
        })
        .eq("id", reviewId);

      if (error) throw error;
      toast.success("Response deleted successfully.");
      fetchReviews();
    } catch (err) {
      toast.error("Failed to delete response: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const filtered = reviews.filter((r) => {
    if (filterRating && r.rating !== filterRating) return false;
    if (filterSentiment && r.sentiment !== filterSentiment) return false;
    return true;
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const distribution = STARS.map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  // Sentiment analytics counts
  const positiveCount = reviews.filter((r) => r.sentiment === "positive").length;
  const neutralCount = reviews.filter((r) => r.sentiment === "neutral").length;
  const negativeCount = reviews.filter((r) => r.sentiment === "negative").length;

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
    <div className="p-6 lg:p-12 pb-24 lg:pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">
            Customer Reviews
          </h1>
          <p className="text-secondary text-sm">Feedback collected after orders are placed, with AI analysis and instant reply generator</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Average rating card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container/50 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <span className="material-symbols-outlined text-2xl icon-fill font-bold">star</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold leading-none text-on-surface">
                {reviews.length > 0 ? avgRating.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-secondary uppercase tracking-[0.2em] font-bold mt-1">Avg Customer Rating</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 bg-surface-container-low p-3 rounded-2xl border border-surface-container text-xs text-secondary">
            <span className="material-symbols-outlined text-amber-500 text-sm">recommend</span>
            <span>Based on <strong>{reviews.length}</strong> total customer reviews.</span>
          </div>
        </div>

        {/* Sentiment Analysis stats card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container/50">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Sentiment Breakdown</p>
          <div className="space-y-3">
            {[
              { id: "positive", name: "Positive Sentiment", count: positiveCount, color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" },
              { id: "neutral", name: "Neutral Sentiment", count: neutralCount, color: "bg-gray-400", text: "text-gray-600 dark:text-gray-400 bg-gray-400/10" },
              { id: "negative", name: "Critical Sentiment", count: negativeCount, color: "bg-rose-500", text: "text-rose-700 dark:text-rose-400 bg-rose-500/10" }
            ].map((s) => {
              const pct = reviews.length > 0 ? (s.count / reviews.length) * 100 : 0;
              const isSelected = filterSentiment === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFilterSentiment(filterSentiment === s.id ? null : s.id)}
                  className={`w-full flex items-center gap-3 text-left group p-1.5 rounded-xl transition-all cursor-pointer ${isSelected ? "bg-surface-container-low ring-1 ring-primary/10" : "hover:bg-surface-container-low/50"}`}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className={`font-bold px-2 py-0.5 rounded-md text-[9px] ${s.text}`}>{s.name}</span>
                      <span className="text-secondary font-bold text-[10px]">{s.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rating distribution card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container/50">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-3">Star Distribution</p>
          <div className="space-y-1.5">
            {[...distribution].reverse().map(({ star, count }) => {
              const isSelected = filterRating === star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`w-full flex items-center gap-2 group rounded-xl px-2 py-1 transition-all cursor-pointer ${
                    isSelected ? "bg-amber-500/5 ring-1 ring-amber-500/10" : "hover:bg-surface-container-low"
                  }`}
                >
                  <span className="text-[10px] font-bold text-secondary w-3 shrink-0">{star}</span>
                  <span className="material-symbols-outlined text-amber-500 text-[12px] icon-fill shrink-0">star</span>
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-secondary w-4 text-right shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(filterRating || filterSentiment) && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-secondary font-bold">Active Filters:</span>
          {filterRating && (
            <button
              type="button"
              onClick={() => setFilterRating(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              {filterRating} star{filterRating > 1 ? "s" : ""}
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
          {filterSentiment && (
            <button
              type="button"
              onClick={() => setFilterSentiment(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer"
            >
              Sentiment: {filterSentiment}
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => { setFilterRating(null); setFilterSentiment(null); }}
            className="text-xs text-secondary hover:text-primary transition-colors cursor-pointer font-bold ml-1"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container/50 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-surface-container-lowest border border-surface-container/50 rounded-[2.5rem]">
          <div className="w-20 h-20 bg-surface-container-low rounded-3xl flex items-center justify-center mb-6 border border-outline-variant/10 text-secondary">
            <span className="material-symbols-outlined text-4xl">rate_review</span>
          </div>
          <h2 className="text-xl font-[var(--font-headline)] font-bold mb-2">No reviews yet</h2>
          <p className="text-secondary text-sm max-w-sm">
            Share your menu link with customers to start collecting feedback. Reviews appear here automatically after orders.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-surface-container-lowest border border-surface-container/50 rounded-[2.5rem]">
          <div className="w-20 h-20 bg-surface-container-low rounded-3xl flex items-center justify-center mb-6 border border-outline-variant/10 text-secondary">
            <span className="material-symbols-outlined text-4xl">filter_alt_off</span>
          </div>
          <h2 className="text-xl font-[var(--font-headline)] font-bold mb-2">No reviews match your filters</h2>
          <p className="text-secondary text-sm max-w-sm">
            Try clearing your rating or sentiment filters to view all customer reviews.
          </p>
          <button
            type="button"
            onClick={() => { setFilterRating(null); setFilterSentiment(null); }}
            className="mt-5 px-5 py-2.5 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((review) => {
            const hasReply = !!review.reply;
            const isEditing = editingReplyId === review.id;
            const activeDraft = replyDrafts[review.id] || "";

            return (
              <div
                key={review.id}
                className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container/50 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
              >
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center font-bold text-sm text-primary">
                      {review.customer_name ? review.customer_name.slice(0, 2).toUpperCase() : "G"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-[var(--font-headline)] font-bold text-sm text-on-surface">
                          {review.customer_name || "Guest"}
                        </p>
                        
                        {/* Sentiment Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          review.sentiment === "positive" 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                            : review.sentiment === "negative" 
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                            : "bg-gray-400/10 text-gray-500"
                        }`}>
                          {review.sentiment.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {STARS.map((s) => (
                          <StarRow key={s} rating={s} filled={s <= review.rating} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-secondary">{formatRelativeTime(review.created_at)}</p>
                  </div>
                </div>

                {/* Comment Section */}
                {review.comment ? (
                  <p className="text-sm text-on-surface leading-relaxed mb-6 font-medium pl-1">
                    &quot;{review.comment}&quot;
                  </p>
                ) : (
                  <p className="text-xs text-secondary italic mb-6 pl-1">
                    Customer left a rating with no comments.
                  </p>
                )}

                {/* Actions / AI Responder Section */}
                <div className="border-t border-surface-container pt-5 flex flex-col gap-4">
                  {!hasReply && !isEditing && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleGenerateAiReply(review)}
                        disabled={generatingForId === review.id}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px] icon-fill">bolt</span>
                        <span>{generatingForId === review.id ? "Drafting..." : "AI Review Responder"}</span>
                      </button>
                    </div>
                  )}

                  {/* Inline Edit Draft Form */}
                  {isEditing && (
                    <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-sm icon-fill">bolt</span>
                          AI Draft Response
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGenerateAiReply(review)}
                          disabled={generatingForId === review.id}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">refresh</span> Regenerate
                        </button>
                      </div>

                      <textarea
                        rows={4}
                        value={activeDraft}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                        className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 leading-relaxed custom-scrollbar"
                      />

                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setEditingReplyId(null)}
                          className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-secondary text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveReply(review.id)}
                          disabled={savingReplyId === review.id}
                          className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer"
                        >
                          {savingReplyId === review.id ? "Sending..." : "Submit Reply"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Existing Reply Display */}
                  {hasReply && !isEditing && (
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 relative">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-wider">
                            Owner Response
                          </span>
                          {review.replied_at && (
                            <span className="text-[10px] text-secondary font-semibold">
                              {formatRelativeTime(review.replied_at)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyDrafts((prev) => ({ ...prev, [review.id]: review.reply || "" }));
                              setEditingReplyId(review.id);
                            }}
                            className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-secondary hover:text-primary transition-all cursor-pointer"
                            title="Edit Response"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReply(review.id)}
                            className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-secondary hover:text-error transition-all cursor-pointer"
                            title="Delete Response"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed text-on-surface-variant italic">
                        &quot;{review.reply}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

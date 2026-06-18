"use client";

interface ReviewWidgetProps {
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

export default function ReviewWidget({
  rating,
  hoverRating,
  reviewComment,
  reviewSubmitted,
  isSubmittingReview,
  onRatingChange,
  onHoverRatingChange,
  onReviewCommentChange,
  onSubmitReview,
}: ReviewWidgetProps) {
  if (reviewSubmitted) {
    return (
      <div className="text-center py-2 space-y-1">
        <span className="material-symbols-outlined text-emerald-500 text-4xl block">celebration</span>
        <p className="text-sm font-bold text-emerald-600">Thanks for the feedback! ❤️</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = (hoverRating || rating) >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => onHoverRatingChange(star)}
              onMouseLeave={() => onHoverRatingChange(0)}
              className={`transition-all duration-150 hover:scale-125 active:scale-110 border-none bg-transparent cursor-pointer ${isActive ? "text-amber-500" : "text-surface-container-highest"}`}
            >
              <span className="material-symbols-outlined text-[32px] icon-fill select-none">star</span>
            </button>
          );
        })}
      </div>
      {rating > 0 && (
        <div className="space-y-2.5">
          <textarea
            value={reviewComment}
            onChange={(e) => onReviewCommentChange(e.target.value)}
            placeholder="What did you love? (optional)"
            className="w-full bg-surface-container-low border-none rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-primary/20 resize-none h-16 outline-none"
          />
          <button
            type="button"
            onClick={onSubmitReview}
            disabled={isSubmittingReview}
            className="w-full py-3 bg-primary text-white font-[var(--font-headline)] font-bold rounded-2xl text-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer hover:opacity-90"
          >
            {isSubmittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}
    </div>
  );
}

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReviewWidget from "./ReviewWidget";

describe("ReviewWidget", () => {
  const defaultProps = {
    rating: 0,
    hoverRating: 0,
    reviewComment: "",
    reviewSubmitted: false,
    isSubmittingReview: false,
    onRatingChange: vi.fn(),
    onHoverRatingChange: vi.fn(),
    onReviewCommentChange: vi.fn(),
    onSubmitReview: vi.fn(),
  };

  it("renders 5 star buttons when not submitted", () => {
    render(<ReviewWidget {...defaultProps} />);
    const stars = screen.getAllByText("star");
    expect(stars.length).toBe(5);
  });

  it("does not show textarea when rating is 0", () => {
    render(<ReviewWidget {...defaultProps} />);
    expect(screen.queryByPlaceholderText(/what did you love/i)).toBeNull();
    expect(screen.queryByText("Submit Review")).toBeNull();
  });

  it("shows textarea and submit button when rating > 0", () => {
    render(<ReviewWidget {...defaultProps} rating={4} />);
    expect(screen.getByPlaceholderText(/what did you love/i)).toBeDefined();
    expect(screen.getByText("Submit Review")).toBeDefined();
  });

  it("disables submit button when isSubmittingReview is true", () => {
    render(<ReviewWidget {...defaultProps} rating={4} isSubmittingReview />);
    expect(screen.getByText("Submitting...")).toBeDefined();
    expect(screen.getByText("Submitting...")).toHaveProperty("disabled", true);
  });

  it("calls onRatingChange when a star is clicked", () => {
    const onRatingChange = vi.fn();
    render(<ReviewWidget {...defaultProps} onRatingChange={onRatingChange} />);
    const stars = screen.getAllByText("star");
    fireEvent.click(stars[2]);
    expect(onRatingChange).toHaveBeenCalledWith(3);
  });

  it("calls onHoverRatingChange on mouse enter and leave", () => {
    const onHoverRatingChange = vi.fn();
    render(<ReviewWidget {...defaultProps} onHoverRatingChange={onHoverRatingChange} />);
    const stars = screen.getAllByText("star");
    fireEvent.mouseEnter(stars[0]);
    expect(onHoverRatingChange).toHaveBeenCalledWith(1);
    fireEvent.mouseLeave(stars[0]);
    expect(onHoverRatingChange).toHaveBeenCalledWith(0);
  });

  it("shows celebration message when reviewSubmitted is true", () => {
    render(<ReviewWidget {...defaultProps} reviewSubmitted />);
    expect(screen.getByText(/thanks for the feedback/i)).toBeDefined();
    expect(screen.queryByText("Submit Review")).toBeNull();
  });

  it("calls onSubmitReview when submit button is clicked", () => {
    const onSubmitReview = vi.fn();
    render(<ReviewWidget {...defaultProps} rating={4} onSubmitReview={onSubmitReview} />);
    fireEvent.click(screen.getByText("Submit Review"));
    expect(onSubmitReview).toHaveBeenCalledOnce();
  });

  it("calls onReviewCommentChange on textarea input", () => {
    const onReviewCommentChange = vi.fn();
    render(<ReviewWidget {...defaultProps} rating={4} onReviewCommentChange={onReviewCommentChange} />);
    const textarea = screen.getByPlaceholderText(/what did you love/i);
    fireEvent.change(textarea, { target: { value: "Amazing!" } });
    expect(onReviewCommentChange).toHaveBeenCalledWith("Amazing!");
  });
});

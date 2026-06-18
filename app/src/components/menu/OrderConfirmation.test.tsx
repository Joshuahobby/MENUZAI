import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OrderConfirmation from "./OrderConfirmation";

vi.mock("next/link", () => ({
  default: ({ children, href, className, target, rel, onClick }: {
    children: React.ReactNode; href?: string; className?: string;
    target?: string; rel?: string; onClick?: React.MouseEventHandler;
  }) => <a href={href} className={className} target={target} rel={rel} onClick={onClick}>{children}</a>,
}));

vi.mock("./ReviewWidget", () => ({
  default: () => <div data-testid="review-widget">Review</div>,
}));

describe("OrderConfirmation", () => {
  const defaultProps = {
    orderedSnapshot: {
      cart: [
        { id: "1", name: "Burger", description: "", price: 5000, category: "", image: "", tags: [], quantity: 2 },
        { id: "2", name: "Fries", description: "", price: 2000, category: "", image: "", tags: [], quantity: 1 },
      ],
      total: 12000,
    },
    resolvedTableNumber: "5",
    customerName: "Alice",
    lastWhatsAppUrl: "https://wa.me/123",
    currency: "RWF",
    slug: "test-menu",
    lastOrderId: "order-123",
    isCancelling: false,
    onCancelOrder: vi.fn(),
    onClose: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders confirmation heading", () => {
    render(<OrderConfirmation {...defaultProps} />);
    expect(screen.getByText("Order Sent!")).toBeDefined();
  });

  it("shows table number when provided", () => {
    render(<OrderConfirmation {...defaultProps} />);
    expect(screen.getByText(/Table 5/)).toBeDefined();
  });

  it("shows customer name when provided", () => {
    render(<OrderConfirmation {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeDefined();
  });

  it("shows WhatsApp fallback link when lastWhatsAppUrl is set", () => {
    render(<OrderConfirmation {...defaultProps} />);
    const link = screen.getByText(/whatsapp didn.*open/i);
    expect(link).toHaveProperty("href", "https://wa.me/123");
  });

  it("renders order summary items", () => {
    render(<OrderConfirmation {...defaultProps} />);
    expect(screen.getByText("Burger")).toBeDefined();
    expect(screen.getByText("Fries")).toBeDefined();
    expect(screen.getByText("×2")).toBeDefined();
    expect(screen.getByText("×1")).toBeDefined();
  });

  it("renders total price", () => {
    render(<OrderConfirmation {...defaultProps} />);
    expect(screen.getByText("RWF 12,000")).toBeDefined();
  });

  it("renders ReviewWidget", () => {
    render(<OrderConfirmation {...defaultProps} />);
    expect(screen.getByTestId("review-widget")).toBeDefined();
  });

  it("shows cancel button when lastOrderId is set", () => {
    render(<OrderConfirmation {...defaultProps} />);
    expect(screen.getByText("Cancel Order")).toBeDefined();
  });

  it("hides cancel button when lastOrderId is null", () => {
    render(<OrderConfirmation {...defaultProps} lastOrderId={null} />);
    expect(screen.queryByText("Cancel Order")).toBeNull();
  });

  it("shows Cancelling... when isCancelling is true", () => {
    render(<OrderConfirmation {...defaultProps} isCancelling />);
    expect(screen.getByText("Cancelling...")).toBeDefined();
  });

  it("calls onCancelOrder when cancel button is clicked", () => {
    const onCancelOrder = vi.fn();
    render(<OrderConfirmation {...defaultProps} onCancelOrder={onCancelOrder} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    expect(onCancelOrder).toHaveBeenCalledOnce();
  });

  it("calls onClose when back button is clicked", () => {
    const onClose = vi.fn();
    render(<OrderConfirmation {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Back to Menu"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders history link with correct slug", () => {
    render(<OrderConfirmation {...defaultProps} slug="my-menu" />);
    const link = screen.getByText("View Order History");
    expect(link).toHaveProperty("href");
    expect((link as HTMLAnchorElement).href).toContain("/menu/my-menu/history");
  });
});

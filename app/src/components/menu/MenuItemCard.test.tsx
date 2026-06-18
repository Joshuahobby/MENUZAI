import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MenuItemCard from "./MenuItemCard";
import type { MenuItem, MenuStyle } from "@/types/menu";

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, fill: _fill, sizes, className, style }: {
    src: string; alt: string; width?: number; height?: number; fill?: boolean;
    sizes?: string; className?: string; style?: React.CSSProperties;
  }) => <img src={src} alt={alt} width={width} height={height}
    sizes={sizes} className={className} style={style} />,
}));

function makeItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "1",
    name: "Classic Burger",
    description: "A delicious beef burger",
    price: 5000,
    category: "main",
    image: "https://example.com/burger.jpg",
    tags: [],
    available: true,
    ...overrides,
  };
}

const baseStyle: MenuStyle = {
  primaryColor: "#a04100",
  secondaryColor: "#6b2b00",
  backgroundColor: "#ffffff",
  headlineFont: "Plus Jakarta Sans",
  bodyFont: "Inter",
  cardStyle: "flat",
  borderRadius: "rounded-xl",
  layoutDensity: "comfortable",
  currency: "RWF",
};

describe("MenuItemCard", () => {
  const defaultProps = {
    item: makeItem(),
    menuStyle: baseStyle,
    onSelect: vi.fn(),
    onAddToCart: vi.fn(),
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    cartQty: 0,
  };

  it("renders item name and price", () => {
    render(<MenuItemCard {...defaultProps} />);
    expect(screen.getByText("Classic Burger")).toBeDefined();
    expect(screen.getByText("RWF 5,000")).toBeDefined();
  });

  it("renders Add to Cart button when cartQty is 0", () => {
    render(<MenuItemCard {...defaultProps} />);
    expect(screen.getByText("Add to Cart")).toBeDefined();
  });

  it("renders quantity controls when cartQty > 0", () => {
    render(<MenuItemCard {...defaultProps} cartQty={3} />);
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("add")).toBeDefined();
    expect(screen.getByText("remove")).toBeDefined();
    expect(screen.queryByText("Add to Cart")).toBeNull();
  });

  it("shows Sold Out overlay when item.available is false", () => {
    render(<MenuItemCard {...defaultProps} item={makeItem({ available: false })} />);
    const soldOutElements = screen.getAllByText("Sold Out");
    expect(soldOutElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Add to Cart")).toBeNull();
  });

  it("calls onSelect when card is clicked", () => {
    const onSelect = vi.fn();
    render(<MenuItemCard {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Classic Burger"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("calls onAddToCart when Add to Cart is clicked", () => {
    const onAddToCart = vi.fn();
    render(<MenuItemCard {...defaultProps} onAddToCart={onAddToCart} />);
    fireEvent.click(screen.getByText("Add to Cart"));
    expect(onAddToCart).toHaveBeenCalledOnce();
  });

  it("calls onIncrement when + is clicked", () => {
    const onIncrement = vi.fn();
    render(<MenuItemCard {...defaultProps} cartQty={2} onIncrement={onIncrement} />);
    fireEvent.click(screen.getByText("add"));
    expect(onIncrement).toHaveBeenCalledOnce();
  });

  it("calls onDecrement when - is clicked", () => {
    const onDecrement = vi.fn();
    render(<MenuItemCard {...defaultProps} cartQty={2} onDecrement={onDecrement} />);
    fireEvent.click(screen.getByText("remove"));
    expect(onDecrement).toHaveBeenCalledOnce();
  });

  it("shows delete icon when cartQty is 1", () => {
    render(<MenuItemCard {...defaultProps} cartQty={1} />);
    expect(screen.getByText("delete")).toBeDefined();
  });

  it("renders badge when item has badge", () => {
    render(<MenuItemCard {...defaultProps} item={makeItem({ badge: "bestseller" })} />);
    expect(screen.getByText("bestseller")).toBeDefined();
  });

  it("renders tags with icons", () => {
    render(<MenuItemCard {...defaultProps} item={makeItem({ tags: ["spicy", "vegan"] })} />);
    expect(screen.getByText("spicy")).toBeDefined();
    expect(screen.getByText("vegan")).toBeDefined();
  });

  it("renders gallery badge when gallery exists", () => {
    render(<MenuItemCard {...defaultProps} item={makeItem({ gallery: ["img1.jpg", "img2.jpg"] })} />);
    expect(screen.getByText("+2")).toBeDefined();
  });

  it("applies opacity when sold out", () => {
    const { container } = render(<MenuItemCard {...defaultProps} item={makeItem({ available: false })} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("opacity-60");
  });
});

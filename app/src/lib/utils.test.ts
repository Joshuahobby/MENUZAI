import { describe, it, expect } from "vitest";
import { formatPrice, formatRelativeTime, formatEventType } from "./utils";

describe("formatPrice", () => {
  it("formats whole-unit currencies without decimals", () => {
    expect(formatPrice(5000, "RWF")).toBe("RWF 5,000");
    expect(formatPrice(12000, "UGX")).toBe("UGX 12,000");
    expect(formatPrice(3500, "TZS")).toBe("TZS 3,500");
    expect(formatPrice(100, "JPY")).toBe("JPY 100");
  });

  it("formats decimal currencies with 2 decimal places", () => {
    expect(formatPrice(12.5, "USD")).toBe("USD 12.50");
    expect(formatPrice(9, "EUR")).toBe("EUR 9.00");
    expect(formatPrice(100.1, "GBP")).toBe("GBP 100.10");
  });

  it("rounds whole-unit currencies", () => {
    expect(formatPrice(5000.7, "RWF")).toBe("RWF 5,001");
    expect(formatPrice(5000.3, "RWF")).toBe("RWF 5,000");
  });

  it("is case-insensitive for currency codes", () => {
    expect(formatPrice(1000, "rwf")).toBe("rwf 1,000");
    expect(formatPrice(10, "usd")).toBe("usd 10.00");
  });

  it("handles zero", () => {
    expect(formatPrice(0, "RWF")).toBe("RWF 0");
    expect(formatPrice(0, "USD")).toBe("USD 0.00");
  });
});

describe("formatRelativeTime", () => {
  it('returns "Just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("Just now");
  });

  it("returns minutes ago for < 1 hour", () => {
    const ago = new Date(Date.now() - 15 * 60_000).toISOString();
    expect(formatRelativeTime(ago)).toBe("15m ago");
  });

  it("returns hours ago for < 24 hours", () => {
    const ago = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(formatRelativeTime(ago)).toBe("3h ago");
  });

  it("returns days ago for >= 24 hours", () => {
    const ago = new Date(Date.now() - 48 * 3600_000).toISOString();
    expect(formatRelativeTime(ago)).toBe("2d ago");
  });
});

describe("formatEventType", () => {
  it("maps known event types", () => {
    expect(formatEventType("menu_view")).toBe("viewed menu");
    expect(formatEventType("item_view")).toBe("viewed item");
    expect(formatEventType("order_sent")).toBe("placed an order");
    expect(formatEventType("qr_scan")).toBe("scanned QR code");
  });

  it("returns unknown types as-is", () => {
    expect(formatEventType("custom_event")).toBe("custom_event");
  });
});

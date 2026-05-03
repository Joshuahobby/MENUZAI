import { describe, it, expect } from "vitest";
import { buildWhatsAppMessage, buildWhatsAppURL } from "./whatsapp";
import type { CartItem } from "@/types/menu";

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "1",
  name: "Test Item",
  description: "",
  price: 1000,
  category: "cat",
  image: "",
  tags: [],
  quantity: 1,
  ...overrides,
});

describe("buildWhatsAppMessage", () => {
  it("builds a message with item list and total", () => {
    const items = [makeItem({ name: "Burger", price: 5000, quantity: 2 })];
    const msg = buildWhatsAppMessage(items, undefined, undefined, "RWF");

    expect(msg).toContain("Burger x2");
    expect(msg).toContain("RWF 10,000"); // item line
    expect(msg).toContain("💰 Total: RWF 10,000");
  });

  it("includes customer name when provided", () => {
    const msg = buildWhatsAppMessage([makeItem()], "Alice");
    expect(msg).toContain("👤 Name: Alice");
  });

  it("includes table number when provided", () => {
    const msg = buildWhatsAppMessage([makeItem()], undefined, "5");
    expect(msg).toContain("🪑 Table: 5");
  });

  it("calculates total across multiple items", () => {
    const items = [
      makeItem({ name: "A", price: 3000, quantity: 1 }),
      makeItem({ name: "B", price: 2000, quantity: 3 }),
    ];
    const msg = buildWhatsAppMessage(items, undefined, undefined, "RWF");
    expect(msg).toContain("💰 Total: RWF 9,000");
  });

  it("defaults to RWF currency", () => {
    const msg = buildWhatsAppMessage([makeItem()]);
    expect(msg).toContain("RWF");
  });
});

describe("buildWhatsAppURL", () => {
  it("builds a valid wa.me URL", () => {
    const url = buildWhatsAppURL("+250788123456", "Hello");
    expect(url).toBe("https://wa.me/250788123456?text=Hello");
  });

  it("strips non-numeric characters from phone", () => {
    const url = buildWhatsAppURL("+250-788-123-456", "Hi");
    expect(url).toContain("wa.me/250788123456");
  });

  it("encodes message text", () => {
    const url = buildWhatsAppURL("123", "Hello World!");
    expect(url).toContain("text=Hello%20World!");
  });
});

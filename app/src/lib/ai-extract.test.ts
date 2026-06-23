import { describe, it, expect } from "vitest";
import { parseExtractionResponse, mergeExtractionResults, type ExtractionResult } from "./ai-extract";

describe("parseExtractionResponse", () => {
  it("parses valid JSON response", () => {
    const json = JSON.stringify({
      restaurantName: "Test Café",
      suggestedTheme: "Modern Minimal",
      categories: [{ id: "mains", name: "Main Courses", itemCount: 2 }],
      items: [
        { id: "1", name: "Burger", description: "Juicy beef burger", price: 5000, category: "mains", tags: ["Bestseller"], badge: "bestseller" },
        { id: "2", name: "Salad", description: "Fresh garden salad", price: 3000, category: "mains", tags: [], badge: "" },
      ],
    });

    const result = parseExtractionResponse(json);
    expect(result.restaurantName).toBe("Test Café");
    expect(result.categories).toHaveLength(1);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("Burger");
    expect(result.items[0].price).toBe(5000);
  });

  it("strips markdown code fences", () => {
    const json = "```json\n" + JSON.stringify({
      restaurantName: "Fenced",
      categories: [],
      items: [],
    }) + "\n```";

    const result = parseExtractionResponse(json);
    expect(result.restaurantName).toBe("Fenced");
  });

  it("handles string prices with comma separators", () => {
    const json = JSON.stringify({
      restaurantName: "Price Test",
      categories: [{ id: "cat1", name: "Cat", itemCount: 1 }],
      items: [{ id: "1", name: "Item", price: "7,000", category: "cat1" }],
    });

    const result = parseExtractionResponse(json);
    expect(result.items[0].price).toBe(7000);
  });

  it("provides defaults for missing fields", () => {
    const json = JSON.stringify({});
    const result = parseExtractionResponse(json);
    expect(result.restaurantName).toBe("My Restaurant");
    expect(result.categories).toEqual([]);
    expect(result.items).toEqual([]);
  });

  it("defaults missing item fields gracefully", () => {
    const json = JSON.stringify({
      restaurantName: "Sparse",
      categories: [{ id: "c", name: "C" }],
      items: [{ name: "Solo" }],
    });

    const result = parseExtractionResponse(json);
    expect(result.items[0].description).toBe("");
    expect(result.items[0].price).toBe(0);
    expect(result.items[0].tags).toEqual([]);
    expect(result.items[0].image).toBe("");
  });

  it("throws on non-JSON response (OpenRouter safety message)", () => {
    expect(() => parseExtractionResponse('User Safety: safe')).toThrow('AI returned non-JSON response');
  });

  it("throws on empty response", () => {
    expect(() => parseExtractionResponse('')).toThrow('AI returned non-JSON response');
  });

  it("throws on whitespace-only response", () => {
    expect(() => parseExtractionResponse('   \n  \t  ')).toThrow('AI returned non-JSON response');
  });

  it("throws on non-JSON after stripping markdown fences", () => {
    expect(() => parseExtractionResponse("```\nUser Safety: safe\n```")).toThrow('AI returned non-JSON response');
  });

  it("truncates long non-JSON snippets in error message", () => {
    const long = "A".repeat(200);
    let caught = "";
    try { parseExtractionResponse(long); } catch (e: unknown) { caught = (e as Error).message; }
    expect(caught).toContain("...");
    expect(caught.length).toBeLessThan(200);
  });
});

describe("mergeExtractionResults", () => {
  const makeResult = (overrides: Partial<ExtractionResult> = {}): ExtractionResult => ({
    restaurantName: "My Restaurant",
    categories: [],
    items: [],
    ...overrides,
  });

  it("returns empty result for empty input", () => {
    const result = mergeExtractionResults([]);
    expect(result.restaurantName).toBe("My Restaurant");
    expect(result.categories).toEqual([]);
    expect(result.items).toEqual([]);
  });

  it("returns single result with correct data", () => {
    const single = makeResult({
      restaurantName: "Solo",
      categories: [{ id: "a", name: "Apps" }],
      items: [{ id: "i1", name: "Fries", description: "", price: 500, category: "a", image: "", tags: [] }],
    });

    const result = mergeExtractionResults([single]);
    expect(result.restaurantName).toBe("Solo");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Fries");
  });

  it("deduplicates categories by normalized name", () => {
    const r1 = makeResult({
      categories: [{ id: "drinks", name: "Drinks" }],
      items: [{ id: "i1", name: "Cola", description: "", price: 100, category: "drinks", image: "", tags: [] }],
    });
    const r2 = makeResult({
      categories: [{ id: "beverages", name: "drinks" }], // same name, different id/case
      items: [{ id: "i2", name: "Sprite", description: "", price: 100, category: "beverages", image: "", tags: [] }],
    });

    const result = mergeExtractionResults([r1, r2]);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].id).toBe("drinks"); // keeps first occurrence id
    expect(result.items).toHaveLength(2);
    // Second item's category should be remapped to canonical id
    expect(result.items[1].category).toBe("drinks");
  });

  it("deduplicates items by name", () => {
    const r1 = makeResult({
      categories: [{ id: "food", name: "Food" }],
      items: [{ id: "i1", name: "Burger", description: "A", price: 500, category: "food", image: "", tags: [] }],
    });
    const r2 = makeResult({
      categories: [{ id: "food", name: "Food" }],
      items: [{ id: "i2", name: "burger", description: "B", price: 600, category: "food", image: "", tags: [] }], // same name, different case
    });

    const result = mergeExtractionResults([r1, r2]);
    expect(result.items).toHaveLength(1); // "burger" deduplicated
    expect(result.items[0].name).toBe("Burger"); // keeps first
  });

  it("picks non-default restaurant name", () => {
    const r1 = makeResult({ restaurantName: "My Restaurant" });
    const r2 = makeResult({ restaurantName: "Kigali Bites" });

    const result = mergeExtractionResults([r1, r2]);
    expect(result.restaurantName).toBe("Kigali Bites");
  });

  it("re-indexes item IDs sequentially", () => {
    const r1 = makeResult({
      categories: [{ id: "c1", name: "Cat" }],
      items: [
        { id: "old-1", name: "A", description: "", price: 1, category: "c1", image: "", tags: [] },
        { id: "old-2", name: "B", description: "", price: 2, category: "c1", image: "", tags: [] },
      ],
    });

    const result = mergeExtractionResults([r1]);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("item-1");
    expect(result.items[1].id).toBe("item-2");
  });

  it("re-indexes item IDs across merged results", () => {
    const r1 = makeResult({
      categories: [{ id: "c1", name: "Cat1" }],
      items: [
        { id: "x", name: "Item A", description: "", price: 1, category: "c1", image: "", tags: [] },
      ],
    });
    const r2 = makeResult({
      categories: [{ id: "c2", name: "Cat2" }],
      items: [
        { id: "y", name: "Item B", description: "", price: 2, category: "c2", image: "", tags: [] },
      ],
    });

    const result = mergeExtractionResults([r1, r2]);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("item-1");
    expect(result.items[1].id).toBe("item-2");
  });

  it("filters out empty categories with no items", () => {
    const r = makeResult({
      categories: [
        { id: "full", name: "Full", itemCount: 1 },
        { id: "empty", name: "Empty", itemCount: 0 },
      ],
      items: [
        { id: "i1", name: "Soda", description: "", price: 100, category: "full", image: "", tags: [] },
      ],
    });

    const result = mergeExtractionResults([r]);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].id).toBe("full");
  });

  it("preserves suggestedTheme from first result", () => {
    const r1 = makeResult({ suggestedTheme: "Luxury Gold", categories: [], items: [] });
    const r2 = makeResult({ suggestedTheme: "Modern Minimal", categories: [], items: [] });

    const result = mergeExtractionResults([r1, r2]);
    expect(result.suggestedTheme).toBe("Luxury Gold");
  });
});

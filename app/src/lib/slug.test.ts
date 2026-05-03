import { describe, it, expect, vi } from "vitest";

// Mock the supabase module before importing slug.ts — the module-level import
// of supabase.ts calls createBrowserClient() which requires env vars.
vi.mock("./supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: null }),
          }),
        }),
      }),
    }),
  },
}));

// Now import after the mock is set up
const { generateSlug } = await import("./slug");

describe("generateSlug", () => {
  it("lowercases and hyphenates a simple name", () => {
    expect(generateSlug("My Restaurant")).toBe("my-restaurant");
  });

  it("strips special characters", () => {
    expect(generateSlug("Café L'Étoile!")).toBe("caf-ltoile");
  });

  it("collapses multiple spaces into single hyphens", () => {
    expect(generateSlug("  Foo   Bar   Baz  ")).toBe("foo-bar-baz");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("foo---bar")).toBe("foo-bar");
  });

  it("removes leading and trailing hyphens", () => {
    expect(generateSlug("-hello-world-")).toBe("hello-world");
  });

  it('falls back to "menu" for empty/whitespace strings', () => {
    expect(generateSlug("")).toBe("menu");
    expect(generateSlug("   ")).toBe("menu");
    expect(generateSlug("!!!")).toBe("menu");
  });

  it("handles numbers", () => {
    expect(generateSlug("Restaurant 99")).toBe("restaurant-99");
  });

  it("handles already-slugified strings", () => {
    expect(generateSlug("already-a-slug")).toBe("already-a-slug");
  });
});

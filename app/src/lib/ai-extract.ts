import type { MenuItem, MenuCategory } from "@/types/menu";

export interface ExtractionResult {
  restaurantName: string;
  categories: MenuCategory[];
  items: MenuItem[];
  suggestedTheme?: string;
}

export const EXTRACTION_PROMPT = `You are a restaurant menu data extractor. Analyze this menu image and extract ALL items.

Return ONLY valid JSON in this exact format (no markdown):
{
  "restaurantName": "Name of the restaurant",
  "suggestedTheme": "One of: Classic Elegance, Modern Minimal, Luxury Gold, Street Food, Botanical Garden, Neon Night",
  "categories": [
    { "id": "category-slug", "name": "Category Name", "itemCount": 3 }
  ],
  "items": [
    {
      "id": "unique-id",
      "name": "Item Name",
      "description": "Short appealing description",
      "price": 12.50,
      "category": "category-slug",
      "tags": ["vegan", "spicy"],
      "badge": "bestseller"
    }
  ]
}

Heuristics for tags and badges:
- Detect dietary attributes and spicy indicators from item names, icons, and descriptions:
  - If you see a leaf icon, "V", "VEGAN", or "100% plant-based", add "vegan" to tags.
  - If you see "V" (where not specifically vegan), a green dot, "VEGETARIAN", or "meat-free", add "vegetarian" to tags.
  - If you see "GF", "GLUTEN FREE", "GLUTEN-FREE", or "coeliac-friendly", add "gluten-free" to tags.
  - If you see a chili icon, "SPICY", "HOT", "chili", or heat level indicators, add "spicy" to tags.
  - If you see "HALAL", a halal certified mark, or "kosher-style", add "halal" to tags.
- Use only lowercase standardized values: "vegan", "vegetarian", "gluten-free", "halal", "spicy" for these tags.
- If an item is boxed, has a star, or says "Chef's Special", set badge to "chefs-pick".
- If an item says "Most Popular" or "Best Seller", set badge to "bestseller".
- All other items should have empty tags [] and badge "" unless clearly indicated otherwise.
- Generate short, appetizing descriptions if the menu lacks them.
- **PRICE EXTRACTION**: Extract prices as numbers. 
  - If a price has a comma as a thousand separator (e.g., 7,000), remove the comma before parsing.
  - If a price has a decimal (e.g., .9), ensure it is treated as a fractional part.
- Ensure category IDs are unique lowercase slugs.`;

export function mergeExtractionResults(results: ExtractionResult[]): ExtractionResult {
  if (results.length === 0) return { restaurantName: "My Restaurant", categories: [], items: [] };

  const restaurantName = results.find(r => r.restaurantName !== "My Restaurant")?.restaurantName ?? "My Restaurant";
  const suggestedTheme = results[0].suggestedTheme;

  // Deduplicate categories by normalized name; keep canonical id from first occurrence
  const categoryMap = new Map<string, MenuCategory>();
  const idRemap = new Map<string, string>(); // old_id -> canonical_id per result
  results.forEach(result => {
    result.categories.forEach(cat => {
      const key = cat.name.toLowerCase().trim();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { ...cat });
      } else {
        idRemap.set(cat.id, categoryMap.get(key)!.id);
      }
    });
  });

  // Merge items with re-indexed IDs and remapped category references
  let itemIndex = 1;
  const seenNames = new Set<string>();
  const mergedItems: MenuItem[] = [];

  results.forEach(result => {
    result.items.forEach(item => {
      const nameKey = item.name.toLowerCase().trim();
      if (seenNames.has(nameKey)) return; // deduplicate by name
      seenNames.add(nameKey);

      const canonicalCategory = idRemap.get(item.category) ?? item.category;
      mergedItems.push({ ...item, id: `item-${itemIndex++}`, category: canonicalCategory });
    });
  });

  // Recalculate itemCount per category
  const counts = new Map<string, number>();
  mergedItems.forEach(i => counts.set(i.category, (counts.get(i.category) ?? 0) + 1));
  const categories = Array.from(categoryMap.values()).map(c => ({
    ...c,
    itemCount: counts.get(c.id) ?? 0,
  })).filter(c => c.itemCount > 0);

  return { restaurantName, suggestedTheme, categories, items: mergedItems };
}

export function parseExtractionResponse(text: string): ExtractionResult {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  // Detect non-JSON responses (e.g., OpenRouter safety moderation messages)
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const snippet = cleaned.length > 120 ? cleaned.slice(0, 120) + "..." : cleaned;
    throw new Error(`AI returned non-JSON response: "${snippet}"`);
  }

  const data = JSON.parse(cleaned);

  // Validate and normalize
  const categories: MenuCategory[] = (data.categories || []).map((c: { id?: string; name?: string; itemCount?: number }) => ({
    id: String(c.id || ""),
    name: String(c.name || ""),
    itemCount: Number(c.itemCount || 0),
  }));

  const items: MenuItem[] = (data.items || []).map((item: Record<string, unknown>, idx: number) => ({
    id: String(item.id || `item-${idx + 1}`),
    name: String(item.name || "Unknown Item"),
    description: String(item.description || ""),
    price: typeof item.price === "string" 
      ? Number(item.price.replace(/,/g, "")) 
      : Number(item.price || 0),
    category: String(item.category || categories[0]?.id || "uncategorized"),
    image: String(item.image || ""),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    badge: String(item.badge || ""),
  }));

  return {
    restaurantName: String(data.restaurantName || "My Restaurant"),
    suggestedTheme: data.suggestedTheme && typeof data.suggestedTheme === "string" ? data.suggestedTheme : "Modern Minimal",
    categories,
    items,
  };
}

import type { MenuItem, MenuCategory } from "@/types/menu";

export interface ExtractionResult {
  restaurantName: string;
  categories: MenuCategory[];
  items: MenuItem[];
  suggestedTheme?: string;
}

export const EXTRACTION_PROMPT = `You are a restaurant menu data extractor. Analyze this menu image/document and extract ALL menu items.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "restaurantName": "Name of the restaurant if visible, otherwise 'My Restaurant'",
  "suggestedTheme": "One of: Classic Elegance, Modern Minimal, Luxury Gold, Street Food, Botanical Garden, Neon Night",
  "categories": [
    { "id": "category-slug", "name": "Category Name", "itemCount": 3 }
  ],
  "items": [
    {
      "id": "unique-id",
      "name": "Item Name",
      "description": "Brief description if available, otherwise generate a short appealing one",
      "price": 12.50,
      "category": "category-slug",
      "image": "",
      "tags": ["relevant", "tags"],
      "badge": ""
    }
  ]
}

Rules:
- Extract every single item visible on the menu
- category "id" must be a lowercase slug matching across categories and items
- itemCount must match the actual number of items in that category
- price must be a number (not string), use 0 if not visible
- tags can include: Vegetarian, Vegan, Gluten-Free, Spicy, Popular, New, Chef's Pick
- badge can be: bestseller, popular, healthy, new, chefs-pick, or empty string
- Generate short descriptions if none are visible on the menu
- Item ids should be unique strings like "item-1", "item-2", etc.`;

export function mergeExtractionResults(results: ExtractionResult[]): ExtractionResult {
  if (results.length === 0) return { restaurantName: "My Restaurant", categories: [], items: [] };
  if (results.length === 1) return results[0];

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
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
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
    price: Number(item.price || 0),
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

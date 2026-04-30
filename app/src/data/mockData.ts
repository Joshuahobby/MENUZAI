// Mock data for the MENUZAI SaaS platform
// Types are defined in @/types/menu — imported here for use in this file
import type { MenuItem, MenuCategory } from "@/types/menu";

export type { MenuItem, MenuCategory };

export const restaurant = {
  name: "Le Bistro",
  tagline: "The Bistro & Grill",
  phone: "+250788000000",
  owner: "Chef Marco",
  hours: "Mon–Sat 10:00 AM – 10:00 PM",
};

export const categories: MenuCategory[] = [
  { id: "specials", name: "Specials" },
  { id: "appetizers", name: "Appetizers" },
  { id: "mains", name: "Main Courses" },
  { id: "desserts", name: "Signature Desserts" },
  { id: "drinks", name: "Beverages" },
  { id: "wines", name: "Wine List" },
];

export const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Truffle Ribeye Steak",
    description: "Premium wagyu-grade ribeye with black truffle butter, served with truffled mashed potatoes.",
    price: 38.0,
    category: "specials",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=400&fit=crop",
    tags: ["Premium"],
    badge: "chefs-pick",
    margin: 72,
    orders: 520,
  },
  {
    id: "2",
    name: "Mediterranean Salmon",
    description: "Pan-seared Atlantic salmon with a honey-soy glaze, served over roasted asparagus and wild rice.",
    price: 24.0,
    category: "specials",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop",
    tags: ["Healthy"],
    badge: "healthy",
    margin: 65,
    orders: 410,
  },
  {
    id: "3",
    name: "The Menuza Royale",
    description: "Double wagyu beef patties, aged cheddar, caramelized onions, and our secret Menuza AI sauce.",
    price: 18.5,
    category: "specials",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
    tags: [],
    badge: "popular",
    margin: 68,
    orders: 482,
  },
  {
    id: "4",
    name: "Molten Lava Cake",
    description: "70% Dark Chocolate core, tahitian vanilla bean gelato, salted caramel drizzle.",
    price: 14.0,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=400&fit=crop",
    tags: ["Organic", "Gluten Free"],
    badge: "bestseller",
    margin: 82,
    orders: 380,
  },
  {
    id: "5",
    name: "Yuzu Cheesecake",
    description: "Creamy japanese citrus cheesecake, graham cracker crust.",
    price: 12.5,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=400&fit=crop",
    tags: [],
    margin: 75,
    orders: 290,
  },
  {
    id: "6",
    name: "Matcha Crème Brûlée",
    description: "Ceremonial grade matcha, scorched turbinado sugar topping.",
    price: 11.0,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop",
    tags: [],
    margin: 78,
    orders: 210,
  },
  {
    id: "7",
    name: "Summer Spritz",
    description: "Aperol, prosecco, soda water with fresh orange.",
    price: 12.0,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1527661591475-527312dd65f4?w=600&h=400&fit=crop",
    tags: ["Cocktail"],
  },
  {
    id: "8",
    name: "Artisan Latte",
    description: "Single origin Ethiopian beans with oat milk latte art.",
    price: 5.5,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&h=400&fit=crop",
    tags: ["Hot"],
  },
  {
    id: "9",
    name: "Classic Truffle Burger",
    description: "Truffle-infused beef patty with aged gruyère, arugula, and house-made aioli.",
    price: 22.0,
    category: "mains",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop",
    tags: ["Signature"],
    badge: "popular",
    margin: 68,
    orders: 482,
  },
  {
    id: "10",
    name: "Garden Margherita",
    description: "San Marzano tomatoes, fresh mozzarella, basil on a wood-fired crust.",
    price: 16.0,
    category: "mains",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop",
    tags: ["Vegetarian"],
    margin: 72,
    orders: 315,
  },
  {
    id: "11",
    name: "Superfood Bowl",
    description: "Quinoa, avocado, roasted chickpeas, kale, tahini dressing.",
    price: 15.0,
    category: "mains",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
    tags: ["Vegan", "Healthy"],
    badge: "healthy",
    margin: 55,
    orders: 210,
  },
  {
    id: "12",
    name: "Bruschetta Trio",
    description: "Three artisan bruschettas with tomato basil, mushroom truffle, and smoked salmon.",
    price: 13.0,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&h=400&fit=crop",
    tags: [],
    badge: "new",
  },
];

export type TemplateCategory = "casual" | "fine-dining" | "cafe" | "bar" | "fast-food";

export interface Template {
  id: string;
  name: string;
  label: string;
  category: TemplateCategory;
  tier: "free" | "pro";
  image: string;          // kept for backward compat — no longer primary display
  description: string;
  config: Partial<import("@/types/menu").MenuStyle>;
}

export const templates: Template[] = [
  // ── FREE ─────────────────────────────────────────────────────
  {
    id: "vintage-parchment",
    name: "Vintage Parchment",
    label: "Vintage",
    category: "cafe",
    tier: "free",
    image: "",
    description: "Warm aged-paper aesthetic with serif typography and a classic two-column layout. Perfect for cafés and bakeries.",
    config: {
      primaryColor: "#8B5E3C",
      secondaryColor: "#4A3318",
      backgroundColor: "#FAF0DC",
      headlineFont: "Playfair Display",
      bodyFont: "Inter",
      borderRadius: "0.25rem",
      layoutDensity: "comfortable",
      cardStyle: "flat",
    },
  },
  {
    id: "dark-chalkboard",
    name: "Dark Chalkboard",
    label: "Chalkboard",
    category: "cafe",
    tier: "free",
    image: "",
    description: "Sophisticated dark chalkboard aesthetic with crisp white text and bold section headers. Great for coffee shops.",
    config: {
      primaryColor: "#FFFFFF",
      secondaryColor: "#CCCCCC",
      backgroundColor: "#1C1C1C",
      headlineFont: "Poppins",
      bodyFont: "Inter",
      borderRadius: "0.25rem",
      layoutDensity: "compact",
      cardStyle: "flat",
    },
  },
  {
    id: "photo-gallery",
    name: "Photo Gallery",
    label: "Photo",
    category: "casual",
    tier: "free",
    image: "",
    description: "Dark premium layout with large food imagery and generous breathing room. Highlights visual-first menus.",
    config: {
      primaryColor: "#FFFFFF",
      secondaryColor: "rgba(255,255,255,0.6)",
      backgroundColor: "#0F0F0F",
      headlineFont: "Outfit",
      bodyFont: "Outfit",
      borderRadius: "0.625rem",
      layoutDensity: "comfortable",
      cardStyle: "elevated",
    },
  },
  // ── PRO ──────────────────────────────────────────────────────
  {
    id: "bold-street",
    name: "Bold Street",
    label: "Bold",
    category: "fast-food",
    tier: "pro",
    image: "",
    description: "Energetic street-food style with a vivid accent colour splash, oversized typography, and food-photo frames.",
    config: {
      primaryColor: "#FF6B00",
      secondaryColor: "#DDDDDD",
      backgroundColor: "#191919",
      headlineFont: "Poppins",
      bodyFont: "Inter",
      borderRadius: "0.5rem",
      layoutDensity: "compact",
      cardStyle: "flat",
    },
  },
  {
    id: "bistro-split",
    name: "Bistro Split",
    label: "Bistro",
    category: "fine-dining",
    tier: "pro",
    image: "",
    description: "Elegant split-panel design: rich dark sidebar with featured items + a light cream content area with full menu.",
    config: {
      primaryColor: "#C5A059",
      secondaryColor: "#6B4F31",
      backgroundColor: "#FAF3E0",
      headlineFont: "Cormorant Garamond",
      bodyFont: "Lato",
      borderRadius: "0.25rem",
      layoutDensity: "spacious",
      cardStyle: "flat",
    },
  },
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    label: "Luxury",
    category: "fine-dining",
    tier: "pro",
    image: "",
    description: "Upscale near-black menu with gold ornamental dividers, dotted-leader items, and spacious elegant typography.",
    config: {
      primaryColor: "#C5A059",
      secondaryColor: "rgba(253,252,240,0.5)",
      backgroundColor: "#0F0F0F",
      headlineFont: "Cormorant Garamond",
      bodyFont: "Inter",
      borderRadius: "0.25rem",
      layoutDensity: "spacious",
      cardStyle: "flat",
    },
  },
];

export const analyticsData = {
  kpis: {
    revenue: { value: "$24,850", change: "+12%" },
    orders: { value: "1,284", change: "+8%" },
    avgValue: { value: "$19.35", change: "+4%" },
    conversion: { value: "8.2%", change: "+1.4%" },
  },
  peakHours: [
    { hour: "11A", value: 25 },
    { hour: "1P", value: 65 },
    { hour: "3P", value: 40 },
    { hour: "5P", value: 75 },
    { hour: "7P", value: 95 },
    { hour: "9P", value: 80 },
    { hour: "11P", value: 30 },
  ],
  liveActivity: [
    { initials: "JD", name: "John D.", action: "ordered Burgers", time: "2 mins ago", source: "WhatsApp", amount: "$42.50" },
    { initials: "SM", name: "Sarah M.", action: "viewing menu", time: "5 mins ago", source: "", amount: "" },
    { initials: "AK", name: "Alex K.", action: "ordered Pizza", time: "12 mins ago", source: "WhatsApp", amount: "$18.20" },
  ],
};

export const pricingPlans = [
  {
    name: "Free",
    price: "Free",
    period: "",
    amountRwf: 0,
    features: ["1 Digital Menu", "Standard QR Code", "Basic Analytics"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "35,000 RWF",
    period: "/ month",
    amountRwf: 35000,
    features: ["Unlimited Menus", "Custom Branded QR", "Live Analytics & Insights", "WhatsApp Ordering"],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "89,000 RWF",
    period: "/ month",
    amountRwf: 89000,
    features: ["Multi-location Admin", "POS Integration", "Priority Support"],
    cta: "Contact Sales",
    popular: false,
  },
];

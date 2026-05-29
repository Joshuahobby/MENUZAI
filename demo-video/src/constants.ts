// Brand tokens — exact match to app/src/app/globals.css @theme
export const BRAND = {
  primary: "#a04100",
  primaryContainer: "#FF6B00",
  tertiary: "#006e2a",
  tertiaryContainer: "#00b149",
  surface: "#fcf9f8",
  surfaceContainer: "#f0eded",
  surfaceContainerLow: "#f6f3f2",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#1b1b1c",
  onSurfaceVariant: "#5a4136",
  secondary: "#5f5e5e",
  whatsapp: "#25D366",
  outlineVariant: "#e2bfb0",
  error: "#ba1a1a",
  amber500: "#f59e0b",
  blue500: "#3b82f6",
  emerald500: "#10b981",
  violet500: "#8b5cf6",
};

export const MOCK_RESTAURANT = {
  name: "Le Bistro",
  fullName: "The Bistro & Grill",
  primaryColor: "#FF6B00",
  tableNumber: "7",
};

export const MOCK_ITEMS = [
  {
    id: "1",
    name: "Truffle Ribeye Steak",
    price: 38000,
    description: "Prime cut, house truffle butter, seasonal vegetables",
    badge: "bestseller",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=400&fit=crop",
    category: "Mains",
  },
  {
    id: "2",
    name: "Mediterranean Salmon",
    price: 24000,
    description: "Pan-seared fillet, lemon caper sauce, wild rice",
    badge: "healthy",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop",
    category: "Mains",
  },
  {
    id: "3",
    name: "Molten Lava Cake",
    price: 14000,
    description: "Warm chocolate centre, vanilla bean ice cream",
    badge: "new",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=400&fit=crop",
    category: "Desserts",
  },
];

export const MOCK_ORDERS = [
  {
    id: "ord-001",
    customerName: "Amara K.",
    tableNumber: "3",
    status: "pending" as const,
    total: 38000,
    source: "ai_waiter",
    items: [{ name: "Truffle Ribeye Steak", qty: 1, price: 38000 }],
  },
  {
    id: "ord-002",
    customerName: "Jean-Paul M.",
    tableNumber: "7",
    status: "preparing" as const,
    total: 62000,
    source: "whatsapp",
    items: [
      { name: "Mediterranean Salmon", qty: 2, price: 24000 },
      { name: "Molten Lava Cake", qty: 1, price: 14000 },
    ],
  },
  {
    id: "ord-003",
    customerName: "Grace U.",
    tableNumber: "12",
    status: "confirmed" as const,
    total: 55500,
    source: "ai_waiter",
    items: [{ name: "The Menuza Royale", qty: 3, price: 18500 }],
  },
];

// Single source of truth for all scene timing (30fps)
export const FRAMES = {
  INTRO_START:     0,    INTRO_END:     150,   // 0:00–0:05  (5s)
  MENU_START:      150,  MENU_END:      750,   // 0:05–0:25 (20s)
  CHAT_START:      750,  CHAT_END:      1380,  // 0:25–0:46 (21s)
  DASH_START:      1380, DASH_END:      2160,  // 0:46–1:12 (26s)
  QR_START:        2160, QR_END:        2700,  // 1:12–1:30 (18s)
  TOTAL:           2700,
} as const;

export function fmtPrice(n: number): string {
  return `RWF ${n.toLocaleString("en-US")}`;
}

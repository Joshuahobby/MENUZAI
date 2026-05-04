export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags: string[];
  badge?: string;
  margin?: number;
  orders?: number;
  available?: boolean; // undefined / true = available; false = sold out
}

export interface MenuCategory {
  id: string;
  name: string;
  hidden?: boolean;
  image?: string;
}

export interface MenuStyle {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  accentColor?: string;
  titleColor?: string;
  sectionTitleColor?: string;
  itemTextColor?: string;
  priceTextColor?: string;
  dividerColor?: string;

  // Fonts
  headlineFont: string;
  bodyFont: string;
  titleSize?: number;
  sectionTitleSize?: number;
  itemTextSize?: number;

  // Layout & Spacing
  borderRadius: string;
  layoutDensity: "compact" | "comfortable" | "spacious";
  cardStyle: "flat" | "elevated" | "glass";
  pagePadding?: number;
  itemSpacing?: number;

  // Configuration
  currency: string;
  showImages?: boolean;
  templateId?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

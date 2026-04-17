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
  itemCount: number;
}

export interface MenuStyle {
  primaryColor: string;
  headlineFont: string;
  bodyFont: string;
  borderRadius: string;
  layoutDensity: "compact" | "comfortable" | "spacious";
  currency: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

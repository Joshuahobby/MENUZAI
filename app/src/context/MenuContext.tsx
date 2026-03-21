"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { menuItems as mockItems, categories as mockCategories } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags: string[];
  badge?: string; // Changed from specific literals to string
  margin?: number;
  orders?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  itemCount: number;
}

export interface MenuStyle {
  primaryColor: string;
  secondaryColor: string;
  headlineFont: string;
  bodyFont: string;
  borderRadius: string;
  layoutDensity: "compact" | "comfortable" | "spacious";
  theme: "light" | "dark" | "glass";
}

interface MenuContextType {
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  categories: MenuCategory[];
  setCategories: React.Dispatch<React.SetStateAction<MenuCategory[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  menuStyle: MenuStyle;
  setMenuStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
  // Actions
  addCategory: (name: string) => void;
  addItem: (categoryId: string) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<MenuItem>) => void;
  applyTemplate: (style: Partial<MenuStyle>) => void;
  isSyncing: boolean;
  lastSynced: Date | null;
}

const defaultStyle: MenuStyle = {
  primaryColor: "#FF6B00",
  secondaryColor: "#1E1E1E",
  headlineFont: "Plus Jakarta Sans",
  bodyFont: "Inter",
  borderRadius: "2rem",
  layoutDensity: "comfortable",
  theme: "light",
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [restaurantName, setRestaurantName] = useState("Le Bistro");
  const [categories, setCategories] = useState<MenuCategory[]>(mockCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockItems);
  const [menuStyle, setMenuStyle] = useState<MenuStyle>(defaultStyle);
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // 1. Handle Auth State
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Menu from DB if logged in
  useEffect(() => {
    if (!user) return;

    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setRestaurantName(data.restaurant_name);
        setCategories(data.categories);
        setMenuItems(data.items);
        setMenuStyle(data.style);
        setLastSynced(new Date(data.updated_at));
      }
      isInitialLoad.current = false;
    };

    fetchMenu();
  }, [user]);

  // 3. Auto-save with Debounce
  useEffect(() => {
    if (!user || isInitialLoad.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      const { error } = await supabase
        .from('menus')
        .upsert({
          user_id: user.id,
          restaurant_name: restaurantName,
          categories: categories,
          items: menuItems,
          style: menuStyle,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (!error) setLastSynced(new Date());
      setIsSyncing(false);
    }, 2000); // 2 second debounce

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [restaurantName, categories, menuItems, menuStyle, user]);

  const addCategory = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    setCategories((prev) => [...prev, { id, name, itemCount: 0 }]);
  };

  const addItem = (categoryId: string) => {
    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: "New Item",
      description: "Description of your delicious new dish.",
      price: 0,
      category: categoryId,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
      tags: [],
    };
    setMenuItems((prev) => [...prev, newItem]);
    setCategories((prev) => 
      prev.map((c) => c.id === categoryId ? { ...c, itemCount: c.itemCount + 1 } : c)
    );
  };

  const removeItem = (itemId: string) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    setCategories((prev) => 
      prev.map((c) => c.id === item.category ? { ...c, itemCount: Math.max(0, c.itemCount - 1) } : c)
    );
  };

  const updateItem = (itemId: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((i) => i.id === itemId ? { ...i, ...updates } : i));
  };

  const applyTemplate = (style: Partial<MenuStyle>) => {
    setMenuStyle((prev) => ({ ...prev, ...style }));
  };

  return (
    <MenuContext.Provider value={{
      restaurantName,
      setRestaurantName,
      categories,
      setCategories,
      menuItems,
      setMenuItems,
      menuStyle,
      setMenuStyle,
      addCategory,
      addItem,
      removeItem,
      updateItem,
      applyTemplate,
      isSyncing,
      lastSynced
    }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}

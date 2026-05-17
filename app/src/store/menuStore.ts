/**
 * menuStore.ts — Zustand store for menu editor state
 *
 * This store holds the high-frequency state that was previously inside
 * MenuContext's useState calls. Components that subscribe with selectors
 * (e.g. `useMenuStore(s => s.menuItems)`) only re-render when that exact
 * slice changes — eliminating the broad re-renders caused by React Context.
 *
 * MenuContext remains the public API and still handles all side-effects
 * (Supabase save, publish, etc.). It reads/writes this store internally.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { MenuItem, MenuCategory, MenuStyle } from "@/types/menu";
export const defaultStyle: MenuStyle = {
  primaryColor: "#FF6B00",
  secondaryColor: "#1E1E1E",
  backgroundColor: "#FFFFFF",
  headlineFont: "Plus Jakarta Sans",
  bodyFont: "Inter",
  borderRadius: "2rem",
  layoutDensity: "comfortable",
  cardStyle: "elevated",
  currency: "RWF",
};

interface MenuStoreState {
  // ── Core data ──────────────────────────────────────────────────────────
  restaurantName: string;
  restaurantId: string | null;
  restaurantPhone: string;
  restaurantLogoUrl: string;
  plan: string;
  onboarded: boolean;
  activeMenuId: string | null;
  activeMenuName: string;
  menuStatus: "draft" | "published";
  menuSlug: string | null;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  menuStyle: MenuStyle;
  // ── Sync state ─────────────────────────────────────────────────────────
  isSyncing: boolean;
  lastSynced: Date | null;
  isLoading: boolean;
  // ── RBAC state ─────────────────────────────────────────────────────────
  userRole: "owner" | "manager" | "staff" | null;
}

interface MenuStoreActions {
  // Setters — fine-grained to avoid broad re-renders
  setRestaurantName: (name: string) => void;
  setRestaurantId: (id: string | null) => void;
  setRestaurantPhone: (phone: string) => void;
  setRestaurantLogoUrl: (url: string) => void;
  setPlan: (plan: string) => void;
  setOnboarded: (value: boolean) => void;
  setActiveMenuId: (id: string | null) => void;
  setActiveMenuName: (name: string) => void;
  setMenuStatus: (status: "draft" | "published") => void;
  setMenuSlug: (slug: string | null) => void;
  setCategories: (cats: MenuCategory[] | ((prev: MenuCategory[]) => MenuCategory[])) => void;
  setMenuItems: (items: MenuItem[] | ((prev: MenuItem[]) => MenuItem[])) => void;
  setMenuStyle: (style: MenuStyle | ((prev: MenuStyle) => MenuStyle)) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSynced: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  // Bulk hydration — called once on bootstrap load
  hydrate: (data: Partial<MenuStoreState>) => void;
  // Granular item update — avoids full array replacement
  updateItem: (itemId: string, updates: Partial<MenuItem>) => void;
  setUserRole: (role: "owner" | "manager" | "staff" | null) => void;
}

export type MenuStore = MenuStoreState & MenuStoreActions;

export const useMenuStore = create<MenuStore>()(
  subscribeWithSelector((set) => ({
    // ── Initial state ───────────────────────────────────────────────────
    restaurantName: "",
    restaurantId: null,
    restaurantPhone: "",
    restaurantLogoUrl: "",
    plan: "free",
    onboarded: false,
    activeMenuId: null,
    activeMenuName: "My Menu",
    menuStatus: "draft",
    menuSlug: null,
    categories: [],
    menuItems: [],
    menuStyle: defaultStyle,
    isSyncing: false,
    lastSynced: null,
    isLoading: true,
    userRole: null,

    // ── Setters ─────────────────────────────────────────────────────────
    setRestaurantName: (name) => set({ restaurantName: name }),
    setRestaurantId: (id) => set({ restaurantId: id }),
    setRestaurantPhone: (phone) => set({ restaurantPhone: phone }),
    setRestaurantLogoUrl: (url) => set({ restaurantLogoUrl: url }),
    setPlan: (plan) => set({ plan }),
    setOnboarded: (value) => set({ onboarded: value }),
    setActiveMenuId: (id) => set({ activeMenuId: id }),
    setActiveMenuName: (name) => set({ activeMenuName: name }),
    setMenuStatus: (status) => set({ menuStatus: status }),
    setMenuSlug: (slug) => set({ menuSlug: slug }),
    setCategories: (cats) =>
      set((state) => ({
        categories: typeof cats === "function" ? cats(state.categories) : cats,
      })),
    setMenuItems: (items) =>
      set((state) => ({
        menuItems: typeof items === "function" ? items(state.menuItems) : items,
      })),
    setMenuStyle: (style) =>
      set((state) => ({
        menuStyle: typeof style === "function" ? style(state.menuStyle) : style,
      })),
    setIsSyncing: (syncing) => set({ isSyncing: syncing }),
    setLastSynced: (date) => set({ lastSynced: date }),
    setIsLoading: (loading) => set({ isLoading: loading }),

    // ── Bulk hydration ───────────────────────────────────────────────────
    hydrate: (data) => set(data),

    // ── Granular item update — prevents full re-renders on item change ───
    updateItem: (itemId, updates) =>
      set((state) => ({
        menuItems: state.menuItems.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      })),
    setUserRole: (role) => set({ userRole: role }),
  }))
);

// ── Selector hooks (use these in components for optimal performance) ────────
export const useMenuItems = () => useMenuStore((s) => s.menuItems);
export const useCategories = () => useMenuStore((s) => s.categories);
export const useMenuStyle = () => useMenuStore((s) => s.menuStyle);
export const useIsSyncing = () => useMenuStore((s) => s.isSyncing);
export const useLastSynced = () => useMenuStore((s) => s.lastSynced);
export const useIsLoading = () => useMenuStore((s) => s.isLoading);
export const useActiveMenuId = () => useMenuStore((s) => s.activeMenuId);
export const useRestaurantName = () => useMenuStore((s) => s.restaurantName);
export const useUserRole = () => useMenuStore((s) => s.userRole);

"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { canCreateMenu, canPublishMenu } from "@/lib/plans";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useMenuBootstrap } from "@/hooks/useMenuBootstrap";
import { useMenuStore, defaultStyle } from "@/store/menuStore";

// Re-export shared types for backward compatibility
export type { MenuItem, MenuCategory, MenuStyle } from "@/types/menu";
import type { MenuItem, MenuCategory, MenuStyle } from "@/types/menu";

interface MenuContextType {
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  restaurantId: string | null;
  restaurantPhone: string;
  setRestaurantPhone: (phone: string) => void;
  restaurantLogoUrl: string;
  setRestaurantLogoUrl: (url: string) => void;
  plan: string;
  setPlan: (plan: string) => void;
  planExpiresAt: string | null;
  categories: MenuCategory[];
  setCategories: (cats: MenuCategory[] | ((prev: MenuCategory[]) => MenuCategory[])) => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[] | ((prev: MenuItem[]) => MenuItem[])) => void;
  menuStyle: MenuStyle;
  setMenuStyle: (style: MenuStyle | ((prev: MenuStyle) => MenuStyle)) => void;
  activeMenuId: string | null;
  activeMenuName: string;
  menuStatus: "draft" | "published";
  menuSlug: string | null;
  onboarded: boolean;
  setOnboarded: (value: boolean) => void;
  // Actions
  addCategory: (name: string) => void;
  renameCategory: (categoryId: string, name: string) => void;
  removeCategory: (categoryId: string) => void;
  toggleCategoryVisibility: (categoryId: string) => void;
  addItem: (categoryId: string) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<MenuItem>) => void;
  duplicateItem: (itemId: string) => void;
  applyTemplate: (style: Partial<MenuStyle>) => void;
  publishMenu: (targetMenuId?: string) => Promise<string | null>;
  unpublishMenu: () => Promise<void>;
  switchMenu: (menuId: string) => Promise<void>;
  createMenu: (name: string) => Promise<string | null>;
  deleteMenu: (menuId: string) => Promise<boolean>;
  renameMenu: (menuId: string, name: string) => Promise<boolean>;
  duplicateMenu: (menuId: string) => Promise<string | null>;
  isSyncing: boolean;
  lastSynced: Date | null;
  isLoading: boolean;
  user: User | null;
  userRole: "owner" | "manager" | "staff" | null;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  // Bootstrap handles auth + initial data load → writes to Zustand store
  const { user } = useMenuBootstrap();

  // Read everything from Zustand store (fine-grained subscriptions in components)
  const {
    isLoading, setIsLoading,
    restaurantId,
    restaurantName, setRestaurantName,
    restaurantPhone, setRestaurantPhone,
    restaurantLogoUrl, setRestaurantLogoUrl,
    plan, setPlan,
    planExpiresAt,
    onboarded, setOnboarded,
    activeMenuId, setActiveMenuId,
    activeMenuName, setActiveMenuName,
    menuStatus, setMenuStatus,
    menuSlug, setMenuSlug,
    categories, setCategories,
    menuItems, setMenuItems,
    menuStyle, setMenuStyle,
    lastSynced, setLastSynced,
    isSyncing, setIsSyncing,
    updateItem: storeUpdateItem,
    userRole,
  } = useMenuStore();

  const menuSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restaurantSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Mark initial load complete once bootstrap finishes
  useEffect(() => {
    if (!isLoading) {
      const id = setTimeout(() => { isInitialLoad.current = false; }, 50);
      return () => clearTimeout(id);
    }
  }, [isLoading]);

  // Always-current snapshot of state used by callbacks to avoid stale closures
  const latestRef = useRef({ categories, menuItems, menuStyle, activeMenuId, restaurantId });
  latestRef.current = { categories, menuItems, menuStyle, activeMenuId, restaurantId };

  // Auto-save menu content with debounce (1 s)
  useEffect(() => {
    if (!user || !activeMenuId || !restaurantId || isInitialLoad.current) return;

    if (menuSaveTimeoutRef.current) clearTimeout(menuSaveTimeoutRef.current);
    setIsSyncing(true);

    menuSaveTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from("menus")
        .upsert(
          {
            id: activeMenuId,
            user_id: user.id,
            restaurant_id: restaurantId, // Required: RLS WITH CHECK calls check_staff_role(restaurant_id,...)
            categories,
            items: menuItems,
            style: menuStyle,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Auto-save failed:", error);
        toast.error("Failed to save changes", { description: error.message });
      } else {
        setLastSynced(new Date());
      }
      setIsSyncing(false);
    }, 1000);

    return () => { if (menuSaveTimeoutRef.current) clearTimeout(menuSaveTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, menuItems, menuStyle, user?.id, activeMenuId, restaurantId]);

  // Auto-save restaurant name with debounce (1 s)
  useEffect(() => {
    if (!user || !restaurantId || isInitialLoad.current) return;

    if (restaurantSaveTimeoutRef.current) clearTimeout(restaurantSaveTimeoutRef.current);
    setIsSyncing(true);

    restaurantSaveTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from("restaurants")
        .update({ name: restaurantName })
        .eq("id", restaurantId);
      setIsSyncing(false);
    }, 1000);

    return () => { if (restaurantSaveTimeoutRef.current) clearTimeout(restaurantSaveTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantName, user?.id, restaurantId]);

  // Flush any pending save immediately (used before switching menus)
  const flushPendingSave = useCallback(async () => {
    if (!menuSaveTimeoutRef.current) return;
    clearTimeout(menuSaveTimeoutRef.current);
    menuSaveTimeoutRef.current = null;
    const { activeMenuId: menuId, categories: cats, menuItems: items, menuStyle: style, restaurantId: rId } = latestRef.current;
    if (!user || !menuId || !rId) return;
    await supabase.from("menus").upsert(
      { id: menuId, user_id: user.id, restaurant_id: rId, categories: cats, items, style, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  }, [user]);

  const publishMenu = useCallback(async (targetMenuId?: string): Promise<string | null> => {
    const menuId = targetMenuId ?? activeMenuId;
    if (!menuId || !user) return null;

    const { data: publishedMenus } = await supabase
      .from("menus")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "published")
      .neq("id", menuId);

    const publishCheck = canPublishMenu(plan, publishedMenus?.length ?? 0);
    if (!publishCheck.allowed) {
      toast.error("Published menu limit reached.", { description: publishCheck.reason });
      return null;
    }

    setIsSyncing(true);

    let slug: string | null = menuId === activeMenuId ? menuSlug : null;
    if (!slug) {
      const { data: menuData } = await supabase
        .from("menus")
        .select("slug")
        .eq("id", menuId)
        .maybeSingle();
      slug = menuData?.slug ?? null;
    }
    if (!slug) {
      const base = generateSlug(restaurantName || "menu");
      slug = await ensureUniqueSlug(base);
    }

    const { error } = await supabase
      .from("menus")
      .update({ status: "published", slug })
      .eq("id", menuId);

    setIsSyncing(false);
    if (error) return null;

    if (menuId === activeMenuId) {
      setMenuStatus("published");
      setMenuSlug(slug);
    }
    return slug;
  }, [activeMenuId, user, menuSlug, restaurantName, plan]);

  const unpublishMenu = useCallback(async (): Promise<void> => {
    if (!activeMenuId || !user) return;
    setIsSyncing(true);
    const { error } = await supabase
      .from("menus")
      .update({ status: "draft" })
      .eq("id", activeMenuId);
    if (!error) setMenuStatus("draft");
    setIsSyncing(false);
  }, [activeMenuId, user]);

  const addCategory = (name: string) => {
    const id = crypto.randomUUID();
    setCategories((prev) => [...prev, { id, name }]);
  };

  const renameCategory = (categoryId: string, name: string) => {
    setCategories((prev) => prev.map((c) => c.id === categoryId ? { ...c, name } : c));
  };

  const toggleCategoryVisibility = (categoryId: string) => {
    setCategories((prev) => prev.map((c) => c.id === categoryId ? { ...c, hidden: !c.hidden } : c));
  };

  const removeCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setMenuItems((prev) => prev.filter((i) => i.category !== categoryId));
  };

  const addItem = (categoryId: string) => {
    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      name: "New Item",
      description: "Description of your delicious new dish.",
      price: 0,
      category: categoryId,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
      tags: [],
    };
    setMenuItems((prev) => [...prev, newItem]);
  };

  const removeItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Use the Zustand store's granular updateItem to avoid full-array replacement
  const updateItem = (itemId: string, updates: Partial<MenuItem>) => {
    storeUpdateItem(itemId, updates);
  };

  const duplicateItem = (itemId: string) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;
    const newItem: MenuItem = { ...item, id: crypto.randomUUID(), name: `${item.name} (copy)` };
    setMenuItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      const next = [...prev];
      next.splice(idx + 1, 0, newItem);
      return next;
    });
  };

  const applyTemplate = (style: Partial<MenuStyle>) => {
    setMenuStyle((prev) => ({ ...prev, ...style }));
  };

  const switchMenu = useCallback(async (menuId: string): Promise<void> => {
    if (!user || menuId === activeMenuId) return;

    await flushPendingSave();

    setIsLoading(true);
    isInitialLoad.current = true;

    const { data: menu } = await supabase
      .from("menus")
      .select("*")
      .eq("id", menuId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (menu) {
      setActiveMenuId(menu.id);
      setActiveMenuName(menu.name ?? "My Menu");
      setMenuStatus(menu.status === "published" ? "published" : "draft");
      setMenuSlug(menu.slug ?? null);
      setCategories(menu.categories ?? []);
      setMenuItems(menu.items ?? []);
      setMenuStyle(menu.style && Object.keys(menu.style).length > 0 ? menu.style : defaultStyle);
      setLastSynced(new Date(menu.updated_at));
    }

    isInitialLoad.current = false;
    setIsLoading(false);
  }, [user, activeMenuId, flushPendingSave]);

  const createMenu = useCallback(async (name: string): Promise<string | null> => {
    if (!user || !restaurantId) return null;

    const { data: allMenus } = await supabase
      .from("menus")
      .select("id")
      .eq("user_id", user.id);

    const createCheck = canCreateMenu(plan, allMenus?.length ?? 0);
    if (!createCheck.allowed) {
      toast.error("Menu limit reached.", { description: createCheck.reason });
      return null;
    }

    const { data: newMenu, error } = await supabase
      .from("menus")
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        name,
        categories: [],
        items: [],
        style: defaultStyle,
      })
      .select("id")
      .single();

    if (error || !newMenu) return null;

    isInitialLoad.current = true;
    setActiveMenuId(newMenu.id);
    setActiveMenuName(name);
    setMenuStatus("draft");
    setMenuSlug(null);
    setCategories([]);
    setMenuItems([]);
    setMenuStyle(defaultStyle);
    setLastSynced(null);
    isInitialLoad.current = false;

    return newMenu.id;
  }, [user, restaurantId, plan]);

  const deleteMenu = useCallback(async (menuId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("menus")
      .delete()
      .eq("id", menuId)
      .eq("user_id", user.id);

    if (error) return false;

    if (menuId === activeMenuId) {
      isInitialLoad.current = true;
      const { data: nextMenu } = await supabase
        .from("menus")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nextMenu) {
        setActiveMenuId(nextMenu.id);
        setActiveMenuName(nextMenu.name ?? "My Menu");
        setMenuStatus(nextMenu.status === "published" ? "published" : "draft");
        setMenuSlug(nextMenu.slug ?? null);
        setCategories(nextMenu.categories ?? []);
        setMenuItems(nextMenu.items ?? []);
        setMenuStyle(nextMenu.style && Object.keys(nextMenu.style).length > 0 ? nextMenu.style : defaultStyle);
      } else {
        const { data: freshMenu } = await supabase
          .from("menus")
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId,
            name: "My Menu",
            categories: [],
            items: [],
            style: defaultStyle,
          })
          .select("id")
          .single();

        if (freshMenu) {
          setActiveMenuId(freshMenu.id);
          setActiveMenuName("My Menu");
          setMenuStatus("draft");
          setMenuSlug(null);
          setCategories([]);
          setMenuItems([]);
          setMenuStyle(defaultStyle);
        }
      }
      isInitialLoad.current = false;
    }

    return true;
  }, [user, activeMenuId, restaurantId]);

  const renameMenu = useCallback(async (menuId: string, name: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase
      .from("menus")
      .update({ name })
      .eq("id", menuId)
      .eq("user_id", user.id);
    if (error) return false;
    if (menuId === activeMenuId) setActiveMenuName(name);
    return true;
  }, [user, activeMenuId]);

  const duplicateMenu = useCallback(async (menuId: string): Promise<string | null> => {
    if (!user || !restaurantId) return null;

    const { data: allMenus } = await supabase
      .from("menus")
      .select("id")
      .eq("user_id", user.id);

    const createCheck = canCreateMenu(plan, allMenus?.length ?? 0);
    if (!createCheck.allowed) {
      toast.error("Menu limit reached.", { description: createCheck.reason });
      return null;
    }

    const { data: sourceMenu } = await supabase
      .from("menus")
      .select("name, categories, items, style")
      .eq("id", menuId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sourceMenu) return null;

    const { data: newMenu, error } = await supabase
      .from("menus")
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        name: `${sourceMenu.name} (copy)`,
        categories: sourceMenu.categories ?? [],
        items: sourceMenu.items ?? [],
        style: sourceMenu.style ?? defaultStyle,
      })
      .select("id")
      .single();

    if (error || !newMenu) return null;
    return newMenu.id;
  }, [user, restaurantId, plan]);

  return (
    <MenuContext.Provider value={{
      restaurantName,
      setRestaurantName,
      restaurantId,
      restaurantPhone,
      setRestaurantPhone,
      restaurantLogoUrl,
      setRestaurantLogoUrl,
      plan,
      setPlan,
      planExpiresAt,
      categories,
      setCategories,
      menuItems,
      setMenuItems,
      menuStyle,
      setMenuStyle,
      activeMenuId,
      activeMenuName,
      menuStatus,
      menuSlug,
      onboarded,
      setOnboarded,
      addCategory,
      renameCategory,
      removeCategory,
      toggleCategoryVisibility,
      addItem,
      removeItem,
      updateItem,
      duplicateItem,
      applyTemplate,
      publishMenu,
      unpublishMenu,
      switchMenu,
      createMenu,
      deleteMenu,
      renameMenu,
      duplicateMenu,
      isSyncing,
      lastSynced,
      isLoading,
      user,
      userRole,
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

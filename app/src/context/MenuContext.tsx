"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { canCreateMenu, canPublishMenu } from "@/lib/plans";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

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
  categories: MenuCategory[];
  setCategories: React.Dispatch<React.SetStateAction<MenuCategory[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  menuStyle: MenuStyle;
  setMenuStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
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
  addItem: (categoryId: string) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<MenuItem>) => void;
  duplicateItem: (itemId: string) => void;
  applyTemplate: (style: Partial<MenuStyle>) => void;
  publishMenu: () => Promise<string | null>;
  unpublishMenu: () => Promise<void>;
  switchMenu: (menuId: string) => Promise<void>;
  createMenu: (name: string) => Promise<string | null>;
  deleteMenu: (menuId: string) => Promise<boolean>;
  renameMenu: (menuId: string, name: string) => Promise<boolean>;
  isSyncing: boolean;
  lastSynced: Date | null;
  isLoading: boolean;
  user: User | null;
}

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
  layoutStyle: "default",
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuStyle, setMenuStyle] = useState<MenuStyle>(defaultStyle);
  const [user, setUser] = useState<User | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuName, setActiveMenuName] = useState("My Menu");
  const [menuStatus, setMenuStatus] = useState<"draft" | "published">("draft");
  const [menuSlug, setMenuSlug] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState<boolean>(false); // Default false to ensure onboarding guard works
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState("");
  const [plan, setPlan] = useState("free");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const menuSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restaurantSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);
  const isBootstrappingRef = useRef(false);
  const preventBootstrapRef = useRef(false); // Set after auth failure; cleared only on genuine sign-out
  const bootstrappedForUserRef = useRef<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 1. Track auth state — rely solely on onAuthStateChange (fires INITIAL_SESSION on setup)
  //    to avoid competing for the gotrue lock with bootstrap's REST calls.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. On login: ensure restaurant row exists, then load the active menu
  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      // Reset to defaults when logged out.
      // Do NOT clear preventBootstrapRef here — if it was set by handleUnauthorized,
      // we need it to hold through Supabase's internal SIGNED_OUT→SIGNED_IN cycling
      // until window.location.replace('/login') completes. After navigation the
      // component unmounts and all refs reset naturally.
      isBootstrappingRef.current = false;
      bootstrappedForUserRef.current = null;
      isInitialLoad.current = true;
      setActiveMenuId(null);
      setRestaurantId(null);
      setRestaurantName("My Restaurant");
      setRestaurantPhone("");
      setRestaurantLogoUrl("");
      setCategories([]);
      setMenuItems([]);
      setMenuStyle(defaultStyle);
      setPlan("free");
      setIsLoading(false);
      return;
    }

    if (isBootstrappingRef.current || preventBootstrapRef.current) return;
    if (bootstrappedForUserRef.current === user.id) return;
    isBootstrappingRef.current = true;

    let cancelled = false;

    const bootstrap = async () => {
      setIsLoading(true);
      isInitialLoad.current = true;

      // ─── Auth helpers ──────────────────────────────────────────────────────
      // Covers both HTTP status codes and Supabase JS error-message patterns.
      const isAuthFailure = (status: number, error: { message?: string } | null) => {
        if (status === 401 || status === 403) return true;
        const msg = (error?.message ?? '').toLowerCase();
        return msg.includes('jwt') || msg.includes('api key') || msg.includes('not authenticated');
      };

      // Set the permanent guard, wipe local session, and hard-navigate so
      // Supabase's internal SIGNED_OUT→SIGNED_IN cycling cannot restart bootstrap.
      const handleUnauthorized = () => {
        preventBootstrapRef.current = true;
        supabase.auth.signOut({ scope: "local" }).catch(() => {});
        if (typeof window !== 'undefined') window.location.replace('/login');
      };

      try {
        // ─── 0. Serialize with gotrue's navigator.locks ────────────────────
        // onAuthStateChange's INITIAL_SESSION processing holds the auth lock
        // while it validates/refreshes the token. If we make REST calls before
        // it releases, every _getAccessToken() call queues behind it, the 5-second
        // timeout fires, lock-stealing triggers, concurrent refreshes pile up,
        // and Supabase rate-limits with 429 → all REST calls get 401.
        //
        // Calling getSession() here waits for the lock, ensuring any in-flight
        // token refresh completes before we make DB queries. After this returns
        // the token is cached in-memory and all subsequent calls are instantaneous.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!session || sessionError) {
          handleUnauthorized();
          return;
        }

        // --- Ensure restaurant row ---
        let restoId: string;

        const { data: existingRestaurant, error: selectError, status: selectStatus } = await supabase
          .from("restaurants")
          .select("id, name, phone, plan, logo_url, onboarded")
          .eq("user_id", user.id)
          .maybeSingle();

        if (isAuthFailure(selectStatus, selectError)) { handleUnauthorized(); return; }

        if (existingRestaurant) {
          restoId = existingRestaurant.id;
          if (!cancelled) {
            setRestaurantId(restoId);
            setRestaurantName(existingRestaurant.name);
            setRestaurantPhone(existingRestaurant.phone ?? "");
            setRestaurantLogoUrl(existingRestaurant.logo_url ?? "");
            setPlan(existingRestaurant.plan ?? "free");
            setOnboarded(existingRestaurant.onboarded ?? false);
          }
        } else {
          // Atomic upsert to avoid race conditions
          const { data: upsertedRestaurant, error: upsertError, status: upsertStatus } = await supabase
            .from("restaurants")
            .upsert({ user_id: user.id, name: "My Restaurant", onboarded: false }, { onConflict: "user_id", ignoreDuplicates: false })
            .select("id")
            .single();

          if (isAuthFailure(upsertStatus, upsertError)) { handleUnauthorized(); return; }

          if (upsertError || !upsertedRestaurant) {
            // If conflict, find the one that was just created
            const { data: fallback, error: fallbackError, status: fallbackStatus } = await supabase
              .from("restaurants")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();

            if (isAuthFailure(fallbackStatus, fallbackError)) { handleUnauthorized(); return; }

            if (!fallback) {
              console.error("Failed to bootstrap restaurant");
              preventBootstrapRef.current = true; // don't spin forever on non-auth failures either
              return;
            }
            restoId = fallback.id;
          } else {
            restoId = upsertedRestaurant.id;
          }
          if (!cancelled) {
            setRestaurantId(restoId);
            setOnboarded(false); // Newly created are NOT onboarded by default
          }
        }

        // --- Fetch most recent menu ---
        const { data: menu } = await supabase
          .from("menus")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (menu && !cancelled) {
          setActiveMenuId(menu.id);
          setActiveMenuName(menu.name ?? "My Menu");
          setMenuStatus(menu.status === "published" ? "published" : "draft");
          setMenuSlug(menu.slug ?? null);
          setCategories(menu.categories ?? []);
          setMenuItems(menu.items ?? []);
          setMenuStyle(menu.style && Object.keys(menu.style).length > 0 ? menu.style : defaultStyle);
          setLastSynced(new Date(menu.updated_at));
        } else if (!menu && !cancelled) {
          // Create default menu if none exist
          const { data: newMenu, error: insertError } = await supabase
            .from("menus")
            .insert({
              user_id: user.id,
              restaurant_id: restoId,
              name: "My Menu",
              categories: [],
              items: [],
              style: defaultStyle,
            })
            .select("id")
            .maybeSingle();

          if (insertError) {
            // Any insert failure (unique conflict, RLS, etc.) — re-fetch whatever exists
            const { data: lateMenu } = await supabase
              .from("menus")
              .select("*")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lateMenu && !cancelled) {
              setActiveMenuId(lateMenu.id);
              setActiveMenuName(lateMenu.name ?? "My Menu");
              setMenuStatus(lateMenu.status === "published" ? "published" : "draft");
              setMenuSlug(lateMenu.slug ?? null);
              setCategories(lateMenu.categories ?? []);
              setMenuItems(lateMenu.items ?? []);
              setMenuStyle(lateMenu.style && Object.keys(lateMenu.style).length > 0 ? lateMenu.style : defaultStyle);
            }
          } else if (newMenu && !cancelled) {
            setActiveMenuId(newMenu.id);
            setCategories([]);
            setMenuItems([]);
          }
        }
      } catch (err) {
        console.error("Bootstrap error:", err);
      } finally {
        if (!cancelled) {
          bootstrappedForUserRef.current = user.id;
          isInitialLoad.current = false;
          setIsLoading(false);
        }
        isBootstrappingRef.current = false;
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authChecked]);

  // 3. Auto-save menu data with debounce (2 s)
  useEffect(() => {
    if (!user || !activeMenuId || isInitialLoad.current) return;

    if (menuSaveTimeoutRef.current) clearTimeout(menuSaveTimeoutRef.current);
    setIsSyncing(true);

    menuSaveTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from("menus")
        .upsert(
          {
            id: activeMenuId,
            user_id: user.id,
            categories,
            items: menuItems,
            style: menuStyle,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (!error) setLastSynced(new Date());
      setIsSyncing(false);
    }, 1000); // Reduced to 1s for better responsiveness, especially in tests

    return () => { if (menuSaveTimeoutRef.current) clearTimeout(menuSaveTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, menuItems, menuStyle, user?.id, activeMenuId]);

  // 4. Auto-save restaurant name changes with debounce (1 s)
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

  const publishMenu = useCallback(async (): Promise<string | null> => {
    if (!activeMenuId || !user) return null;

    const { data: publishedMenus } = await supabase
      .from("menus")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "published")
      .neq("id", activeMenuId);

    const publishCheck = canPublishMenu(plan, publishedMenus?.length ?? 0);
    if (!publishCheck.allowed) {
      toast.error("Published menu limit reached.", { description: publishCheck.reason });
      return null;
    }

    setIsSyncing(true);
    let slug = menuSlug;
    if (!slug) {
      const base = generateSlug(restaurantName || "menu");
      slug = await ensureUniqueSlug(base);
    }

    const { error } = await supabase
      .from("menus")
      .update({ status: "published", slug })
      .eq("id", activeMenuId);

    if (!error) {
      setMenuStatus("published");
      setMenuSlug(slug);
      setIsSyncing(false);
      return slug;
    }
    setIsSyncing(false);
    return null;
  }, [activeMenuId, user, menuSlug, restaurantName, plan]);

  const unpublishMenu = useCallback(async (): Promise<void> => {
    if (!activeMenuId || !user) return;
    setIsSyncing(true);

    const { error } = await supabase
      .from("menus")
      .update({ status: "draft" })
      .eq("id", activeMenuId);

    if (!error) {
      setMenuStatus("draft");
    }
    setIsSyncing(false);
  }, [activeMenuId, user]);

  const addCategory = (name: string) => {
    const id = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    setCategories((prev) => [...prev, { id, name, itemCount: 0 }]);
  };

  const renameCategory = (categoryId: string, name: string) => {
    setCategories((prev) => prev.map((c) => c.id === categoryId ? { ...c, name } : c));
  };

  const removeCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setMenuItems((prev) => prev.filter((i) => i.category !== categoryId));
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

  const duplicateItem = (itemId: string) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;
    const newItem: MenuItem = { ...item, id: Math.random().toString(36).substr(2, 9), name: `${item.name} (copy)` };
    setMenuItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      const next = [...prev];
      next.splice(idx + 1, 0, newItem);
      return next;
    });
    setCategories((prev) => prev.map((c) => c.id === item.category ? { ...c, itemCount: c.itemCount + 1 } : c));
  };

  const applyTemplate = (style: Partial<MenuStyle>) => {
    // Overwrite style to feel like a fresh start (Canva-like)
    setMenuStyle({
      ...defaultStyle,
      ...style
    });
  };

  // --- Multi-menu: switch to a different menu by ID ---
  const switchMenu = useCallback(async (menuId: string): Promise<void> => {
    if (!user || menuId === activeMenuId) return;

    // Flush any pending save before switching
    if (menuSaveTimeoutRef.current) {
      clearTimeout(menuSaveTimeoutRef.current);
      menuSaveTimeoutRef.current = null;
    }

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
  }, [user, activeMenuId]);

  // --- Multi-menu: create a new blank menu ---
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

    // Auto-switch to the new menu
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

  // --- Multi-menu: delete a menu ---
  const deleteMenu = useCallback(async (menuId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("menus")
      .delete()
      .eq("id", menuId)
      .eq("user_id", user.id);

    if (error) return false;

    // If we deleted the active menu, load the most recent remaining one
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
        // No menus left — create a fresh one
        const { data: freshMenu } = await supabase
          .from("menus")
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId!,
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

  // --- Multi-menu: rename a menu ---
  const renameMenu = useCallback(async (menuId: string, name: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("menus")
      .update({ name })
      .eq("id", menuId)
      .eq("user_id", user.id);

    if (error) return false;

    if (menuId === activeMenuId) {
      setActiveMenuName(name);
    }

    return true;
  }, [user, activeMenuId]);

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
      isSyncing,
      lastSynced,
      isLoading,
      user,
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

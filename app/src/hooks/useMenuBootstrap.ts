"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { defaultStyle } from "@/context/MenuContext";
import type { MenuItem, MenuCategory, MenuStyle } from "@/types/menu";
import type { User } from "@supabase/supabase-js";

export interface BootstrapState {
  user: User | null;
  authChecked: boolean;
  isLoading: boolean;
  restaurantId: string | null;
  restaurantName: string;
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
  lastSynced: Date | null;
}

interface BootstrapActions {
  setIsLoading: (loading: boolean) => void;
  setRestaurantName: (name: string) => void;
  setRestaurantPhone: (phone: string) => void;
  setRestaurantLogoUrl: (url: string) => void;
  setPlan: (plan: string) => void;
  setOnboarded: (value: boolean) => void;
  setCategories: React.Dispatch<React.SetStateAction<MenuCategory[]>>;
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  setMenuStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
  setActiveMenuId: (id: string | null) => void;
  setActiveMenuName: (name: string) => void;
  setMenuStatus: (status: "draft" | "published") => void;
  setMenuSlug: (slug: string | null) => void;
  setRestaurantId: (id: string | null) => void;
  setLastSynced: (date: Date | null) => void;
}

/**
 * Encapsulates the auth listener + restaurant/menu bootstrap logic
 * that was previously inline in MenuProvider (~180 lines).
 *
 * Returns both the bootstrap state and the setters needed by the
 * rest of MenuContext.
 */
export function useMenuBootstrap(): BootstrapState & BootstrapActions {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState("");
  const [plan, setPlan] = useState("free");
  const [onboarded, setOnboarded] = useState<boolean>(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuName, setActiveMenuName] = useState("My Menu");
  const [menuStatus, setMenuStatus] = useState<"draft" | "published">("draft");
  const [menuSlug, setMenuSlug] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuStyle, setMenuStyle] = useState<MenuStyle>(defaultStyle);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const isInitialLoadRef = useRef(true);
  const isBootstrappingRef = useRef(false);
  const preventBootstrapRef = useRef(false);
  const bootstrappedForUserRef = useRef<string | null>(null);

  // 1. Auth listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Bootstrap restaurant + menu on login
  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      isBootstrappingRef.current = false;
      bootstrappedForUserRef.current = null;
      isInitialLoadRef.current = true;
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

    const isAuthFailure = (status: number, error: { message?: string } | null) => {
      if (status === 401 || status === 403) return true;
      const msg = (error?.message ?? "").toLowerCase();
      return msg.includes("jwt") || msg.includes("api key") || msg.includes("not authenticated");
    };

    const handleUnauthorized = () => {
      preventBootstrapRef.current = true;
      supabase.auth.signOut({ scope: "local" }).catch(() => {});
      if (typeof window !== "undefined") window.location.replace("/login");
    };

    const bootstrap = async () => {
      setIsLoading(true);
      isInitialLoadRef.current = true;

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (!session || sessionError) {
          handleUnauthorized();
          return;
        }

        let restoId: string;

        const { data: existingRestaurant, error: selectError, status: selectStatus } = await supabase
          .from("restaurants")
          .select("id, name, phone, plan, logo_url, onboarded")
          .eq("user_id", user.id)
          .maybeSingle();

        if (isAuthFailure(selectStatus, selectError)) {
          handleUnauthorized();
          return;
        }

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
          const { data: upsertedRestaurant, error: upsertError, status: upsertStatus } = await supabase
            .from("restaurants")
            .upsert({ user_id: user.id, name: "My Restaurant", onboarded: false }, { onConflict: "user_id", ignoreDuplicates: false })
            .select("id")
            .single();

          if (isAuthFailure(upsertStatus, upsertError)) {
            handleUnauthorized();
            return;
          }

          if (upsertError || !upsertedRestaurant) {
            const { data: fallback, error: fallbackError, status: fallbackStatus } = await supabase
              .from("restaurants")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();

            if (isAuthFailure(fallbackStatus, fallbackError)) {
              handleUnauthorized();
              return;
            }
            if (!fallback) {
              console.error("Failed to bootstrap restaurant");
              preventBootstrapRef.current = true;
              return;
            }
            restoId = fallback.id;
          } else {
            restoId = upsertedRestaurant.id;
          }
          if (!cancelled) {
            setRestaurantId(restoId);
            setOnboarded(false);
          }
        }

        // Load most recent menu
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
          isInitialLoadRef.current = false;
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

  return {
    // State
    user,
    authChecked,
    isLoading,
    restaurantId,
    restaurantName,
    restaurantPhone,
    restaurantLogoUrl,
    plan,
    onboarded,
    activeMenuId,
    activeMenuName,
    menuStatus,
    menuSlug,
    categories,
    menuItems,
    menuStyle,
    lastSynced,
    // Setters
    setIsLoading,
    setRestaurantName,
    setRestaurantPhone,
    setRestaurantLogoUrl,
    setPlan,
    setOnboarded,
    setCategories,
    setMenuItems,
    setMenuStyle,
    setActiveMenuId,
    setActiveMenuName,
    setMenuStatus,
    setMenuSlug,
    setRestaurantId,
    setLastSynced,
  };
}

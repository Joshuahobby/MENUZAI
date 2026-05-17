"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { defaultStyle } from "@/store/menuStore";
import type { User } from "@supabase/supabase-js";
import { useMenuStore } from "@/store/menuStore";

/**
 * useMenuBootstrap
 *
 * Refactored to write bootstrap state directly to the Zustand menuStore
 * instead of maintaining its own useState calls. This means:
 * - MenuContext reads state from the store (not this hook)
 * - Components that selectively subscribe to store slices avoid
 *   re-rendering when unrelated state changes
 */
export function useMenuBootstrap() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Pull store setters — stable references, don't cause re-renders
  const {
    setIsLoading,
    setRestaurantId,
    setRestaurantName,
    setRestaurantPhone,
    setRestaurantLogoUrl,
    setPlan,
    setOnboarded,
    setActiveMenuId,
    setActiveMenuName,
    setMenuStatus,
    setMenuSlug,
    setCategories,
    setMenuItems,
    setMenuStyle,
    setLastSynced,
    hydrate,
    setUserRole,
  } = useMenuStore.getState();

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
      hydrate({
        activeMenuId: null,
        restaurantId: null,
        restaurantName: "My Restaurant",
        restaurantPhone: "",
        restaurantLogoUrl: "",
        categories: [],
        menuItems: [],
        menuStyle: defaultStyle,
        plan: "free",
        isLoading: false,
        userRole: null,
      });
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
          .select("id, name, phone, plan, logo_url, onboarded, user_id")
          // Get the restaurant the user has access to (via RLS)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (isAuthFailure(selectStatus, selectError)) {
          handleUnauthorized();
          return;
        }

        let userRole: "owner" | "manager" | "staff" | null = null;

        if (existingRestaurant) {
          restoId = existingRestaurant.id;
          
          // Determine role
          if (existingRestaurant.user_id === user.id) {
            userRole = "owner";
          } else {
            const { data: staffData } = await supabase
              .from("restaurant_staff")
              .select("role")
              .eq("restaurant_id", restoId)
              .eq("user_id", user.id)
              .maybeSingle();
            userRole = (staffData?.role as "owner" | "manager" | "staff") ?? "staff";
          }

          if (!cancelled) {
            hydrate({
              restaurantId: restoId,
              restaurantName: existingRestaurant.name,
              restaurantPhone: existingRestaurant.phone ?? "",
              restaurantLogoUrl: existingRestaurant.logo_url ?? "",
              plan: existingRestaurant.plan ?? "free",
              onboarded: existingRestaurant.onboarded ?? false,
              userRole,
            });
          }
        } else {
          // No restaurant found via the initial RLS-filtered query.
          // Before creating one, check if this user is already a staff member somewhere.
          // This handles: (a) migration 007 not yet applied, (b) any RLS edge cases.
          const { data: staffRow } = await supabase
            .from("restaurant_staff")
            .select("restaurant_id, role")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (staffRow) {
            // Staff member — load the employer's restaurant directly.
            const { data: staffRestaurant } = await supabase
              .from("restaurants")
              .select("id, name, phone, plan, logo_url, onboarded")
              .eq("id", staffRow.restaurant_id)
              .maybeSingle();

            if (!staffRestaurant || cancelled) return;

            restoId = staffRestaurant.id;
            userRole = staffRow.role as "owner" | "manager" | "staff";
            if (!cancelled) {
              hydrate({
                restaurantId: restoId,
                restaurantName: staffRestaurant.name,
                restaurantPhone: staffRestaurant.phone ?? "",
                restaurantLogoUrl: staffRestaurant.logo_url ?? "",
                plan: staffRestaurant.plan ?? "free",
                onboarded: staffRestaurant.onboarded ?? false,
                userRole,
              });
            }
          } else {
            // New owner — no restaurant, no staff role anywhere. Create their restaurant.
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
            userRole = "owner";
            if (!cancelled) {
              hydrate({ restaurantId: restoId, onboarded: false, userRole });
            }
          }
        }

        // Load most recent menu that belongs to the restaurant
        const { data: menu } = await supabase
          .from("menus")
          .select("*")
          .eq("restaurant_id", restoId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (menu && !cancelled) {
          hydrate({
            activeMenuId: menu.id,
            activeMenuName: menu.name ?? "My Menu",
            menuStatus: menu.status === "published" ? "published" : "draft",
            menuSlug: menu.slug ?? null,
            categories: menu.categories ?? [],
            menuItems: menu.items ?? [],
            menuStyle: menu.style && Object.keys(menu.style).length > 0 ? menu.style : defaultStyle,
            lastSynced: new Date(menu.updated_at),
          });
        } else if (!menu && !cancelled && userRole === "owner") {
          // Only auto-create a starter menu for restaurant owners on first login.
          // Staff and managers see empty state until the owner creates a menu.
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
              .eq("restaurant_id", restoId)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lateMenu && !cancelled) {
              hydrate({
                activeMenuId: lateMenu.id,
                activeMenuName: lateMenu.name ?? "My Menu",
                menuStatus: lateMenu.status === "published" ? "published" : "draft",
                menuSlug: lateMenu.slug ?? null,
                categories: lateMenu.categories ?? [],
                menuItems: lateMenu.items ?? [],
                menuStyle: lateMenu.style && Object.keys(lateMenu.style).length > 0 ? lateMenu.style : defaultStyle,
              });
            }
          } else if (newMenu && !cancelled) {
            hydrate({
              activeMenuId: newMenu.id,
              categories: [],
              menuItems: [],
            });
          }
        }
      } catch (err) {
        console.error("Bootstrap error:", err);
      } finally {
        if (!cancelled) {
          bootstrappedForUserRef.current = user.id;
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
    user,
    authChecked,
    // Expose setters pointing to the store (MenuContext uses them for
    // actions like setRestaurantName after onboarding)
    setIsLoading,
    setRestaurantId,
    setRestaurantName,
    setRestaurantPhone,
    setRestaurantLogoUrl,
    setPlan,
    setOnboarded,
    setActiveMenuId,
    setActiveMenuName,
    setMenuStatus,
    setMenuSlug,
    setCategories,
    setMenuItems,
    setMenuStyle,
    setLastSynced,
  };
}

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMenuStore } from "@/store/menuStore";
import { useMenuBootstrap } from "./useMenuBootstrap";
import type { MenuStyle } from "@/types/menu";

const defaultStyle: MenuStyle = {
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

const queryResults = vi.hoisted(() => new Map<string, unknown[]>());

function pushResult(table: string, result: unknown) {
  if (!queryResults.has(table)) queryResults.set(table, []);
  queryResults.get(table)!.push(result);
}

function resetQueryResults() {
  queryResults.clear();
}

interface QueryChain {
  then: Promise<unknown>["then"];
  catch: Promise<unknown>["catch"];
  finally: Promise<unknown>["finally"];
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
}

function buildChain(result: unknown): QueryChain {
  const promise = Promise.resolve(result);
  return {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
    select: vi.fn(() => buildChain(result)),
    eq: vi.fn(() => buildChain(result)),
    order: vi.fn(() => buildChain(result)),
    limit: vi.fn(() => buildChain(result)),
    maybeSingle: vi.fn(() => promise),
    single: vi.fn(() => promise),
    insert: vi.fn(() => buildChain(result)),
  };
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
        (globalThis as Record<string, unknown>).__authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    },
    from: vi.fn((table: string) => {
      const results = queryResults.get(table);
      if (!results || results.length === 0) {
        return buildChain({ data: null, error: { message: `unexpected query on ${table}` } });
      }
      const r = results.shift()!;
      return buildChain(r);
    }),
  },
}));

interface SessionUser {
  id: string;
  email: string;
  aud: string;
}

const SESSION = {
  user: {
    id: "u1",
    email: "test@test.com",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  },
  access_token: "mock-token",
  refresh_token: "mock-refresh",
  expires_in: 3600,
  token_type: "bearer" as const,
};

const EXISTING_RESTAURANT = {
  data: { id: "r1", name: "Test Restaurant", phone: "+250700000000", plan: "pro", plan_expires_at: "2027-01-01", trial_ends_at: null, logo_url: "https://example.com/logo.png", onboarded: true, user_id: "u1" },
  error: null,
  status: 200,
};

const EXISTING_MENU = {
  data: { id: "m1", name: "Main Menu", status: "published", slug: "test-restaurant", categories: [{ id: "c1", name: "Starters" }], items: [{ id: "i1", name: "Spring Rolls", price: 5000 }], style: { primaryColor: "#FF6B00" }, updated_at: "2026-06-24T00:00:00Z", restaurant_id: "r1" },
  error: null,
};

function triggerAuth(user: SessionUser | null) {
  const cb = (globalThis as Record<string, unknown>).__authCallback as ((event: string, session: { user: SessionUser } | null) => void);
  if (cb) cb("INITIAL_SESSION", user ? { user } : null);
}

function resetStore() {
  useMenuStore.getState().hydrate({
    restaurantId: null,
    restaurantName: "",
    restaurantPhone: "",
    restaurantLogoUrl: "",
    plan: "free",
    planExpiresAt: null,
    trialEndsAt: null,
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
    ownedRestaurants: [],
  });
}

describe("useMenuBootstrap", () => {
  beforeEach(() => {
    resetQueryResults();
    vi.clearAllMocks();
    resetStore();
  });

  it("resets store to defaults when no user is authenticated", async () => {
    renderHook(() => useMenuBootstrap());

    await act(async () => {
      triggerAuth(null);
    });

    await waitFor(() => {
      expect(useMenuStore.getState().isLoading).toBe(false);
    });

    expect(useMenuStore.getState().restaurantId).toBeNull();
    expect(useMenuStore.getState().activeMenuId).toBeNull();
    expect(useMenuStore.getState().plan).toBe("free");
    expect(useMenuStore.getState().userRole).toBeNull();
  });

  it("creates a new restaurant and starter menu for a first-time owner", async () => {
    const supabase = (await import("@/lib/supabase")).supabase;
    const getSession = vi.mocked(supabase.auth.getSession);
    getSession.mockResolvedValue({ data: { session: SESSION }, error: null });

    pushResult("restaurants", { data: null, error: null, status: 200 });
    pushResult("restaurant_staff", { data: null });
    pushResult("restaurants", { data: { id: "new-r-1" }, error: null, status: 200 });
    pushResult("menus", { data: null, error: null });
    pushResult("menus", { data: { id: "m1" }, error: null });

    renderHook(() => useMenuBootstrap());

    await act(async () => {
      triggerAuth(SESSION.user);
    });

    await waitFor(() => {
      expect(useMenuStore.getState().isLoading).toBe(false);
    });

    const state = useMenuStore.getState();
    expect(state.restaurantId).toBe("new-r-1");
    expect(state.activeMenuId).toBe("m1");
    expect(state.plan).toBe("trial");
    expect(state.userRole).toBe("owner");
    expect(state.onboarded).toBe(false);
  });

  it("loads an existing restaurant and its menu", async () => {
    const supabase = (await import("@/lib/supabase")).supabase;
    const getSession = vi.mocked(supabase.auth.getSession);
    getSession.mockResolvedValue({ data: { session: SESSION }, error: null });

    pushResult("restaurants", { ...EXISTING_RESTAURANT });
    pushResult("restaurants", { data: [{ id: "r1", name: "Test Restaurant" }], error: null });
    pushResult("menus", { ...EXISTING_MENU });

    renderHook(() => useMenuBootstrap());

    await act(async () => {
      triggerAuth(SESSION.user);
    });

    await waitFor(() => {
      expect(useMenuStore.getState().isLoading).toBe(false);
    });

    const state = useMenuStore.getState();
    expect(state.restaurantId).toBe("r1");
    expect(state.restaurantName).toBe("Test Restaurant");
    expect(state.plan).toBe("pro");
    expect(state.onboarded).toBe(true);
    expect(state.activeMenuId).toBe("m1");
    expect(state.categories).toHaveLength(1);
    expect(state.menuItems).toHaveLength(1);
    expect(state.userRole).toBe("owner");
    expect(state.ownedRestaurants).toHaveLength(1);
  });

  it("loads employer restaurant for a staff member", async () => {
    const supabase = (await import("@/lib/supabase")).supabase;
    const getSession = vi.mocked(supabase.auth.getSession);
    getSession.mockResolvedValue({ data: { session: SESSION }, error: null });

    pushResult("restaurants", { data: null, error: null, status: 200 });
    pushResult("restaurant_staff", { data: { restaurant_id: "r1", role: "staff" } });
    pushResult("restaurants", { data: { id: "r1", name: "Employer Restaurant", phone: "", plan: "pro", plan_expires_at: null, trial_ends_at: null, logo_url: "", onboarded: true }, error: null });
    pushResult("menus", { ...EXISTING_MENU });

    renderHook(() => useMenuBootstrap());

    await act(async () => {
      triggerAuth(SESSION.user);
    });

    await waitFor(() => {
      expect(useMenuStore.getState().isLoading).toBe(false);
    });

    const state = useMenuStore.getState();
    expect(state.restaurantId).toBe("r1");
    expect(state.restaurantName).toBe("Employer Restaurant");
    expect(state.userRole).toBe("staff");
    expect(state.activeMenuId).toBe("m1");
  });

  it("redirects to login on auth failure (401)", async () => {
    const supabase = (await import("@/lib/supabase")).supabase;
    const getSession = vi.mocked(supabase.auth.getSession);
    getSession.mockResolvedValue({ data: { session: SESSION }, error: null });

    const mockReplace = vi.fn();
    Object.defineProperty(window, "location", { value: { replace: mockReplace }, writable: true });

    pushResult("restaurants", { data: null, error: { message: "JWT expired" }, status: 401 });

    renderHook(() => useMenuBootstrap());

    await act(async () => {
      triggerAuth(SESSION.user);
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });

    const signOut = vi.mocked(supabase.auth.signOut);
    expect(signOut).toHaveBeenCalled();
  });

  it("falls back to user_id query when restaurant insert races", async () => {
    const supabase = (await import("@/lib/supabase")).supabase;
    const getSession = vi.mocked(supabase.auth.getSession);
    getSession.mockResolvedValue({ data: { session: SESSION }, error: null });

    pushResult("restaurants", { data: null, error: null, status: 200 });
    pushResult("restaurant_staff", { data: null });
    pushResult("restaurants", { data: null, error: { message: "duplicate key" }, status: 409 });
    pushResult("restaurants", { data: { id: "r-fallback" }, error: null, status: 200 });
    pushResult("menus", { data: { id: "m1" }, error: null });

    renderHook(() => useMenuBootstrap());

    await act(async () => {
      triggerAuth(SESSION.user);
    });

    await waitFor(() => {
      expect(useMenuStore.getState().isLoading).toBe(false);
    });

    const state = useMenuStore.getState();
    expect(state.restaurantId).toBe("r-fallback");
    expect(state.userRole).toBe("owner");
  });
});

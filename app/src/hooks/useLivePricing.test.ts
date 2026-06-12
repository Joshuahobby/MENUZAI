import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useLivePricing } from "./useLivePricing";
import { pricingPlans } from "@/data/mockData";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLivePricing", () => {
  it("initializes immediately with mockData fallback", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    const { result } = renderHook(() => useLivePricing());
    const pro = result.current.find((p) => p.name === "Pro");
    expect(pro?.amountRwf).toBe(35000);
  });

  it("updates prices from a successful API response", async () => {
    const updated = pricingPlans.map((p) =>
      p.name === "Pro" ? { ...p, amountRwf: 40000 } : p
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve(updated),
    }));
    const { result } = renderHook(() => useLivePricing());
    await waitFor(() => {
      expect(result.current.find((p) => p.name === "Pro")?.amountRwf).toBe(40000);
    });
  });

  it("keeps mockData fallback on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const { result } = renderHook(() => useLivePricing());
    await waitFor(() => {
      expect(result.current.find((p) => p.name === "Pro")?.amountRwf).toBe(35000);
    });
  });

  it("keeps mockData fallback when API returns non-array", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ error: "not found" }),
    }));
    const { result } = renderHook(() => useLivePricing());
    await waitFor(() => {
      expect(result.current).toEqual(pricingPlans);
    });
  });
});

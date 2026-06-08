import { useState, useEffect } from "react";
import { pricingPlans } from "@/data/mockData";

export type PricingPlan = (typeof pricingPlans)[0];

// Returns pricing plans with prices fetched live from the database.
// Initialises immediately with the static mockData fallback so there's
// no loading flash — the values just update once the fetch resolves.
export function useLivePricing(): PricingPlan[] {
  const [plans, setPlans] = useState<PricingPlan[]>(pricingPlans);

  useEffect(() => {
    fetch("/api/public/pricing")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPlans(d); })
      .catch(() => {}); // keep static fallback on error
  }, []);

  return plans;
}

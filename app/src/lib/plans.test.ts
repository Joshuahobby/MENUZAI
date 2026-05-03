import { describe, it, expect } from "vitest";
import {
  getPlanLimits,
  getPlanMeta,
  isUnlimited,
  canCreateMenu,
  canPublishMenu,
  canCreateDraft,
} from "./plans";

describe("getPlanLimits", () => {
  it("returns correct limits for free plan", () => {
    const limits = getPlanLimits("free");
    expect(limits.maxTotal).toBe(1);
    expect(limits.maxPublished).toBe(1);
    expect(limits.maxDrafts).toBe(1);
  });

  it("returns unlimited for pro plan", () => {
    const limits = getPlanLimits("pro");
    expect(limits.maxTotal).toBe(Infinity);
    expect(limits.maxPublished).toBe(Infinity);
    expect(limits.maxDrafts).toBe(Infinity);
  });

  it("returns unlimited for business plan", () => {
    const limits = getPlanLimits("business");
    expect(limits.maxTotal).toBe(Infinity);
  });

  it("falls back to free for unknown plans", () => {
    const limits = getPlanLimits("enterprise");
    expect(limits.maxTotal).toBe(1);
  });
});

describe("getPlanMeta", () => {
  it("returns label and badge class for each plan", () => {
    expect(getPlanMeta("free").label).toBe("Free");
    expect(getPlanMeta("pro").label).toBe("Pro");
    expect(getPlanMeta("business").label).toBe("Business");
  });

  it("falls back to free meta for unknown plans", () => {
    expect(getPlanMeta("unknown").label).toBe("Free");
  });
});

describe("isUnlimited", () => {
  it("returns false for free plan", () => {
    expect(isUnlimited("free")).toBe(false);
  });

  it("returns true for pro plan", () => {
    expect(isUnlimited("pro")).toBe(true);
  });

  it("returns true for business plan", () => {
    expect(isUnlimited("business")).toBe(true);
  });
});

describe("canCreateMenu", () => {
  it("allows creating a menu on free plan with 0 menus", () => {
    const result = canCreateMenu("free", 0);
    expect(result.allowed).toBe(true);
  });

  it("blocks creating a menu on free plan with 1 menu", () => {
    const result = canCreateMenu("free", 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Free plan");
  });

  it("always allows creating on pro plan", () => {
    expect(canCreateMenu("pro", 100).allowed).toBe(true);
  });
});

describe("canPublishMenu", () => {
  it("allows publishing on free plan with 0 published", () => {
    expect(canPublishMenu("free", 0).allowed).toBe(true);
  });

  it("blocks publishing on free plan with 1 published", () => {
    const result = canPublishMenu("free", 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("published menu");
  });

  it("always allows publishing on pro plan", () => {
    expect(canPublishMenu("pro", 50).allowed).toBe(true);
  });
});

describe("canCreateDraft", () => {
  it("allows draft on free plan with 0 drafts", () => {
    expect(canCreateDraft("free", 0).allowed).toBe(true);
  });

  it("blocks draft on free plan with 1 draft", () => {
    const result = canCreateDraft("free", 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Free plan");
  });

  it("always allows drafts on business plan", () => {
    expect(canCreateDraft("business", 999).allowed).toBe(true);
  });
});

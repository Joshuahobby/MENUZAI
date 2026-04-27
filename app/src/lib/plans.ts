export type Plan = "free" | "pro" | "business";

interface PlanLimits {
  maxDrafts: number;
  maxPublished: number;
}

interface PlanMeta {
  label: string;
  badgeClass: string;
}

const LIMITS: Record<Plan, PlanLimits> = {
  free:     { maxDrafts: 1, maxPublished: 1 },
  pro:      { maxDrafts: Infinity, maxPublished: Infinity },
  business: { maxDrafts: Infinity, maxPublished: Infinity },
};

const META: Record<Plan, PlanMeta> = {
  free:     { label: "Free",     badgeClass: "bg-surface-container-highest text-secondary" },
  pro:      { label: "Pro",      badgeClass: "bg-primary/10 text-primary" },
  business: { label: "Business", badgeClass: "bg-tertiary/10 text-tertiary" },
};

function resolve(plan: string): Plan {
  return (plan as Plan) in LIMITS ? (plan as Plan) : "free";
}

export function getPlanLimits(plan: string): PlanLimits {
  return LIMITS[resolve(plan)];
}

export function getPlanMeta(plan: string): PlanMeta {
  return META[resolve(plan)];
}

export function isUnlimited(plan: string): boolean {
  const { maxDrafts, maxPublished } = getPlanLimits(plan);
  return maxDrafts === Infinity && maxPublished === Infinity;
}

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
}

export function canCreateDraft(plan: string, currentDraftCount: number): PlanCheckResult {
  const { maxDrafts } = getPlanLimits(plan);
  if (currentDraftCount < maxDrafts) return { allowed: true };
  return {
    allowed: false,
    reason:
      maxDrafts === 1
        ? "Free plan allows 1 draft menu. Publish or delete your current draft to create a new one."
        : `You have reached the draft menu limit (${maxDrafts}).`,
  };
}

export function canPublishMenu(plan: string, currentPublishedCount: number): PlanCheckResult {
  const { maxPublished } = getPlanLimits(plan);
  if (currentPublishedCount < maxPublished) return { allowed: true };
  return {
    allowed: false,
    reason:
      maxPublished === 1
        ? "Free plan allows 1 published menu. Unpublish your current live menu to publish this one."
        : `You have reached the published menu limit (${maxPublished}).`,
  };
}

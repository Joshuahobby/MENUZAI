export type Plan = "free" | "pro" | "business";

export interface PlanFeatures {
  aiWaiter: boolean;
  aiReply: boolean;
  galleryUpload: boolean;
  staffManagement: boolean;
  premiumQrTemplates: boolean;
}

const FEATURES: Record<Plan, PlanFeatures> = {
  free:     { aiWaiter: false, aiReply: false, galleryUpload: false, staffManagement: false, premiumQrTemplates: false },
  pro:      { aiWaiter: true,  aiReply: true,  galleryUpload: true,  staffManagement: true,  premiumQrTemplates: true },
  business: { aiWaiter: true,  aiReply: true,  galleryUpload: true,  staffManagement: true,  premiumQrTemplates: true },
};

interface PlanLimits {
  maxDrafts: number;
  maxPublished: number;
  maxTotal: number;
}

interface PlanMeta {
  label: string;
  badgeClass: string;
}

const LIMITS: Record<Plan, PlanLimits> = {
  free:     { maxDrafts: 1, maxPublished: 1, maxTotal: 1 },
  pro:      { maxDrafts: Infinity, maxPublished: Infinity, maxTotal: Infinity },
  business: { maxDrafts: Infinity, maxPublished: Infinity, maxTotal: Infinity },
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

export function canUseFeature(plan: string, feature: keyof PlanFeatures): boolean {
  const resolved = resolve(plan);
  return FEATURES[resolved][feature];
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

export function canCreateMenu(plan: string, currentTotalCount: number): PlanCheckResult {
  const { maxTotal } = getPlanLimits(plan);
  if (currentTotalCount < maxTotal) return { allowed: true };
  return {
    allowed: false,
    reason:
      maxTotal === 1
        ? "Free plan allows 1 menu. Delete it or upgrade to create another."
        : `You have reached the menu limit (${maxTotal}).`,
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

# TODOS

## Post-Sprint / Pre-Raise (build when trigger conditions are met)

### P2: ROI Calculator on pricing page
**What:** Interactive pricing page calculator — enter table count + average bill → see estimated
monthly revenue lift from AI Waiter.
**Why:** Gives restaurant owners a concrete number for why 35,000 RWF/month pays for itself.
Removes the "is it worth it?" hesitation in the conversion decision.
**Trigger:** Build after first 5 paying customers give real data on orders/revenue impact.
**Effort:** M (human: ~3h / CC: ~30min)
**Files:** `app/src/app/pricing/page.tsx`

### P2: Referral tracking + automated credit in dashboard
**What:** Referral link in dashboard Settings page. When a referred restaurant completes their
first payment, the referring restaurant automatically gets 30 days free (extends plan_expires_at).
No manual admin override needed.
**Why:** The current manual referral process (founder manually extends plan in admin) is fragile —
any error damages the anchor relationship. At 10+ paying customers, referrals become the primary
growth channel and need to be reliable.
**Trigger:** Build once 10+ paying customers exist and you see spontaneous referral activity.
**Effort:** M (human: ~2 days / CC: ~45min)
**Files:** `app/src/app/dashboard/settings/page.tsx`, new `/api/referrals/` route, `restaurants` schema

## Post-Raise

### P3: Read-only investor/board metrics view
**What:** Token-gated page at `/admin/metrics?token=XXXXX` showing curated investor metrics:
paying restaurants count, MRR, total orders, 4-week growth trend.
**Why:** Useful for board/investor monthly updates once you have a formal investor relationship.
Screenshots are sufficient during the seed raise but not for ongoing reporting.
**Trigger:** After seed raise closes.
**Effort:** S (human: ~3h / CC: ~30min)
**Files:** `app/src/app/admin/metrics/page.tsx`, new token auth layer

-- ============================================================
-- Migration 034: Add UPDATE policy to reviews table
-- ============================================================
-- The reviews table had INSERT (public) and SELECT (staff-only)
-- policies but no UPDATE policy, causing RLS to block the reply
-- feature entirely — owners/staff were silently denied when
-- trying to save reply drafts via the dashboard.
-- ============================================================

drop policy if exists "Staff can update their reviews" on public.reviews;

create policy "Staff can update their reviews"
  on public.reviews for update
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = public.reviews.restaurant_id
        and r.user_id = auth.uid()
    )
    or public.check_staff_role(restaurant_id, auth.uid(), array['owner', 'manager'])
  )
  with check (
    exists (
      select 1 from public.restaurants r
      where r.id = public.reviews.restaurant_id
        and r.user_id = auth.uid()
    )
    or public.check_staff_role(restaurant_id, auth.uid(), array['owner', 'manager'])
  );

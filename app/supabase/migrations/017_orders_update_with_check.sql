-- Migration 017: Add explicit WITH CHECK to orders UPDATE policy
-- Without WITH CHECK, PostgreSQL implicitly uses USING as both the
-- row-visibility check and the new-row validation check. Making it
-- explicit avoids ambiguity and ensures PostgREST returns the
-- correct status code if the check fails.

DROP POLICY IF EXISTS "Staff can update their orders" ON public.orders;
CREATE POLICY "Staff can update their orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = public.orders.restaurant_id AND r.user_id = auth.uid()
    )
    OR public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = public.orders.restaurant_id AND r.user_id = auth.uid()
    )
    OR public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  );

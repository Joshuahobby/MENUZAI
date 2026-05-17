-- ============================================================
-- MENUZAI — Fix RLS Policy Recursion (Phase 10)
-- Bypasses mutual recursion in table policies by using a 
-- SECURITY DEFINER helper function.
-- ============================================================

-- 1. Create check_staff_role SECURITY DEFINER function to bypass RLS
CREATE OR REPLACE FUNCTION public.check_staff_role(r_id uuid, u_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_staff
    WHERE restaurant_id = r_id AND user_id = u_id AND role = ANY(allowed_roles)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.check_staff_role(uuid, uuid, text[]) FROM public;
REVOKE EXECUTE ON FUNCTION public.check_staff_role(uuid, uuid, text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_staff_role(uuid, uuid, text[]) TO public;
GRANT EXECUTE ON FUNCTION public.check_staff_role(uuid, uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_staff_role(uuid, uuid, text[]) TO service_role;

-- 2. Recreate policies for public.restaurant_staff to avoid recursion
DROP POLICY IF EXISTS "Owners and Managers can manage staff" ON public.restaurant_staff;
CREATE POLICY "Owners and Managers can manage staff"
  ON public.restaurant_staff FOR ALL
  USING (
    public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager'])
  );

DROP POLICY IF EXISTS "Users can view their staff roles" ON public.restaurant_staff;
CREATE POLICY "Users can view their staff roles"
  ON public.restaurant_staff FOR SELECT
  USING (user_id = auth.uid());

-- 3. Recreate policies for public.restaurants to avoid recursion
DROP POLICY IF EXISTS "Owner can read their restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Staff can read their restaurant" ON public.restaurants;
CREATE POLICY "Staff can read their restaurant"
  ON public.restaurants FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.check_staff_role(id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  );

DROP POLICY IF EXISTS "Owner can update their restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Owner and manager can update their restaurant" ON public.restaurants;
CREATE POLICY "Owner and manager can update their restaurant"
  ON public.restaurants FOR UPDATE
  USING (
    auth.uid() = user_id OR
    public.check_staff_role(id, auth.uid(), ARRAY['owner', 'manager'])
  );

-- 4. Recreate policies for public.menus to avoid recursion
DROP POLICY IF EXISTS "Owner can manage their menus" ON public.menus;
DROP POLICY IF EXISTS "Staff can manage menus" ON public.menus;
CREATE POLICY "Staff can manage menus"
  ON public.menus FOR ALL
  USING (
    auth.uid() = user_id OR
    public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  )
  WITH CHECK (
    auth.uid() = user_id OR
    public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  );

-- 5. Recreate policies for public.orders to avoid recursion
DROP POLICY IF EXISTS "Owner can read their orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can read their orders" ON public.orders;
CREATE POLICY "Staff can read their orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = public.orders.restaurant_id AND r.user_id = auth.uid()
    ) OR
    public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  );

DROP POLICY IF EXISTS "Owner can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update their orders" ON public.orders;
CREATE POLICY "Staff can update their orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = public.orders.restaurant_id AND r.user_id = auth.uid()
    ) OR
    public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  );

-- 6. Recreate policies for public.analytics_events to avoid recursion
DROP POLICY IF EXISTS "Owner can read their analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Staff can read their analytics events" ON public.analytics_events;
CREATE POLICY "Staff can read their analytics events"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = public.analytics_events.restaurant_id AND r.user_id = auth.uid()
    ) OR
    public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  );

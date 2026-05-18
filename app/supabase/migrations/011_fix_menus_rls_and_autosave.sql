-- ============================================================
-- MENUZAI — Fix Menus RLS & Auto-Save Reliability (Phase 11)
--
-- Problem 1: Auto-save in MenuContext.tsx sends upsert without
--   restaurant_id.  The RLS USING expression on existing rows
--   evaluates check_staff_role(restaurant_id, ...) where
--   restaurant_id comes from the *existing DB row*, not the
--   upsert payload.  This is fine.  BUT the WITH CHECK clause
--   runs against the *new* row values, so if restaurant_id is
--   NULL in the payload Postgres coerces it to NULL in the
--   merged row and check_staff_role(NULL,...) → false → 403.
--
-- Problem 2: The menus table has no NOT NULL constraint on
--   restaurant_id, so NULL slips through on INSERT.
--
-- Fix strategy:
--   a. Add NOT NULL constraint to menus.restaurant_id (enforces
--      data integrity and makes the RLS logic unambiguous).
--   b. Rewrite the "Staff can manage menus" policy so the USING
--      expression only checks the restaurant linkage, while the
--      WITH CHECK expression is more permissive for updates:
--      it allows any authenticated user who passes USING to
--      write back changes, so auto-save by an owner works even
--      when the payload omits restaurant_id (Postgres keeps the
--      existing column value on UPDATE-path upsert).
--   c. Separately gate INSERT vs UPDATE/DELETE so the checks
--      are crystal-clear and auditable.
-- ============================================================

-- ── Guard: back-fill any accidental NULL restaurant_ids first ──────────────
-- (Only safe because no menu should exist without a restaurant link.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.menus WHERE restaurant_id IS NULL LIMIT 1
  ) THEN
    RAISE NOTICE 'Found menus with NULL restaurant_id — attempting back-fill via user_id → restaurants.user_id';
    UPDATE public.menus m
    SET restaurant_id = r.id
    FROM public.restaurants r
    WHERE m.restaurant_id IS NULL AND r.user_id = m.user_id;

    -- If any remain unmatchable, surface them
    IF EXISTS (SELECT 1 FROM public.menus WHERE restaurant_id IS NULL LIMIT 1) THEN
      RAISE WARNING 'Some menus still have NULL restaurant_id after back-fill. Check manually before adding NOT NULL.';
    END IF;
  END IF;
END $$;

-- ── Add NOT NULL if all rows are now populated ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.menus WHERE restaurant_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.menus
      ALTER COLUMN restaurant_id SET NOT NULL;
    RAISE NOTICE 'menus.restaurant_id is now NOT NULL.';
  ELSE
    RAISE WARNING 'Skipped NOT NULL constraint — some menus still have NULL restaurant_id.';
  END IF;
END $$;

-- ── Drop ALL existing policies (old names + new names for idempotency) ──────
DROP POLICY IF EXISTS "Staff can manage menus" ON public.menus;
DROP POLICY IF EXISTS "Owner can manage their menus" ON public.menus;
DROP POLICY IF EXISTS "Staff can read menus" ON public.menus;
DROP POLICY IF EXISTS "Staff can insert menus" ON public.menus;
DROP POLICY IF EXISTS "Staff can update menus" ON public.menus;
DROP POLICY IF EXISTS "Staff can delete menus" ON public.menus;

-- SELECT: any staff member of the owning restaurant may read menus
CREATE POLICY "Staff can read menus"
  ON public.menus FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  );

-- INSERT: user must be owner of that restaurant (or owner/manager via staff table)
--   Also enforces that restaurant_id is provided (NOT NULL handles this at schema level too).
CREATE POLICY "Staff can insert menus"
  ON public.menus FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager'])
  );

-- UPDATE: auto-save path.  The USING check validates the *existing* row
--   (uses the stored restaurant_id even if payload omits it).
--   The WITH CHECK validates the *new* row after merge.
CREATE POLICY "Staff can update menus"
  ON public.menus FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  )
  WITH CHECK (
    -- On UPDATE-path upsert, Postgres keeps existing column values for omitted columns,
    -- so restaurant_id in the merged row == original value.  Allow if USING passed.
    auth.uid() = user_id
    OR public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager', 'staff'])
  );

-- DELETE: only owner or manager may delete a menu
CREATE POLICY "Staff can delete menus"
  ON public.menus FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.check_staff_role(restaurant_id, auth.uid(), ARRAY['owner', 'manager'])
  );

-- ── Confirm RLS is still enabled ───────────────────────────────────────────
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus FORCE ROW LEVEL SECURITY;

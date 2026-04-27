-- Remove incorrect UNIQUE(user_id) constraint on menus.
-- Users are intended to have multiple menus; this constraint was added in error
-- and caused 409 Conflict errors during bootstrap (INSERT after SELECT null race).
ALTER TABLE public.menus DROP CONSTRAINT IF EXISTS menus_user_id_key;

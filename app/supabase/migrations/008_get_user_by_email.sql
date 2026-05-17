-- ============================================================
-- MENUZAI — RPC to look up user by email securely
-- ============================================================

-- Function to get a user ID by email (used by API routes via service role)
create or replace function public.get_user_id_by_email(email_input text)
returns uuid
language sql
security definer
as $$
  select id from auth.users where email = email_input limit 1;
$$;

-- Ensure only authenticated users can execute this function
revoke execute on function public.get_user_id_by_email(text) from public;
revoke execute on function public.get_user_id_by_email(text) from anon;
grant execute on function public.get_user_id_by_email(text) to authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;

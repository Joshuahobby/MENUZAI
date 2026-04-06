import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Handles the email confirmation redirect from Supabase.
 * Supabase sends the user to /api/auth/callback?code=... after they click
 * the confirmation link in their email.
 *
 * Configure in Supabase Dashboard:
 *   Authentication > URL Configuration > Redirect URLs
 *   Add: http://localhost:3000/api/auth/callback
 *        https://your-domain.com/api/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Allow callers to override the post-auth destination
  const next = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — send back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}

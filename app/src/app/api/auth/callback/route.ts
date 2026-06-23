import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Validate the optional "next" param against a whitelist of internal routes.
  const rawNext = searchParams.get('next');
  const allowedNext = new Set(['/dashboard', '/onboarding', '/reset-password']);
  const next = rawNext && allowedNext.has(rawNext) ? rawNext : '/onboarding';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Password reset links produce a 'recovery' session type.
      // Always send those to /reset-password so the user can set a new password.
      if (data.session.user.aud === 'authenticated' && next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Route returning users (already onboarded) straight to the dashboard
      // so Google sign-in doesn't dump them back through the onboarding flow.
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('onboarded')
        .eq('user_id', data.session.user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const destination = restaurant?.onboarded ? '/dashboard' : next;
      return NextResponse.redirect(`${origin}${destination}`);
    } else if (error) {
      console.error('Auth Callback Error:', error.message, error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}

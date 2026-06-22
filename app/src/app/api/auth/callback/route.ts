import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
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

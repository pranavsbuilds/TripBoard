import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Route handler for Supabase PKCE authentication callbacks.
 * Handles email confirmation links and password recovery links.
 * Reads profile role to dynamically redirect to the correct dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // `next` can be explicitly passed (e.g., from forgot-password), otherwise we resolve from role
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Resolve redirect destination
      let destination = next;

      if (!destination) {
        // Query role from public.profiles to determine the correct portal
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        destination = profile?.role === 'admin' ? '/admin' : '/employee/dashboard';
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }

    console.error('[Auth Callback] Code exchange error:', error?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

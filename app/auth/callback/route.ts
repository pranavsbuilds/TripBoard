import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirect } from '@/lib/session';

/**
 * Route handler for Supabase PKCE authentication callbacks.
 * Handles OAuth redirects (Google Sign-In) and email confirmation link clicks.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const sanitizedPath = sanitizeRedirect(next, '/dashboard');
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${sanitizedPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${sanitizedPath}`);
      } else {
        return NextResponse.redirect(`${origin}${sanitizedPath}`);
      }
    }
    console.error('[Auth Callback] Code exchange error:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

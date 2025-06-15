import type { NextFetchEvent, NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import arcjet from '@/libs/Arcjet';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = (pathname: string): boolean => {
  return pathname.startsWith('/dashboard');
};

const isAuthPage = (pathname: string): boolean => {
  return pathname.startsWith('/login') || pathname.startsWith('/register');
};

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    // Block all bots except the following
    allow: [
      // See https://docs.arcjet.com/bot-protection/identifying-bots
      'CATEGORY:SEARCH_ENGINE', // Allow search engines
      'CATEGORY:PREVIEW', // Allow preview links to show OG images
      'CATEGORY:MONITOR', // Allow uptime monitoring services
    ],
  }),
);

export default async function middleware(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  // Verify the request with Arcjet
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth-token')?.value;

  // If it's an auth page and user is already authenticated, redirect to dashboard
  if (isAuthPage(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If it's a protected route and user is not authenticated, redirect to login
  if (isProtectedRoute(pathname) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add the token to the request headers if it exists
  if (token) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Authorization', `Bearer ${token}`);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  }
  // Handle i18n routing for all other cases
  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
};

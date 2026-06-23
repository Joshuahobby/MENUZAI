/**
 * src/middleware.ts — Next.js Edge Middleware
 *
 * This is the ONLY middleware file. It must live here (src/middleware.ts or
 * middleware.ts at project root), NOT inside src/app/ — that directory is
 * the App Router file-system tree, and Next.js does not pick up middleware
 * from there.
 *
 * All it does is call proxy() which:
 *  1. Refreshes the Supabase auth session cookie on every request so tokens
 *     never go stale server-side.
 *  2. Rewrites the root path to /menu/[slug] when the request arrives on a
 *     restaurant's custom domain (Business plan feature).
 */
import type { NextRequest } from 'next/server';
import { proxy } from './proxy';

export function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

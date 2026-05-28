import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy Convention
 * Replaces the deprecated middleware.ts
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options: _options }) =>
            response.cookies.set(name, value, _options)
          )
        },
      },
    }
  )

  // refresh session
  await supabase.auth.getUser()

  // Custom domain routing: if the request host matches a restaurant's custom_domain,
  // rewrite the root path to /menu/[slug] for their published menu.
  const host = request.headers.get("host") ?? "";
  const knownHosts = [
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ?? "",
    "localhost:3000",
    "localhost",
  ];
  const isCustomDomain = host && !knownHosts.some((h) => host === h || host.endsWith(`.${h}`));

  if (isCustomDomain && request.nextUrl.pathname === "/") {
    const { data: menu } = await supabase
      .from("menus")
      .select("slug, restaurants!inner(custom_domain)")
      .eq("status", "published")
      .eq("restaurants.custom_domain", host)
      .limit(1)
      .maybeSingle();

    if (menu?.slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/menu/${menu.slug}`;
      return NextResponse.rewrite(url);
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { href: "/features", label: "Features"  },
  { href: "/pricing",  label: "Pricing"   },
  { href: "/demo",     label: "Live Demo" },
];

export function PublicNav({ activePath }: { activePath?: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // On the home page, "Pricing" scrolls to the #pricing section instead of
  // navigating away to /pricing.
  const resolveHref = (href: string) =>
    href === "/pricing" && pathname === "/" ? "/#pricing" : href;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
  }, []);

  return (
    <nav className="w-full sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-black/5">
      <div className="flex justify-between items-center px-6 md:px-8 h-16 max-w-7xl mx-auto">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
          </div>
          <span className="font-headline font-black text-base tracking-tight">
            MENUZA <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Centre links — desktop only */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={resolveHref(href)}
              className={`text-sm font-medium py-2.5 transition-colors ${
                activePath === href
                  ? "text-primary font-semibold"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-[2rem] hover:bg-[#a04100] transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm font-medium text-secondary hover:text-on-surface transition-colors py-2.5 px-2"
              >
                Log in
              </Link>
              <Link
                href="/login?signup=true"
                className="px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-[2rem] hover:bg-[#a04100] transition-colors"
              >
                Get Started
              </Link>
              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/5 transition-colors"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen ? "true" : "false"}
              >
                <span className="material-symbols-outlined text-on-surface text-xl">
                  {mobileOpen ? "close" : "menu"}
                </span>
              </button>
            </>
          )}
        </div>

      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-black/5 px-6 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={resolveHref(href)}
              onClick={() => setMobileOpen(false)}
              className={`block py-3 text-sm font-medium border-b border-black/5 last:border-0 transition-colors ${
                activePath === href
                  ? "text-primary font-semibold"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center py-3 text-sm font-medium text-secondary border border-outline-variant rounded-[2rem] hover:bg-surface-container-low transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login?signup=true"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center py-3 bg-primary text-white text-sm font-bold rounded-[2rem] hover:bg-[#a04100] transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

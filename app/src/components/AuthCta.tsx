"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface AuthCtaProps {
  className?: string;
  children: React.ReactNode;
  /** Where to send logged-in users (default: /dashboard) */
  loggedInHref?: string;
  /** Where to send logged-out users (default: /login?signup=true) */
  loggedOutHref?: string;
}

/**
 * A Link that sends logged-in users to the dashboard and
 * logged-out users to the signup/login page.
 * Safe to use in both Server Components and Client Components.
 */
export function AuthCta({
  className,
  children,
  loggedInHref = "/dashboard",
  loggedOutHref = "/login?signup=true",
}: AuthCtaProps) {
  const [href, setHref] = useState(loggedOutHref);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHref(loggedInHref);
    });
  }, [loggedInHref]);

  return <Link href={href} className={className}>{children}</Link>;
}

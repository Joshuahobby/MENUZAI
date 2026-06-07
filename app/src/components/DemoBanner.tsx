"use client";

import Link from "next/link";
import { AuthCta } from "@/components/AuthCta";

interface DemoBannerProps {
  role: "customer" | "owner" | "staff";
  restaurantName?: string;
}

const ROLE_CONFIG = {
  customer: { label: "Customer View",   icon: "person", color: "bg-tertiary text-white" },
  owner:    { label: "Owner Dashboard", icon: "store",  color: "bg-primary text-white"  },
  staff:    { label: "Staff Panel",     icon: "badge",  color: "bg-on-surface text-white" },
};

const OTHER_ROLES: { role: "customer" | "owner" | "staff"; label: string; href: string }[] = [
  { role: "customer", label: "Customer", href: "/menu/demo"   },
  { role: "owner",    label: "Owner",    href: "/demo/owner"  },
  { role: "staff",    label: "Staff",    href: "/demo/staff"  },
];

export function DemoBanner({ role, restaurantName }: DemoBannerProps) {
  const cfg = ROLE_CONFIG[role];
  return (
    <div className="w-full bg-on-surface text-white border-b border-white/10 z-[60] sticky top-0">
      <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between gap-3">

        {/* Left: role chip + restaurant name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.color}`}>
            <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
            <span className="hidden xs:inline">{cfg.label}</span>
          </span>
          {restaurantName && (
            <span className="text-white/40 text-xs truncate hidden sm:block">— {restaurantName}</span>
          )}
          <span className="text-white/30 text-xs hidden lg:block">Demo mode — no data is saved</span>
        </div>

        {/* Right: role switcher + CTA */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Switch-role links — icons only on mobile, icons+label on sm+ */}
          <div className="flex items-center gap-0.5">
            {OTHER_ROLES.filter(r => r.role !== role).map(r => (
              <Link key={r.role} href={r.href}
                className="flex items-center gap-1 text-white/50 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10">
                <span className="material-symbols-outlined text-[13px]">{ROLE_CONFIG[r.role].icon}</span>
                <span className="hidden sm:inline text-[10px] font-semibold">{r.label}</span>
              </Link>
            ))}
          </div>

          <span className="text-white/20 text-xs">|</span>

          <AuthCta
            loggedInHref="/dashboard"
            loggedOutHref="/login?signup=true"
            className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/15 hover:bg-primary/25 transition-colors px-2.5 py-1.5 rounded-full whitespace-nowrap">
            Sign Up
          </AuthCta>
        </div>

      </div>
    </div>
  );
}

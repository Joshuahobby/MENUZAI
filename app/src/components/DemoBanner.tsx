"use client";

import Link from "next/link";

interface DemoBannerProps {
  role: "customer" | "owner" | "staff";
  restaurantName?: string;
}

const ROLE_CONFIG = {
  customer: { label: "Customer View", icon: "person", color: "bg-tertiary text-white" },
  owner:    { label: "Owner Dashboard", icon: "store", color: "bg-primary text-white" },
  staff:    { label: "Staff Panel", icon: "badge", color: "bg-on-surface text-white" },
};

const OTHER_ROLES: { role: "customer" | "owner" | "staff"; label: string; href: string }[] = [
  { role: "customer", label: "Customer View", href: "/menu/demo" },
  { role: "owner",    label: "Owner Dashboard", href: "/demo/owner" },
  { role: "staff",    label: "Staff Panel", href: "/demo/staff" },
];

export function DemoBanner({ role, restaurantName }: DemoBannerProps) {
  const cfg = ROLE_CONFIG[role];
  return (
    <div className="w-full bg-on-surface text-white border-b border-white/10 z-[60] sticky top-0">
      <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.color}`}>
            <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
            {cfg.label}
          </span>
          {restaurantName && (
            <span className="text-white/40 text-xs truncate hidden sm:block">— {restaurantName}</span>
          )}
          <span className="text-white/30 text-xs hidden md:block">Demo mode — no data is saved</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            {OTHER_ROLES.filter(r => r.role !== role).map(r => (
              <Link key={r.role} href={r.href}
                className="text-[10px] font-semibold text-white/50 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/8">
                {r.label}
              </Link>
            ))}
          </div>
          <span className="text-white/20 hidden sm:block">|</span>
          <Link href="/login"
            className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/15 hover:bg-primary/25 transition-colors px-3 py-1.5 rounded-full">
            Sign Up Free
          </Link>
        </div>
      </div>
    </div>
  );
}

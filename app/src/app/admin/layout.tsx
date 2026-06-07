"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useMenu();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;
    // Check admin status via API so the admin email list is never in the browser bundle.
    fetch("/api/admin/health")
      .then(r => {
        if (!r.ok) { router.replace("/dashboard"); return; }
        setIsAdmin(true);
      })
      .catch(() => router.replace("/dashboard"));
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  if (isLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { href: "/admin/settings",     label: "Settings",     icon: "settings"   },
    { href: "/admin/restaurants",  label: "Restaurants",  icon: "storefront" },
    { href: "/admin/transactions", label: "Transactions", icon: "payments"   },
    { href: "/admin/broadcast",    label: "Broadcast",    icon: "campaign"   },
    { href: "/admin/metrics",      label: "Metrics",      icon: "bar_chart"  },
    { href: "/admin/audit",        label: "Audit",        icon: "history"    },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-surface-container flex items-center gap-3 px-6 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-secondary hover:text-primary transition-colors text-sm font-semibold shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          Dashboard
        </Link>

        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-surface shadow-sm text-primary"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                <span className={`material-symbols-outlined text-[15px] ${isActive ? "icon-fill" : ""}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 text-secondary">
          <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">
            Platform Admin
          </span>
        </div>
      </header>

      {children}
    </div>
  );
}

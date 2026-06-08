"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";

const NAV = [
  { href: "/admin/metrics",       label: "Metrics",       icon: "bar_chart"         },
  { href: "/admin/restaurants",   label: "Restaurants",   icon: "storefront"        },
  { href: "/admin/transactions",  label: "Transactions",  icon: "payments"          },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "sell"              },
  { href: "/admin/broadcast",     label: "Broadcast",     icon: "campaign"          },
  { href: "/admin/audit",         label: "Audit Log",     icon: "history"           },
  { href: "/admin/settings",      label: "AI Settings",   icon: "smart_toy"         },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useMenu();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-white/30 animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white icon-fill text-base">admin_panel_settings</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-sm tracking-tight font-[var(--font-headline)] leading-none">
              MENUZA <span className="text-primary">AI</span>
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Platform Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/6"
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] shrink-0 ${active ? "icon-fill" : ""}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        {user?.email && (
          <p className="px-3 pb-1 text-[10px] text-slate-500 truncate">{user.email}</p>
        )}
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/6 transition-all"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">arrow_back</span>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-slate-900 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-fill text-sm">admin_panel_settings</span>
          </div>
          <span className="text-white font-bold text-sm">Admin</span>
        </div>
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen(v => !v)}
          className="text-slate-400 hover:text-white p-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">{mobileOpen ? "close" : "menu"}</span>
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-slate-900 h-full shadow-2xl">{sidebarContent}</div>
          <button type="button" aria-label="Close menu" className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}

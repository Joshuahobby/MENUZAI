"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/dashboard/menus", icon: "restaurant_menu", label: "My Menus" },
  { href: "/dashboard/analytics", icon: "analytics", label: "Analytics" },
  { href: "/dashboard/templates", icon: "style", label: "Templates" },
  { href: "/dashboard/qr-codes", icon: "qr_code_2", label: "QR Codes" },
  { href: "/dashboard/editor", icon: "edit_note", label: "Menu Editor" },
  { href: "/dashboard/settings", icon: "settings", label: "Settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full flex-col py-6 z-50 bg-surface w-64 border-r border-surface-container font-[var(--font-headline)] text-sm font-medium">
        <div className="px-8 mb-10">
          <Link href="/" className="text-xl font-extrabold text-primary-container">MENUZA AI</Link>
          <p className="text-xs text-secondary opacity-70">Business Dashboard</p>
        </div>
        <nav className="space-y-1 px-4 flex-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary/10 text-primary" : "text-secondary hover:text-primary hover:bg-surface-container-low"}`}>
                <span className={`material-symbols-outlined ${isActive ? "icon-fill" : ""}`}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-8 mt-auto pt-6 border-t border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold truncate">{user?.email?.split('@')[0] || "Guest"}</p>
              <button onClick={handleSignOut} className="text-[10px] opacity-60 hover:text-primary transition-colors block">Sign Out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="w-full h-full bg-surface-container-lowest lg:rounded-[3rem] shadow-2xl border border-surface-container-high/50 overflow-hidden relative min-h-[calc(100vh-48px)]">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-end px-4 pb-4 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] rounded-t-[2rem]">
        {navLinks.slice(0, 5).map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href}
              className={`flex flex-col items-center justify-center p-2 ${isActive ? "text-primary-container" : "text-secondary"}`}>
              {isActive ? (
                <div className="flex flex-col items-center justify-center bg-gradient-to-tr from-primary to-primary-container text-white rounded-2xl p-2.5 shadow-lg shadow-primary-container/20">
                  <span className="material-symbols-outlined text-sm icon-fill">{link.icon}</span>
                </div>
              ) : (
                <span className="material-symbols-outlined text-sm">{link.icon}</span>
              )}
              <span className="text-[9px] font-bold uppercase mt-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

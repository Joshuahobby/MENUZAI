"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useMenu } from "@/context/MenuContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import TrialExpiredModal from "@/components/TrialExpiredModal";
import { isPlatformAdmin } from "@/lib/utils";

const getNavLinks = (role: "owner" | "manager" | "staff" | null) => {
  const allLinks = [
    { href: "/dashboard", icon: "dashboard", label: "Dashboard", roles: ["owner", "manager", "staff"] },
    { href: "/dashboard/orders", icon: "receipt_long", label: "Orders", roles: ["owner", "manager", "staff"] },
    { href: "/dashboard/menus", icon: "restaurant_menu", label: "My Menus", roles: ["owner", "manager"] },
    { href: "/dashboard/analytics", icon: "analytics", label: "Analytics", roles: ["owner", "manager"] },
    { href: "/dashboard/reviews", icon: "star", label: "Reviews", roles: ["owner", "manager"] },
    { href: "/dashboard/templates", icon: "style", label: "Templates", roles: ["owner"] },
    { href: "/dashboard/qr-codes", icon: "qr_code_2", label: "QR Codes", roles: ["owner", "manager"] },
    { href: "/dashboard/editor", icon: "edit_note", label: "Editor", roles: ["owner", "manager"] },
    { href: "/dashboard/settings", icon: "settings", label: "Settings", roles: ["owner"] },
  ];
  return allLinks.filter(link => !role || link.roles.includes(role));
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [trialChoiceMade, setTrialChoiceMade] = useState(true); // start true to avoid flash
  const { restaurantLogoUrl, restaurantName, onboarded, isLoading, user, userRole, plan, planExpiresAt, trialEndsAt, restaurantId, ownedRestaurants, switchRestaurantLocation } = useMenu();

  // Check localStorage on mount (client-only)
  useEffect(() => {
    if (!restaurantId) return;
    const made = !!localStorage.getItem(`trial-choice-made-${restaurantId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage sync on mount
    setTrialChoiceMade(made);
  }, [restaurantId]);

  const [now] = useState(() => Date.now());

  const daysUntilExpiry = (() => {
    if (!planExpiresAt || plan === "free" || plan === "trial") return null;
    const diff = new Date(planExpiresAt).getTime() - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 3 ? days : null;
  })();

  const trialDaysLeft = (() => {
    if (plan !== "trial" || !trialEndsAt) return null;
    const diff = new Date(trialEndsAt).getTime() - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  // Trial has ended when plan resolved to 'free' but they had a trial_ends_at
  const trialHasEnded =
    plan === "free" &&
    trialEndsAt !== null &&
    new Date(trialEndsAt) < new Date();

  const showTrialExpiredModal =
    trialHasEnded && !trialChoiceMade && userRole === "owner" && !isLoading;

  const showBanner = (daysUntilExpiry !== null || trialDaysLeft !== null || (trialHasEnded && !trialChoiceMade)) && userRole === "owner";

  const navLinks = getNavLinks(userRole);
  const mobileNavLinks = navLinks.slice(0, Math.min(4, navLinks.length));
  const mobileMoreLinks = navLinks.slice(mobileNavLinks.length);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync localStorage on mount
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  // Derived: true once the auth check has resolved without triggering a redirect
  const authReady = !isLoading && !!user && !(
    !onboarded && (userRole === "owner" || userRole === null) && pathname !== "/dashboard/onboarding"
  );

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push("/login"); return; }
    // Only owners go through onboarding. Staff/managers access the dashboard directly.
    if (!onboarded && (userRole === "owner" || userRole === null) && pathname !== "/dashboard/onboarding") {
      router.replace("/onboarding");
    }
  }, [router, isLoading, onboarded, pathname, user, userRole]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on nav
    setMoreOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (pathname.startsWith("/dashboard/editor")) {
    return (
      <div className="min-h-screen bg-surface" data-auth-ready={authReady ? "true" : undefined}>
        <PWAInstallPrompt />
        <main className="w-full h-screen overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface" data-auth-ready={authReady ? "true" : undefined}>
      <PWAInstallPrompt />
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-full flex-col py-6 z-50 bg-surface border-r border-surface-container font-[var(--font-headline)] text-sm font-medium transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
        {/* Header */}
        <div className={`mb-10 flex items-center ${collapsed ? "justify-center px-3 flex-col gap-3" : "justify-between px-8"}`}>
          {collapsed ? (
            <Link href="/" title="Back to site" className="w-7 h-7 bg-primary rounded-md flex items-center justify-center hover:opacity-80 transition-opacity shrink-0">
              <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
            </Link>
          ) : (
            <div>
              <Link href="/" className="text-xl font-extrabold text-primary-container block">MENUZA AI</Link>
              <p className="text-xs text-secondary opacity-70">Business Dashboard</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-secondary hover:text-primary transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* Location switcher — Business plan with multiple restaurants */}
        {!collapsed && ownedRestaurants.length > 1 && (
          <div className="px-4 mb-4">
            <label className="block text-[9px] font-bold uppercase text-secondary opacity-60 mb-1">Location</label>
            <select
              value={restaurantId ?? ""}
              onChange={(e) => switchRestaurantLocation(e.target.value)}
              aria-label="Switch restaurant location"
              className="w-full text-xs font-semibold bg-surface-container border border-outline-variant/30 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {ownedRestaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="space-y-1 px-2 flex-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`flex items-center ${collapsed ? "justify-center px-3" : "gap-3 px-4"} py-3 rounded-xl transition-all ${isActive ? "bg-primary/10 text-primary" : "text-secondary hover:text-primary hover:bg-surface-container-low"}`}
              >
                <span className={`material-symbols-outlined shrink-0 ${isActive ? "icon-fill" : ""}`}>{link.icon}</span>
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Platform admin shortcut — only shown to admin emails */}
        {isPlatformAdmin(user?.email) && (
          <div className="px-2 mt-2 mb-2">
            <Link
              href="/admin/settings"
              title={collapsed ? "Platform Admin" : undefined}
              className={`flex items-center ${collapsed ? "justify-center px-3" : "gap-3 px-4"} py-2.5 rounded-xl transition-all text-secondary hover:text-primary hover:bg-surface-container-low`}
            >
              <span className="material-symbols-outlined shrink-0 text-[18px]">admin_panel_settings</span>
              {!collapsed && <span className="text-xs font-bold uppercase tracking-wider">Platform Admin</span>}
            </Link>
          </div>
        )}

        {/* User profile */}
        <div className={`${collapsed ? "px-2" : "px-8"} mt-auto pt-6 border-t border-surface-container`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-primary/20 flex items-center justify-center text-primary"
              title={collapsed ? (restaurantName || user?.email?.split("@")[0] || "My Restaurant") : undefined}
            >
              {restaurantLogoUrl ? (
                <NextImage src={restaurantLogoUrl} alt={restaurantName || "Logo"} width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <span className="material-symbols-outlined text-sm">store</span>
              )}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold truncate">
                  {restaurantName || user?.email?.split("@")[0] || "My Restaurant"}
                  {userRole && <span className="ml-1 text-[8px] uppercase opacity-70 bg-primary/10 px-1 py-0.5 rounded">[{userRole}]</span>}
                </p>
                <button type="button" onClick={handleSignOut} className="text-[10px] opacity-60 hover:text-primary transition-colors block">Sign Out</button>
              </div>
            )}
          </div>
          {collapsed && (
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="mt-3 w-full flex justify-center text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Subscription / trial banner */}
      {showBanner && (
        <div className={`fixed top-0 z-[60] transition-all duration-300 ${collapsed ? "lg:left-16" : "lg:left-64"} left-0 right-0`}>
          <Link
            href="/dashboard/settings"
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold w-full hover:opacity-90 transition-opacity ${
              trialHasEnded && !trialChoiceMade
                ? "bg-red-600 text-white"
                : trialDaysLeft !== null
                ? "bg-violet-600 text-white"
                : daysUntilExpiry! <= 0
                ? "bg-red-600 text-white"
                : "bg-amber-400 text-amber-950"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {trialHasEnded && !trialChoiceMade
                ? "error"
                : trialDaysLeft !== null
                ? "experiment"
                : daysUntilExpiry! <= 0
                ? "error"
                : "schedule"}
            </span>
            {trialHasEnded && !trialChoiceMade
              ? "Your free trial has ended — choose your plan to continue"
              : trialDaysLeft !== null
              ? trialDaysLeft === 0
                ? "Your free trial ends today — upgrade to keep Pro features"
                : trialDaysLeft === 1
                ? "1 day left on your free trial — upgrade to keep access"
                : `${trialDaysLeft} days left on your free trial — upgrade anytime`
              : daysUntilExpiry! <= 0
              ? "Your plan has expired — renew now to keep Pro features"
              : daysUntilExpiry === 1
              ? "Your plan expires tomorrow — renew to avoid interruption"
              : `Your plan expires in ${daysUntilExpiry} days — tap to renew`}
            <span className="material-symbols-outlined text-[16px] opacity-70">chevron_right</span>
          </Link>
        </div>
      )}

      {/* Trial expired — choose your plan modal */}
      {showTrialExpiredModal && restaurantId && (
        <TrialExpiredModal
          restaurantId={restaurantId}
          onDismiss={() => setTrialChoiceMade(true)}
        />
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen pb-24 lg:pb-0 ${collapsed ? "lg:ml-16" : "lg:ml-64"} ${showBanner ? "pt-10" : ""}`}>
        <div className="w-full h-full bg-surface-container-lowest lg:rounded-[3rem] shadow-2xl border border-surface-container-high/50 overflow-hidden relative min-h-[calc(100vh-48px)]">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <>
        {moreOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
        )}
        {moreOpen && (
          <div className="lg:hidden fixed bottom-20 left-4 right-4 z-[60] bg-surface/95 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-2xl p-4 grid grid-cols-4 gap-2">
            {mobileMoreLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl gap-1 transition-all ${isActive ? "bg-primary/10 text-primary" : "text-secondary hover:bg-surface-container-low"}`}>
                  <span className={`material-symbols-outlined text-lg ${isActive ? "icon-fill" : ""}`}>{link.icon}</span>
                  <span className="text-[9px] font-bold uppercase">{link.label}</span>
                </Link>
              );
            })}
            {isPlatformAdmin(user?.email) && (
              <Link
                href="/admin/settings"
                className={`flex flex-col items-center justify-center p-3 rounded-2xl gap-1 transition-all ${pathname.startsWith("/admin") ? "bg-primary/10 text-primary" : "text-secondary hover:bg-surface-container-low"}`}
              >
                <span className={`material-symbols-outlined text-lg ${pathname.startsWith("/admin") ? "icon-fill" : ""}`}>admin_panel_settings</span>
                <span className="text-[9px] font-bold uppercase">Admin</span>
              </Link>
            )}
          </div>
        )}
        <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-end px-4 pb-4 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] rounded-t-[2rem]">
          {mobileNavLinks.map((link) => {
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
          {mobileMoreLinks.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex flex-col items-center justify-center p-2 ${moreOpen ? "text-primary" : "text-secondary"}`}
            >
              <span className={`material-symbols-outlined text-sm ${moreOpen ? "icon-fill" : ""}`}>more_horiz</span>
              <span className="text-[9px] font-bold uppercase mt-1">More</span>
            </button>
          )}
        </div>
      </>
    </div>
  );
}

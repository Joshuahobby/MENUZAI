"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { confirm, prompt } from "@/components/Modals";
import { SkeletonCard } from "@/components/Skeleton";
import { useMenu } from "@/context/MenuContext";
import { supabase } from "@/lib/supabase";
import { getPlanLimits, getPlanMeta, isUnlimited } from "@/lib/plans";
import type { MenuItem } from "@/types/menu";

interface MenuRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  items: MenuItem[];
  view_count: number;
  updated_at: string;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuActions, setOpenMenuActions] = useState<string | null>(null);
  const { switchMenu, createMenu, deleteMenu, renameMenu, duplicateMenu, publishMenu, unpublishMenu, activeMenuId, plan, user, userRole, isLoading } = useMenu();
  const router = useRouter();

  const limits = getPlanLimits(plan);
  const planMeta = getPlanMeta(plan);
  const unlimited = isUnlimited(plan);

  const publishedMenus = menus.filter(m => m.status === "published");
  const atCreateLimit = !unlimited && menus.length >= limits.maxTotal;
  const atPublishedLimit = !unlimited && publishedMenus.length >= limits.maxPublished;

  const loadMenus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("menus")
      .select("id, name, slug, status, items, view_count, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setMenus(data);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadMenus(); }, [user?.id]);

  const handleEdit = async (menuId: string) => {
    await switchMenu(menuId);
    router.push("/dashboard/editor");
  };

  const handleCreateNew = async () => {
    if (atCreateLimit) {
      toast.error("Menu limit reached.", {
        description: "Free plan allows 1 menu. Upgrade to Pro for unlimited menus.",
        action: { label: "Upgrade", onClick: () => router.push("/pricing") },
      });
      return;
    }
    const name = await prompt({
      title: "New Menu",
      placeholder: "e.g. Lunch Menu",
      defaultValue: "New Menu",
      confirmLabel: "Create",
    });
    if (!name) return;

    setLoading(true);
    const newId = await createMenu(name);
    if (newId) {
      router.push("/dashboard/editor");
    } else {
      setLoading(false);
      toast.error("Failed to create menu.");
    }
  };

  const handleDelete = async (menuId: string, menuName: string) => {
    const ok = await confirm({
      title: "Delete Menu",
      message: `Are you sure you want to delete "${menuName}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    const success = await deleteMenu(menuId);
    if (success) {
      toast.success(`"${menuName}" deleted.`);
      loadMenus();
    } else {
      toast.error("Failed to delete menu.");
    }
  };

  const handleRename = async (menuId: string, currentName: string) => {
    const newName = await prompt({
      title: "Rename Menu",
      defaultValue: currentName,
      placeholder: "Menu name",
      confirmLabel: "Save",
    });
    if (!newName || !newName.trim() || newName === currentName) return;

    const success = await renameMenu(menuId, newName.trim());
    if (success) {
      toast.success("Menu renamed.");
      loadMenus();
    } else {
      toast.error("Failed to rename menu.");
    }
  };

  const handleDuplicate = async (menuId: string, menuName: string) => {
    const newId = await duplicateMenu(menuId);
    if (newId) {
      toast.success(`"${menuName}" duplicated.`);
      loadMenus();
    } else {
      toast.error("Failed to duplicate menu.");
    }
  };

  const handleUnpublish = async (menuId: string, menuName: string) => {
    const ok = await confirm({
      title: "Unpublish Menu",
      message: `"${menuName}" will no longer be visible to customers. You can republish it at any time.`,
      confirmLabel: "Unpublish",
      danger: false,
    });
    if (!ok) return;

    if (menuId !== activeMenuId) await switchMenu(menuId);
    await unpublishMenu();
    toast.success(`"${menuName}" unpublished.`);
    loadMenus();
  };

  const handlePublish = async (menuId: string) => {
    if (atPublishedLimit) {
      toast.error("Published menu limit reached.", {
        description: "Upgrade to Pro for unlimited published menus, or unpublish your current live menu.",
        action: { label: "Upgrade", onClick: () => router.push("/pricing") },
      });
      return;
    }
    const slug = await publishMenu(menuId);
    if (slug) {
      toast.success("Menu published successfully!");
      loadMenus();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole === "staff") {
    return (
      <div className="p-6 lg:p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-error/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-3xl icon-fill">gpp_maybe</span>
          </div>
          <h2 className="text-xl font-headline font-extrabold tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            Staff accounts are restricted to viewing and managing live orders only. Menu changes require Manager or Owner permissions.
          </p>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-linear-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:bg-[#a04100] active:scale-95 transition-colors text-center block w-full"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12" onClick={() => setOpenMenuActions(null)}>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight mb-1">My Menus</h1>
          <p className="text-secondary">Manage all your digital menus in one place</p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={atCreateLimit}
          className="px-6 py-3 bg-linear-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-colors flex items-center gap-2 cursor-pointer border-none outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <span className="material-symbols-outlined text-sm">add</span> Create New Menu
        </button>
      </div>

      {/* Plan usage bar */}
      <div className="flex flex-wrap items-center gap-3 mb-10 p-4 bg-surface-container-lowest rounded-2xl border border-surface-container/50">
        <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${planMeta.badgeClass}`}>
          {planMeta.label} Plan
        </span>

        {unlimited ? (
          <span className="flex items-center gap-1.5 text-sm text-secondary">
            <span className="material-symbols-outlined text-base text-tertiary">all_inclusive</span>
            Unlimited menus
          </span>
        ) : (
          <>
            <UsagePill label="Menus" used={menus.length} max={limits.maxTotal} atLimit={atCreateLimit} />
            <Link
              href="/pricing"
              className="ml-auto text-xs font-bold text-primary flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
              Upgrade for unlimited
            </Link>
          </>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => {
            const itemCount = Array.isArray(menu.items) ? menu.items.length : 0;
            const isPublished = menu.status === "published";
            const isActive = menu.id === activeMenuId;
            const actionsOpen = openMenuActions === menu.id;

            return (
              <div
                key={menu.id}
                className={`bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm border transition-colors relative ${
                  isActive ? "border-primary shadow-primary/10" : "border-surface-container/50 hover:shadow-lg"
                }`}
              >
                {isActive && (
                  <div className="absolute top-4 left-4 z-10 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Active Editor
                  </div>
                )}

                {/* Always-visible … menu button */}
                <div className="absolute top-4 right-4 z-20">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpenMenuActions(actionsOpen ? null : menu.id); }}
                    className="w-8 h-8 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center text-secondary hover:text-on-surface transition-colors"
                    title="Menu options"
                  >
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>

                  {actionsOpen && (
                    <div
                      className="absolute top-10 right-0 bg-surface-container-lowest rounded-2xl shadow-xl border border-black/5 py-1.5 min-w-[170px] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => { setOpenMenuActions(null); handleRename(menu.id, menu.name); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-black/3 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOpenMenuActions(null); handleDuplicate(menu.id, menu.name); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-black/3 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">content_copy</span>
                        Duplicate
                      </button>
                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => { setOpenMenuActions(null); handleUnpublish(menu.id, menu.name); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-black/3 transition-colors text-left"
                        >
                          <span className="material-symbols-outlined text-[18px] text-amber-500">unpublished</span>
                          Unpublish
                        </button>
                      )}
                      <div className="my-1 border-t border-black/5" />
                      <button
                        type="button"
                        onClick={() => { setOpenMenuActions(null); handleDelete(menu.id, menu.name); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-error-container/50 transition-colors text-error text-left"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-40 bg-linear-to-br from-primary/10 to-primary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary/30 text-[80px]">restaurant_menu</span>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      title={menu.name}
                      className="font-headline font-bold text-lg truncate pr-2"
                    >
                      {menu.name}
                    </h3>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full shrink-0 shadow-sm ${
                      isPublished
                        ? "bg-tertiary text-white ring-4 ring-tertiary/10"
                        : "bg-surface-container-highest text-secondary"
                    }`}>
                      {menu.status}
                    </span>
                  </div>

                  <p className="text-secondary text-sm mb-4">
                    {itemCount} items · Updated {formatRelativeTime(menu.updated_at)}
                  </p>

                  {isPublished && menu.view_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-secondary mb-4">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      {menu.view_count} views
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(menu.id)}
                      className="flex-1 py-3 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors border-none outline-none cursor-pointer"
                    >
                      Edit
                    </button>
                    {isPublished && menu.slug ? (
                      <Link
                        href={`/menu/${menu.slug}`}
                        className="flex-1 flex items-center justify-center py-3 bg-tertiary/10 text-tertiary font-bold rounded-xl text-sm hover:bg-tertiary/20 transition-colors border-none"
                      >
                        Preview
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePublish(menu.id)}
                        className="flex-1 py-3 bg-tertiary text-white font-bold rounded-[2rem] text-sm hover:bg-[#145c2c] transition-colors border-none cursor-pointer"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create New card */}
          <button
            onClick={handleCreateNew}
            className="bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center min-h-[300px] hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer group outline-none"
          >
            {atCreateLimit ? (
              <>
                <span className="material-symbols-outlined text-amber-500 text-4xl mb-4">lock</span>
                <p className="font-headline font-bold text-on-surface">Menu Limit Reached</p>
                <p className="text-sm text-secondary mb-4 px-6 text-center">
                  Free plan allows 1 menu. Delete yours or upgrade to create more.
                </p>
                <span className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full">
                  Upgrade to Pro →
                </span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-primary text-4xl mb-4 group-hover:scale-110 transition-transform">add_circle</span>
                <p className="font-headline font-bold text-on-surface">Create Blank Menu</p>
                <p className="text-sm text-secondary">Start from scratch</p>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function UsagePill({
  label, used, max, atLimit,
}: {
  label: string;
  used: number;
  max: number;
  atLimit: boolean;
}) {
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
      atLimit ? "bg-accent-saffron/20 text-amber-700" : "bg-surface-container text-secondary"
    }`}>
      {atLimit && <span className="material-symbols-outlined text-sm">warning</span>}
      {label}: {used}/{max}
    </span>
  );
}

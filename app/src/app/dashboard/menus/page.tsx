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

interface MenuRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  items: unknown[];
  view_count: number;
  updated_at: string;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { switchMenu, createMenu, deleteMenu, renameMenu, publishMenu, activeMenuId, plan, user } = useMenu();
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
    setTimeout(() => setLoading(false), 0);
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
      setTimeout(() => setLoading(false), 0);
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
    if (!newName || newName === currentName) return;

    const success = await renameMenu(menuId, newName);
    if (success) {
      toast.success("Menu renamed.");
      loadMenus();
    } else {
      toast.error("Failed to rename menu.");
    }
  };

  const handlePublish = async (menuId: string) => {
    if (atPublishedLimit) {
      toast.error("Published menu limit reached.", {
        description: "Upgrade to Pro for unlimited published menus, or unpublish your current live menu.",
        action: { label: "Upgrade", onClick: () => router.push("/pricing") },
      });
      return;
    }
    await switchMenu(menuId);
    const slug = await publishMenu();
    if (slug) {
      toast.success("Menu published successfully!");
      loadMenus();
    }
  };

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">My Menus</h1>
          <p className="text-secondary">Manage all your digital menus in one place</p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={atCreateLimit}
          className="px-6 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-none outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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

            return (
              <div
                key={menu.id}
                className={`bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm border transition-all group relative ${
                  isActive ? "border-primary shadow-primary/10" : "border-surface-container/50 hover:shadow-lg"
                }`}
              >
                {isActive && (
                  <div className="absolute top-4 left-4 z-10 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Active Editor
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRename(menu.id, menu.name)}
                    className="w-8 h-8 rounded-full bg-white text-secondary hover:text-primary shadow-md flex items-center justify-center transition-colors"
                    title="Rename"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id, menu.name)}
                    className="w-8 h-8 rounded-full bg-white text-secondary hover:text-error shadow-md flex items-center justify-center transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>

                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary/30 text-[80px]">restaurant_menu</span>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-[var(--font-headline)] font-bold text-lg truncate pr-2">{menu.name}</h3>
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
                        className="flex-1 py-3 bg-tertiary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all border-none cursor-pointer"
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
            className="bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center min-h-[300px] hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group outline-none"
          >
            {atCreateLimit ? (
              <>
                <span className="material-symbols-outlined text-amber-500 text-4xl mb-4">lock</span>
                <p className="font-[var(--font-headline)] font-bold text-on-surface">Menu Limit Reached</p>
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
                <p className="font-[var(--font-headline)] font-bold text-on-surface">Create Blank Menu</p>
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
      atLimit ? "bg-amber-100 text-amber-700" : "bg-surface-container text-secondary"
    }`}>
      {atLimit && <span className="material-symbols-outlined text-sm">warning</span>}
      {label}: {used}/{max}
    </span>
  );
}

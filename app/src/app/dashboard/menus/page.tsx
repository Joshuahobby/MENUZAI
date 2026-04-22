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
  const { switchMenu, createMenu, deleteMenu, renameMenu, activeMenuId, plan } = useMenu();
  const router = useRouter();

  const loadMenus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("menus")
      .select("id, name, slug, status, items, view_count, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setMenus(data);
    setTimeout(() => setLoading(false), 0);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMenus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleEdit = async (menuId: string) => {
    await switchMenu(menuId);
    router.push("/dashboard/editor");
  };

  const handleCreateNew = async () => {
    const draftCount = menus.filter(m => m.status === 'draft').length;
    if (plan === "free" && draftCount >= 1) {
      toast.error("Draft limit reached.", { 
        description: "Free plan allows 1 draft menu. Publish your current draft to start a new design." 
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

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">My Menus</h1>
          <p className="text-secondary">Manage all your digital menus in one place</p>
        </div>
        <button onClick={handleCreateNew} className="px-6 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-none outline-none">
          <span className="material-symbols-outlined text-sm">add</span> Create New Menu
        </button>
      </div>

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
              <div key={menu.id} className={`bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm border transition-all group relative ${isActive ? 'border-primary shadow-primary/10' : 'border-surface-container/50 hover:shadow-lg'}`}>
                {isActive && (
                  <div className="absolute top-4 left-4 z-10 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Active Editor
                  </div>
                )}
                
                {/* Actions Menu */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleRename(menu.id, menu.name)}
                    className="w-8 h-8 rounded-full bg-white text-secondary hover:text-primary shadow-md flex items-center justify-center transition-colors"
                    title="Rename Menu"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(menu.id, menu.name)}
                    className="w-8 h-8 rounded-full bg-white text-secondary hover:text-error shadow-md flex items-center justify-center transition-colors"
                    title="Delete Menu"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>

                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-primary/30 text-[80px]">restaurant_menu</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-[var(--font-headline)] font-bold text-lg truncate pr-2">{menu.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shrink-0 ${isPublished ? "bg-tertiary-container text-white" : "bg-surface-container-highest text-secondary"}`}>
                      {menu.status}
                    </span>
                  </div>
                  <p className="text-secondary text-sm mb-4">{itemCount} items · Updated {formatRelativeTime(menu.updated_at)}</p>
                  {isPublished && menu.view_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-secondary mb-4">
                      <span className="material-symbols-outlined text-sm">visibility</span> {menu.view_count} views
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(menu.id)} className="flex-1 py-3 bg-primary/10 text-primary font-bold rounded-xl text-sm text-center hover:bg-primary/20 transition-colors border-none outline-none cursor-pointer">
                      Edit
                    </button>
                    {isPublished && menu.slug ? (
                      <Link href={`/menu/${menu.slug}`} className="flex-1 flex items-center justify-center py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl text-sm text-center hover:bg-surface-variant transition-colors">
                        Preview
                      </Link>
                    ) : (
                      <button disabled className="flex-1 py-3 bg-surface-container-low text-secondary font-bold rounded-xl text-sm text-center opacity-50 cursor-not-allowed border-none">
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create New Card */}
          <button onClick={handleCreateNew} className="bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center min-h-[300px] hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group outline-none">
            {plan === "free" && menus.filter(m => m.status === 'draft').length >= 1 ? (
              <>
                <span className="material-symbols-outlined text-primary text-4xl mb-4">auto_awesome_motion</span>
                <p className="font-[var(--font-headline)] font-bold text-on-surface">1 Draft Active</p>
                <p className="text-sm text-secondary">Free plan allows 1 Draft & 1 Published</p>
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
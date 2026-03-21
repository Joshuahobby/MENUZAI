"use client";

import Link from "next/link";

export default function MenusPage() {
  const menus = [
    { id: "1", name: "Main Dinner Menu", items: 24, status: "Published", lastUpdated: "2 hours ago", views: 342 },
    { id: "2", name: "Lunch Specials", items: 12, status: "Published", lastUpdated: "1 day ago", views: 154 },
    { id: "3", name: "Weekend Brunch", items: 18, status: "Draft", lastUpdated: "3 days ago", views: 0 },
  ];

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">My Menus</h1>
          <p className="text-secondary">Manage all your digital menus in one place</p>
        </div>
        <Link href="/upload" className="px-6 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Create New Menu
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu) => (
          <div key={menu.id} className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm border border-surface-container/50 hover:shadow-lg transition-all group">
            <div className="h-40 bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary/30 text-[80px]">restaurant_menu</span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-[var(--font-headline)] font-bold text-lg">{menu.name}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${menu.status === "Published" ? "bg-tertiary-container text-white" : "bg-surface-container-highest text-secondary"}`}>
                  {menu.status}
                </span>
              </div>
              <p className="text-secondary text-sm mb-4">{menu.items} items · Updated {menu.lastUpdated}</p>
              {menu.views > 0 && (
                <div className="flex items-center gap-1 text-xs text-secondary mb-4">
                  <span className="material-symbols-outlined text-sm">visibility</span> {menu.views} views
                </div>
              )}
              <div className="flex gap-3">
                <Link href="/dashboard/editor" className="flex-1 py-3 bg-primary/10 text-primary font-bold rounded-xl text-sm text-center hover:bg-primary/20 transition-colors">
                  Edit
                </Link>
                <Link href="/menu/demo" className="flex-1 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl text-sm text-center hover:bg-surface-variant transition-colors">
                  Preview
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <Link href="/upload" className="bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center min-h-[300px] hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
          <span className="material-symbols-outlined text-primary text-4xl mb-4 group-hover:scale-110 transition-transform">add_circle</span>
          <p className="font-[var(--font-headline)] font-bold text-on-surface">Create New Menu</p>
          <p className="text-sm text-secondary">Upload or start from a template</p>
        </Link>
      </div>
    </div>
  );
}

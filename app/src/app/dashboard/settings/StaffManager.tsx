"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMenu } from "@/context/MenuContext";
import { confirm } from "@/components/Modals";

type StaffMember = {
  id: string;
  user_id: string;
  email: string;
  role: "owner" | "manager" | "staff";
  created_at: string;
};

export function StaffManager() {
  const { restaurantId, userRole } = useMenu();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff");
  const [inviting, setInviting] = useState(false);

  // We only render this for owners and managers, but only owners can invite/remove.
  const isOwner = userRole === "owner";

  useEffect(() => {
    if (!restaurantId) return;
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/staff?restaurantId=${restaurantId}`);
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite staff");

      toast.success("Staff invited successfully.");
      setInviteEmail("");
      setInviteRole("staff");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, email: string) => {
    const ok = await confirm({
      title: "Remove Staff",
      message: `Are you sure you want to remove ${email} from the staff? They will lose access immediately.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/staff?restaurantId=${restaurantId}&userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove staff");

      toast.success("Staff removed.");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50 animate-pulse h-64 flex items-center justify-center">
        <span className="text-secondary">Loading staff...</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50 lg:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-[var(--font-headline)] font-bold text-lg">Staff Management</h3>
          <p className="text-sm text-secondary">Manage who has access to your restaurant dashboard.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Staff List */}
        <div className="space-y-3">
          {staff.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                  {member.email.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{member.email}</p>
                  <p className="text-xs text-secondary capitalize">{member.role}</p>
                </div>
              </div>
              
              {isOwner && member.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => handleRemove(member.user_id, member.email)}
                  className="w-8 h-8 rounded-full hover:bg-error/10 text-secondary hover:text-error flex items-center justify-center transition-colors"
                  title="Remove Staff"
                >
                  <span className="material-symbols-outlined text-[18px]">person_remove</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite Form */}
        {isOwner && (
          <form onSubmit={handleInvite} className="pt-6 border-t border-surface-container flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="staff@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "manager" | "staff")}
              className="bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="staff">Staff (Orders Only)</option>
              <option value="manager">Manager (Full Access)</option>
            </select>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="py-3 px-6 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              {inviting ? "Inviting..." : "Invite"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

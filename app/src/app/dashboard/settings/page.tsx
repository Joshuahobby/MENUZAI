"use client";

import { useState, useEffect } from "react";
import { useMenu } from "@/context/MenuContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function SettingsPage() {
  const { restaurantId, restaurantName, setRestaurantName, restaurantPhone, setRestaurantPhone } = useMenu();

  const [name, setName] = useState(restaurantName);
  const [tagline, setTagline] = useState("");
  const [hours, setHours] = useState("");
  const [phone, setPhone] = useState(restaurantPhone);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const [savingInfo, setSavingInfo] = useState(false);
  const [savedInfo, setSavedInfo] = useState(false);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [savedWhatsApp, setSavedWhatsApp] = useState(false);

  // Load restaurant data from Supabase on mount
  useEffect(() => {
    if (!restaurantId) return;

    const load = async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("name, tagline, phone, hours")
        .eq("id", restaurantId)
        .single();

      if (data) {
        setName(data.name ?? "");
        setTagline(data.tagline ?? "");
        setHours(data.hours ?? "");
        setPhone(data.phone ?? "");
        setWhatsappEnabled(!!data.phone);
      }
    };

    load();
  }, [restaurantId]);

  const saveRestaurantInfo = async () => {
    if (!restaurantId) return;
    setSavingInfo(true);
    setSavedInfo(false);

    const { error } = await supabase
      .from("restaurants")
      .update({ name, tagline, hours })
      .eq("id", restaurantId);

    if (!error) {
      setRestaurantName(name);
      setSavedInfo(true);
      toast.success("Restaurant info saved.");
      setTimeout(() => setSavedInfo(false), 2000);
    } else {
      toast.error("Failed to save. Please try again.");
    }
    setSavingInfo(false);
  };

  const saveWhatsAppSettings = async () => {
    if (!restaurantId) return;
    setSavingWhatsApp(true);
    setSavedWhatsApp(false);

    const phoneValue = whatsappEnabled ? phone : null;
    const { error } = await supabase
      .from("restaurants")
      .update({ phone: phoneValue })
      .eq("id", restaurantId);

    if (!error) {
      setRestaurantPhone(phoneValue ?? "");
      setSavedWhatsApp(true);
      toast.success("WhatsApp settings saved.");
      setTimeout(() => setSavedWhatsApp(false), 2000);
    } else {
      toast.error("Failed to save. Please try again.");
    }
    setSavingWhatsApp(false);
  };

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Settings</h1>
        <p className="text-secondary">Manage your restaurant info and WhatsApp ordering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Restaurant Info */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50">
          <h3 className="font-[var(--font-headline)] font-bold text-lg mb-6">Restaurant Info</h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="restaurant-name">Restaurant Name</label>
              <input id="restaurant-name" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                value={name} onChange={(e) => setName(e.target.value)} title="Restaurant Name" aria-label="Restaurant Name" />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="tagline">Tagline</label>
              <input id="tagline" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                value={tagline} onChange={(e) => setTagline(e.target.value)} title="Restaurant Tagline" aria-label="Restaurant Tagline" />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="hours">Operating Hours</label>
              <input id="hours" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                value={hours} onChange={(e) => setHours(e.target.value)} title="Operating Hours" aria-label="Operating Hours" />
            </div>
            <button
              onClick={saveRestaurantInfo}
              disabled={savingInfo}
              className="w-full py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 mt-4 disabled:opacity-60">
              {savingInfo ? "Saving..." : savedInfo ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[var(--font-headline)] font-bold text-lg flex items-center gap-2">
              <svg className="w-5 h-5 fill-whatsapp" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp Ordering
            </h3>
            <button onClick={() => setWhatsappEnabled(!whatsappEnabled)}
              title={whatsappEnabled ? "Disable WhatsApp Ordering" : "Enable WhatsApp Ordering"}
              aria-label={whatsappEnabled ? "Disable WhatsApp Ordering" : "Enable WhatsApp Ordering"}
              className={`w-12 h-7 rounded-full transition-all relative ${whatsappEnabled ? "bg-whatsapp" : "bg-surface-container-highest"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${whatsappEnabled ? "right-1" : "left-1"}`}></div>
            </button>
          </div>

          {whatsappEnabled && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="whatsapp-phone">WhatsApp Phone Number</label>
                <input id="whatsapp-phone" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                  value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" title="WhatsApp Phone Number" aria-label="WhatsApp Phone Number" />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">Message Preview</label>
                <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-whatsapp/20 flex items-center justify-center text-whatsapp shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm text-sm text-on-surface leading-relaxed">
                      <p>Hello, I&apos;d like to order:</p>
                      <p className="mt-1">• Classic Burger x1</p>
                      <p>• Summer Spritz x2</p>
                      <p className="mt-2 font-bold">Total: $42.50</p>
                      <p>Name: John</p>
                      <p>Table: 5</p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={saveWhatsAppSettings}
                disabled={savingWhatsApp}
                className="w-full py-3 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-60">
                {savingWhatsApp ? "Saving..." : savedWhatsApp ? "Saved!" : "Save WhatsApp Settings"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { useMenu } from "@/context/MenuContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "RWF", name: "Rwandan Franc" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "ZAR", name: "South African Rand" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "XOF", name: "West African CFA" },
  { code: "XAF", name: "Central African CFA" },
];

export default function SettingsPage() {
  const {
    restaurantId,
    plan: restaurantPlan,
    restaurantName, setRestaurantName,
    restaurantPhone, setRestaurantPhone,
    restaurantLogoUrl, setRestaurantLogoUrl,
    menuStyle, setMenuStyle,
  } = useMenu();

  const [name, setName] = useState(restaurantName);
  const [tagline, setTagline] = useState("");
  const [hours, setHours] = useState("");
  const [phone, setPhone] = useState(restaurantPhone);
  const [currency, setCurrency] = useState(menuStyle.currency ?? "RWF");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const [savingInfo, setSavingInfo] = useState(false);
  const [savedInfo, setSavedInfo] = useState(false);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [savedWhatsApp, setSavedWhatsApp] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const saveCurrency = () => {
    setMenuStyle({ ...menuStyle, currency });
    toast.success(`Currency set to ${currency}`);
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

  const handleLogoUpload = async (file: File) => {
    if (!restaurantId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use JPG, PNG, or WebP.");
      return;
    }

    setUploadingLogo(true);
    const ext = file.name.split(".").pop();
    const path = `logos/${restaurantId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("restaurant-assets")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error("Upload failed. Check storage bucket permissions.");
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("restaurant-assets")
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    const { error: dbError } = await supabase
      .from("restaurants")
      .update({ logo_url: publicUrl })
      .eq("id", restaurantId);

    if (dbError) {
      toast.error("Saved to storage but failed to update profile.");
    } else {
      setRestaurantLogoUrl(publicUrl);
      toast.success("Logo updated.");
    }

    setUploadingLogo(false);
  };

  const removeLogo = async () => {
    if (!restaurantId) return;
    await supabase.from("restaurants").update({ logo_url: null }).eq("id", restaurantId);
    setRestaurantLogoUrl("");
    toast.success("Logo removed.");
  };

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Settings</h1>
        <p className="text-secondary">Manage your restaurant profile and WhatsApp ordering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Plan & Billing */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50 lg:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="font-[var(--font-headline)] font-bold text-lg mb-2">Subscription & Plan</h3>
              <p className="text-sm text-secondary">You are currently on the <span className="font-bold text-primary uppercase">{restaurantPlan}</span> plan.</p>
            </div>
            {restaurantPlan === "free" ? (
              <a 
                href="/pricing"
                className="px-8 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary-container/20 hover:shadow-xl active:scale-95 transition-all"
              >
                Upgrade to Pro
              </a>
            ) : (
              <div className="px-6 py-2 bg-tertiary/10 text-tertiary font-bold rounded-xl text-xs uppercase tracking-widest">
                Pro Member
              </div>
            )}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50 lg:col-span-2">
          <h3 className="font-[var(--font-headline)] font-bold text-lg mb-6">Restaurant Logo</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Preview */}
            <div
              className="w-24 h-24 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border border-surface-container cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => logoInputRef.current?.click()}
              title="Click to upload logo"
            >
              {restaurantLogoUrl ? (
                <NextImage
                  src={restaurantLogoUrl}
                  alt="Restaurant logo"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-secondary text-3xl">storefront</span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <p className="text-sm text-secondary leading-relaxed">
                Your logo appears on the customer-facing menu page. Recommended: square image, at least 200×200px, under 2MB.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="px-5 py-2.5 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {uploadingLogo ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Uploading…
                    </span>
                  ) : restaurantLogoUrl ? "Replace Logo" : "Upload Logo"}
                </button>
                {restaurantLogoUrl && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="px-5 py-2.5 bg-error/10 text-error font-bold rounded-xl text-sm hover:bg-error/20 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
                title="Upload logo"
                aria-label="Upload restaurant logo"
              />
              <p className="text-[10px] text-secondary">JPG, PNG, WebP · Max 2MB</p>
            </div>
          </div>
        </div>

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

        {/* Currency */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50">
          <h3 className="font-[var(--font-headline)] font-bold text-lg mb-2">Currency</h3>
          <p className="text-xs text-secondary mb-6">Applied to all prices on your active menu and customer-facing pages.</p>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="currency-setting">Menu Currency</label>
              <select
                id="currency-setting"
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                title="Menu Currency"
                aria-label="Menu Currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
            <div className="bg-surface-container-low rounded-2xl px-5 py-4 text-sm text-secondary flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">payments</span>
              <span>Prices will display as <strong className="text-on-surface">{currency} {currency === "RWF" || currency === "UGX" || currency === "TZS" ? "5,000" : "12.50"}</strong></span>
            </div>
            <button
              type="button"
              onClick={saveCurrency}
              className="w-full py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
              Save Currency
            </button>
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[var(--font-headline)] font-bold text-lg flex items-center gap-2">
              <svg className="w-5 h-5 fill-whatsapp" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp Ordering
            </h3>
            <button type="button" onClick={() => setWhatsappEnabled(!whatsappEnabled)}
              title={whatsappEnabled ? "Disable WhatsApp Ordering" : "Enable WhatsApp Ordering"}
              aria-label={whatsappEnabled ? "Disable WhatsApp Ordering" : "Enable WhatsApp Ordering"}
              className={`w-12 h-7 rounded-full transition-all relative ${whatsappEnabled ? "bg-whatsapp" : "bg-surface-container-highest"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${whatsappEnabled ? "right-1" : "left-1"}`}></div>
            </button>
          </div>

          {whatsappEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="whatsapp-phone">WhatsApp Phone Number</label>
                  <input id="whatsapp-phone" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                    value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" title="WhatsApp Phone Number" aria-label="WhatsApp Phone Number" />
                </div>
                <button
                  onClick={saveWhatsAppSettings}
                  disabled={savingWhatsApp}
                  className="w-full py-3 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-60">
                  {savingWhatsApp ? "Saving..." : savedWhatsApp ? "Saved!" : "Save WhatsApp Settings"}
                </button>
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">Message Preview</label>
                <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-whatsapp/20 flex items-center justify-center text-whatsapp shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm text-sm text-on-surface leading-relaxed">
                      <p>Hello, I&apos;d like to order:</p>
                      <p className="mt-1">• Classic Burger x1</p>
                      <p>• Summer Spritz x2</p>
                      <p className="mt-2 font-bold">Total: 5,000 RWF</p>
                      <p>Name: John</p>
                      <p>Table: 5</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

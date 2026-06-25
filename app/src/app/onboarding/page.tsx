"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMenu } from "@/context/MenuContext";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const {
    restaurantId,
    setRestaurantName,
    setRestaurantPhone,
    setOnboarded,
    isLoading: menuLoading,
    user,
  } = useMenu();


  useEffect(() => {
    if (menuLoading) return;
    if (!user) router.replace("/login");
  }, [menuLoading, user, router]);

  const [step, setStep] = useState<Step>(1);

  // Step 1: Restaurant info
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState("RWF");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [tagline, setTagline] = useState("");
  const [hours, setHours] = useState("");

  // Step 2: WhatsApp
  const [phone, setPhone] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already onboarded — use restaurantId from context (more
  // precise than user_id for multi-location owners)
  useEffect(() => {
    if (menuLoading || !restaurantId) return;
    supabase
      .from("restaurants")
      .select("onboarded")
      .eq("id", restaurantId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarded) router.replace("/dashboard");
      });
  }, [menuLoading, restaurantId, router]);

  const saveStep1 = async () => {
    if (!name.trim()) { setError("Please enter your restaurant name."); return; }
    if (!termsAccepted) { setError("You must accept the Terms of Service to continue."); return; }
    if (!restaurantId) { setError("Restaurant not ready — please wait a moment and try again."); return; }
    setError(null);
    setSaving(true);

    const payload = {
      name: name.trim(),
      tagline: tagline.trim(),
      hours: hours.trim(),
      category: category || null,
      terms_accepted_at: new Date().toISOString(),
    };

    // Always update the specific restaurant row for this session.
    // We never upsert here — useMenuBootstrap already created the row on login.
    // (migration 022 dropped the unique constraint on user_id, so onConflict:"user_id"
    //  would silently INSERT a duplicate row instead of updating.)
    const { error: dbError } = await supabase
      .from("restaurants")
      .update(payload)
      .eq("id", restaurantId);

    if (dbError) { setError("Failed to save. Please try again."); setSaving(false); return; }

    setRestaurantName(name.trim());
    setSaving(false);
    setStep(2);
  };

  const saveStep2 = async () => {
    setError(null);
    setSaving(true);
    const phoneValue = whatsappEnabled ? phone.trim() : null;
    if (whatsappEnabled && !phoneValue) {
      setError("Please enter your WhatsApp number or disable WhatsApp ordering.");
      setSaving(false);
      return;
    }
    // Filter by restaurantId (not userId) so multi-location owners only update
    // the current restaurant, not all their locations.
    const { error: err } = await supabase.from("restaurants").update({ phone: phoneValue }).eq("id", restaurantId!);
    if (err) { setError("Failed to save. Please try again."); setSaving(false); return; }
    setRestaurantPhone(phoneValue ?? "");
    setSaving(false);
    setStep(3);
  };

  const finishOnboarding = async (destination: "upload" | "editor") => {
    setSaving(true);
    // Filter by restaurantId — same reason as saveStep2 (multi-location owners).
    await supabase.from("restaurants").update({ onboarded: true }).eq("id", restaurantId!);

    if (restaurantId) {
      const { data: menu } = await supabase
        .from("menus")
        .select("id, style")
        .eq("restaurant_id", restaurantId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (menu?.id) {
        await supabase.from("menus").update({ style: { ...(menu.style as object ?? {}), currency } }).eq("id", menu.id);
      }
    }

    setOnboarded(true);

    // Fire-and-forget welcome email — log if Resend is misconfigured
    fetch("/api/notifications/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id, restaurantName: name.trim() }),
    }).then(r => r.json().then(b => { if (!b.sent) console.warn("Welcome email not sent:", b.reason); }))
      .catch(() => {});

    setSaving(false);
    router.push(destination === "upload" ? "/upload" : "/dashboard/editor");
  };

  if (menuLoading || !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface overflow-x-hidden">
      {/* Header */}
      <header className="w-full sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-black/5 px-6 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
          </div>
          <span className="font-headline font-black text-base tracking-tight">
            MENUZA <span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs text-secondary/50 font-medium">Takes about 2 minutes</span>
          <a href="mailto:support@menuzaai.com" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
            Need help?
          </a>
        </div>
      </header>

      <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-5 py-10">

        {/* Step progress bar */}
        <div className="w-full max-w-lg mb-10">
          <div className="flex items-center justify-between">
            {[
              { label: "Restaurant", icon: "storefront" },
              { label: "WhatsApp",   icon: "phone"       },
              { label: "Menu",       icon: "restaurant_menu" },
            ].map((s, idx) => {
              const num = idx + 1 as Step;
              const done = step > num;
              const active = step === num;
              return (
                <div key={num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                      done   ? "bg-tertiary text-white shadow-sm" :
                      active ? "bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10" :
                               "bg-surface-container-high text-secondary"
                    }`}>
                      {done
                        ? <span className="material-symbols-outlined text-base icon-fill">check</span>
                        : <span className="material-symbols-outlined text-base">{s.icon}</span>
                      }
                    </div>
                    <span className={`text-[10px] font-bold whitespace-nowrap ${active ? "text-primary" : "text-secondary/60"}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-500 ${
                      step > num ? "bg-tertiary" : "bg-surface-container-highest"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-lg">

          {/* ── Step 1: Restaurant ── */}
          {step === 1 && (
            <div className="space-y-7 animate-[fadeIn_0.3s_ease]">
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-headline font-extrabold tracking-tight mb-2">
                  Tell us about your restaurant
                </h1>
                <p className="text-secondary">This info appears on your digital menu</p>
              </div>

              <div className="space-y-4">
                {/* Required: name */}
                <div>
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 block" htmlFor="ob-name">
                    Restaurant Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="ob-name"
                    className="w-full bg-surface-container-lowest border border-black/8 rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kigali Bites Café"
                    autoFocus
                  />
                </div>

                {/* Category + Currency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 block" htmlFor="ob-category">
                      Restaurant Type
                    </label>
                    <select
                      id="ob-category"
                      className="w-full bg-surface-container-lowest border border-black/8 rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none appearance-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select type</option>
                      <option value="cafe">Café</option>
                      <option value="fine-dining">Fine Dining</option>
                      <option value="fast-food">Fast Food</option>
                      <option value="street-food">Street Food</option>
                      <option value="bar">Bar &amp; Lounge</option>
                      <option value="bakery">Bakery</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 block" htmlFor="ob-currency">
                      Currency
                    </label>
                    <select
                      id="ob-currency"
                      className="w-full bg-surface-container-lowest border border-black/8 rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none appearance-none"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="RWF">RWF — Rwandan Franc</option>
                      <option value="UGX">UGX — Ugandan Shilling</option>
                      <option value="TZS">TZS — Tanzanian Shilling</option>
                      <option value="KES">KES — Kenyan Shilling</option>
                      <option value="NGN">NGN — Nigerian Naira</option>
                      <option value="GHS">GHS — Ghanaian Cedi</option>
                      <option value="XOF">XOF — West African Franc</option>
                      <option value="ZAR">ZAR — South African Rand</option>
                      <option value="ETB">ETB — Ethiopian Birr</option>
                      <option value="EGP">EGP — Egyptian Pound</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                    </select>
                  </div>
                </div>

                {/* Optional details toggle */}
                <button
                  type="button"
                  onClick={() => setShowOptional(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">{showOptional ? "expand_less" : "expand_more"}</span>
                  {showOptional ? "Hide" : "Add"} tagline &amp; hours (optional)
                </button>

                {showOptional && (
                  <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
                    <div>
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 block" htmlFor="ob-tagline">Tagline</label>
                      <input
                        id="ob-tagline"
                        className="w-full bg-surface-container-lowest border border-black/8 rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g. Fresh local flavors, served with love"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 block" htmlFor="ob-hours">Opening Hours</label>
                      <input
                        id="ob-hours"
                        className="w-full bg-surface-container-lowest border border-black/8 rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="e.g. Mon–Sat 7am–10pm"
                      />
                    </div>
                  </div>
                )}

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-black/6 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                  />
                  <span className="text-sm text-secondary leading-snug">
                    I agree to the{" "}
                    <a href="/terms" target="_blank" className="text-primary font-semibold hover:underline">Terms of Service</a>
                    {" "}and{" "}
                    <a href="/privacy" target="_blank" className="text-primary font-semibold hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </div>

              {error && <p className="text-error text-sm font-medium text-center">{error}</p>}

              <button
                onClick={saveStep1}
                disabled={saving || !termsAccepted || !name.trim()}
                className="w-full py-4 bg-primary rounded-[2rem] font-bold text-white hover:bg-[#a04100] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm active:scale-[0.98]"
              >
                {saving ? "Saving…" : "Continue →"}
              </button>
            </div>
          )}

          {/* ── Step 2: WhatsApp ── */}
          {step === 2 && (
            <div className="space-y-7 animate-[fadeIn_0.3s_ease]">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-whatsapp/10 rounded-2xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 fill-whatsapp" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-extrabold tracking-tight mb-2">
                  Set up WhatsApp ordering
                </h1>
                <p className="text-secondary">Customers will order directly to your phone</p>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl border border-black/6 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Enable WhatsApp Ordering</p>
                    <p className="text-xs text-secondary mt-0.5">Receive orders on your phone instantly</p>
                  </div>
                  <button
                    onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${whatsappEnabled ? "bg-whatsapp" : "bg-surface-container-highest"}`}
                    aria-label={whatsappEnabled ? "Disable WhatsApp" : "Enable WhatsApp"}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-colors shadow-sm ${whatsappEnabled ? "right-1" : "left-1"}`} />
                  </button>
                </div>

                {whatsappEnabled && (
                  <div>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 block" htmlFor="ob-phone">
                      WhatsApp Number <span className="text-primary">*</span>
                    </label>
                    <input
                      id="ob-phone"
                      className="w-full bg-surface-container-low border border-black/8 rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-whatsapp/30 focus:border-whatsapp transition-colors outline-none"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+250 788 000 000"
                      type="tel"
                      autoFocus
                    />
                    <p className="text-xs text-secondary mt-1.5">Include country code — e.g. +250 for Rwanda</p>
                  </div>
                )}
              </div>

              {whatsappEnabled && phone && (
                <div className="bg-surface-container-lowest rounded-2xl p-5 border border-black/6">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3">How orders arrive</p>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-whatsapp/15 flex items-center justify-center text-whatsapp shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div className="bg-tertiary/10 rounded-2xl rounded-tl-sm p-4 shadow-sm text-sm text-on-surface leading-relaxed">
                      <p>Hello <span className="font-bold">{name || "Restaurant"}</span>, I&apos;d like to order:</p>
                      <p className="mt-1">· Classic Burger ×1</p>
                      <p className="mt-2 font-bold text-tertiary">Total: 5,000 {currency}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-error text-sm font-medium text-center">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => { setError(null); setStep(1); }}
                  className="px-5 py-4 bg-surface-container-lowest border border-black/8 rounded-2xl font-bold text-sm text-secondary hover:bg-surface-container-low transition-colors active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  onClick={saveStep2}
                  disabled={saving}
                  className="flex-1 py-4 bg-primary rounded-[2rem] font-bold text-white hover:bg-[#a04100] transition-colors disabled:opacity-50 text-sm active:scale-[0.98]"
                >
                  {saving ? "Saving…" : whatsappEnabled ? "Save & Continue →" : "Skip & Continue →"}
                </button>
              </div>
            </div>
          )}


          {/* ── Step 3: Menu Choice + Trial Info (merged from old step 4) ── */}
          {step === 3 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-linear-to-tr from-primary to-primary-container rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary/25">
                  <span className="material-symbols-outlined text-white text-3xl icon-fill">rocket_launch</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-extrabold tracking-tight mb-1">
                  {name ? `${name} is almost live!` : "Almost there!"}
                </h1>
                <p className="text-secondary text-sm">Your 14-day Pro trial is active — no card needed. How do you want to start?</p>
              </div>

              {/* Trial progress bar */}
              <div className="bg-surface-container-lowest rounded-2xl border border-black/6 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-secondary/60">Trial Progress</span>
                  <span className="text-xs font-bold text-primary">Day 1 of 14</span>
                </div>
                <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-primary to-primary-container rounded-full w-[7%]" />
                </div>
                <p className="text-[11px] text-secondary/60 mt-2">Full Pro access — then choose your plan</p>
              </div>

              {/* Menu choice cards — clicking immediately finishes onboarding */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => finishOnboarding("upload")}
                  disabled={saving}
                  className="group relative flex flex-col items-start p-6 bg-on-surface rounded-3xl text-left transition-colors hover:bg-black/70 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-white mb-4">
                    <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-primary px-2.5 py-1 rounded-full">
                    <span className="text-white text-[9px] font-black uppercase tracking-wider">Fastest</span>
                  </div>
                  <h3 className="text-lg font-headline font-bold text-white mb-1">Upload a Photo</h3>
                  <p className="text-white/70 text-sm leading-snug">Take a photo of your existing menu — AI extracts all items in seconds.</p>
                  <div className="mt-5 flex items-center gap-1.5 text-white/80 font-bold text-xs">
                    {saving ? "Setting up…" : "Recommended"}
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </button>

                <button
                  onClick={() => finishOnboarding("editor")}
                  disabled={saving}
                  className="group flex flex-col items-start p-6 bg-surface-container-lowest rounded-3xl text-left transition-colors hover:bg-surface-container-low border border-black/6 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <div className="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">edit_note</span>
                  </div>
                  <h3 className="text-lg font-headline font-bold text-on-surface mb-1">Start from Scratch</h3>
                  <p className="text-secondary text-sm leading-snug">Build your menu manually with full control over layout and style.</p>
                  <div className="mt-5 flex items-center gap-1.5 text-primary font-bold text-xs">
                    {saving ? "Setting up…" : "Open Editor"}
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </button>
              </div>

              {/* What's included */}
              <div className="bg-on-surface rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">What&apos;s included in your trial</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "smart_toy",       label: "AI Digital Waiter"  },
                    { icon: "analytics",        label: "Live Analytics"     },
                    { icon: "restaurant_menu",  label: "Unlimited Menus"    },
                    { icon: "receipt_long",     label: "Real-time Orders"   },
                    { icon: "group",            label: "Staff Roles"        },
                    { icon: "star",             label: "AI Review Replies"  },
                    { icon: "qr_code_2",        label: "Branded QR Posters" },
                    { icon: "photo_library",    label: "Item Photo Gallery" },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-primary-container shrink-0">{icon}</span>
                      <span className="text-[11px] text-white/75 leading-snug">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { setError(null); setStep(2); }}
                className="w-full py-3 text-sm font-medium text-secondary hover:text-primary transition-colors text-center"
              >
                ← Back to previous step
              </button>

              <p className="text-center text-xs text-secondary/50">
                After 14 days: upgrade to Pro for 35,000 RWF/month or stay on Free Lite
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

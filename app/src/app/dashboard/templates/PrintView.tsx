"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TemplatePreview, type TplData, BASE_W, BASE_H } from "./TemplatePreview";
import { toast } from "sonner";
import { useMenu } from "@/context/MenuContext";

interface PrintViewProps {
  templateId: string;
  templateName: string;
  restaurantData: TplData;
  onClose: () => void;
}

const TEMPLATE_OPTIONS = [
  { id: "vintage-parchment", name: "Vintage Parchment" },
  { id: "dark-chalkboard",  name: "Dark Chalkboard"  },
  { id: "bold-street",      name: "Bold Street"       },
  { id: "bistro-split",     name: "Bistro Split"      },
  { id: "photo-gallery",    name: "Photo Gallery"     },
  { id: "luxury-gold",      name: "Luxury Gold"       },
  { id: "organic-clean",    name: "Organic Clean"     },
  { id: "midnight-luxe",    name: "Midnight Luxe"     },
];

function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);
  return w;
}

export function PrintView({ templateId, templateName, restaurantData, onClose }: PrintViewProps) {
  const { menuStyle, setMenuStyle } = useMenu();
  const [activeTemplate, setActiveTemplate]     = useState(templateId);
  const [activeTemplateName, setActiveTemplateName] = useState(templateName);
  const printRef   = useRef<HTMLDivElement>(null);
  const windowWidth = useWindowWidth();

  // Responsive preview width
  const previewW =
    windowWidth < 640  ? Math.floor(windowWidth * 0.88) :
    windowWidth < 1024 ? Math.floor(windowWidth * 0.50) :
    Math.min(520, Math.floor(windowWidth * 0.55));

  const handlePrint = useCallback(() => {
    const el = printRef.current;
    if (!el) return;

    const fontLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>("link[href*='fonts.googleapis.com']")
    ).map((l) => l.outerHTML).join("\n");

    const win = window.open("", "_blank", `width=${BASE_W + 40},height=${BASE_H + 80}`);
    if (!win) {
      toast.error("Pop-up blocked — please allow pop-ups for this site and try again.");
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  ${fontLinks}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: ${BASE_W}px ${BASE_H}px; margin: 0; }
    html, body { width: ${BASE_W}px; height: ${BASE_H}px; overflow: hidden; background: #fff; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`);
    win.document.close();

    const doPrint = () => setTimeout(() => { win.focus(); win.print(); }, 700);
    if (win.document.readyState === "complete") doPrint();
    else win.onload = doPrint;
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link copied!");
    });
  }, []);

  return (
    <>
      {/* Fullscreen overlay — col on mobile, row on desktop */}
      <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-black/70 backdrop-blur-md overflow-hidden">

        {/* ── Preview panel ── */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto">

          {/* Top bar */}
          <div className="flex items-center gap-3 p-4 md:p-6 w-full shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white shrink-0"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-base md:text-lg leading-tight truncate">{activeTemplateName}</h2>
              <p className="text-white/50 text-[11px] hidden sm:block">Live preview with your restaurant data</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Share — icon-only on mobile */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                title="Share link"
              >
                <span className="material-symbols-outlined text-base">share</span>
                <span className="hidden sm:inline">Share</span>
              </button>
              {/* Download PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-95 transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden text-[11px]">PDF</span>
              </button>
            </div>
          </div>

          {/* Template preview (scaled to viewport) */}
          <div className="shadow-2xl shadow-black/50 rounded-xl overflow-hidden shrink-0 mb-4 md:mb-8">
            <TemplatePreview
              templateId={activeTemplate}
              containerWidth={previewW}
              data={restaurantData}
              style={menuStyle}
            />
          </div>
        </div>

        {/* ── Customisation panel ── */}
        {/* Mobile: fixed-height scrollable strip at bottom. Desktop: right sidebar. */}
        <div className="w-full md:w-72 bg-surface/95 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-surface-container/50 flex flex-col overflow-y-auto max-h-[46vh] md:max-h-none md:h-auto">

          <div className="px-4 md:px-6 py-3 md:py-6 border-b border-surface-container/50 shrink-0">
            <h3 className="font-headline font-bold text-sm md:text-base mb-0.5">Customise</h3>
            <p className="text-secondary text-[11px]">Choose template &amp; accent color</p>
          </div>

          {/* Template selector */}
          <div className="px-4 md:px-6 pt-4 md:pt-6 shrink-0">
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-3" htmlFor="tpl-select">
              Template
            </label>
            <select
              id="tpl-select"
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
              value={activeTemplate}
              onChange={(e) => {
                const opt = TEMPLATE_OPTIONS.find((t) => t.id === e.target.value);
                setActiveTemplate(e.target.value);
                setActiveTemplateName(opt?.name ?? e.target.value);
              }}
              title="Select template"
              aria-label="Select template"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 md:p-6 space-y-5 md:space-y-8 flex-1">
            {/* Accent color */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-3">
                Accent Color
              </label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {["#C5A059", "#FF6B00", "#C0392B", "#1E1E1E", "#27AE60", "#2980B9"].map((hex) => {
                  const active = menuStyle.primaryColor.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setMenuStyle({ ...menuStyle, primaryColor: hex, accentColor: hex, priceTextColor: hex })}
                      style={{ backgroundColor: hex }}
                      className={`w-full aspect-square rounded-full flex items-center justify-center transition-colors ${
                        active ? "ring-4 ring-primary/20 ring-offset-2 scale-110" : "hover:scale-110"
                      }`}
                    >
                      {active && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-outline-variant/30 group-hover:border-primary/40 transition-colors shrink-0"
                     style={{ backgroundColor: menuStyle.primaryColor }}>
                  <input
                    type="color"
                    value={menuStyle.primaryColor}
                    onChange={(e) => setMenuStyle({ ...menuStyle, primaryColor: e.target.value, accentColor: e.target.value, priceTextColor: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Pick custom accent"
                  />
                </div>
                <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">Custom accent</span>
                <span className="text-[10px] font-mono text-secondary ml-auto">{menuStyle.primaryColor}</span>
              </label>
            </div>

            {/* Print tips — hidden on mobile to save space */}
            <div className="hidden md:block bg-surface-container-low rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Print Tips</p>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">tips_and_updates</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">Enable &quot;Background graphics&quot; in print settings for best results.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">picture_as_pdf</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">Choose &quot;Save as PDF&quot; as destination to get a digital file.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">open_in_new</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">A new window opens — allow pop-ups if blocked.</p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="p-4 md:p-6 border-t border-surface-container/50 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 md:py-4 bg-linear-to-br from-primary to-primary-container rounded-2xl font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              Print Now
            </button>
            <p className="text-center text-[10px] text-secondary mt-2">Opens a clean print window</p>
          </div>
        </div>
      </div>

      {/* Off-screen 1:1 render — source for the print window */}
      <div
        aria-hidden="true"
        className="fixed pointer-events-none z-[-1]"
        style={{ left: "-200vw", top: 0, width: BASE_W, height: BASE_H, overflow: "hidden" }}
      >
        <div ref={printRef} style={{ width: BASE_W, height: BASE_H }}>
          <TemplatePreview
            templateId={activeTemplate}
            containerWidth={BASE_W}
            data={restaurantData}
            style={menuStyle}
          />
        </div>
      </div>
    </>
  );
}

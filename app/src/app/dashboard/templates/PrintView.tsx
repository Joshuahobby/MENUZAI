"use client";

import { useCallback, useRef, useState } from "react";
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
  { id: "dark-chalkboard", name: "Dark Chalkboard" },
  { id: "bold-street", name: "Bold Street" },
  { id: "bistro-split", name: "Bistro Split" },
  { id: "photo-gallery", name: "Photo Gallery" },
  { id: "luxury-gold", name: "Luxury Gold" },
];

export function PrintView({ templateId, templateName, restaurantData, onClose }: PrintViewProps) {
  const { menuStyle, setMenuStyle } = useMenu();
  const [activeTemplate, setActiveTemplate] = useState(templateId);
  const [activeTemplateName, setActiveTemplateName] = useState(templateName);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const el = printRef.current;
    if (!el) return;

    // Collect Google Font <link> tags loaded by TemplatePreview
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

    // Auto-print after fonts have a moment to load
    const doPrint = () => setTimeout(() => { win.focus(); win.print(); }, 700);
    if (win.document.readyState === "complete") {
      doPrint();
    } else {
      win.onload = doPrint;
    }
  }, [restaurantData.restaurantName]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link copied to clipboard!");
    });
  }, []);

  return (
    <>
      {/* Fullscreen overlay */}
      <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-md">

        {/* Left: Preview panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
          {/* Top controls */}
          <div className="flex items-center gap-4 mb-6 w-full max-w-2xl">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{activeTemplateName}</h2>
              <p className="text-white/50 text-xs">Live preview with your restaurant data</p>
            </div>
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all"
              >
                <span className="material-symbols-outlined text-base">share</span>
                Share
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-95 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                Download PDF
              </button>
            </div>
          </div>

          {/* Template preview — A4 portrait (screen) */}
          <div
            className="shadow-2xl shadow-black/50 rounded-xl overflow-hidden flex-shrink-0"
            style={{ maxHeight: "calc(100vh - 180px)", aspectRatio: `${BASE_W} / ${BASE_H}` }}
          >
            <div className="w-full h-full">
              <TemplatePreview
                templateId={activeTemplate}
                containerWidth={Math.min(520, typeof window !== "undefined" ? window.innerWidth * 0.55 : 520)}
                data={restaurantData}
                style={menuStyle}
              />
            </div>
          </div>
        </div>

        {/* Right: Customisation panel */}
        <div className="w-72 bg-surface/95 backdrop-blur-2xl border-l border-surface-container/50 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-surface-container/50">
            <h3 className="font-[var(--font-headline)] font-bold text-base mb-1">Customise</h3>
            <p className="text-secondary text-xs">Choose template &amp; adjust colors</p>
          </div>

          {/* Template selector */}
          <div className="px-6 pt-6">
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-3" htmlFor="tpl-select">Template</label>
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

          <div className="p-6 space-y-8 flex-1">
            {/* Accent color */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Accent Color</label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {[
                  "#C5A059", "#FF6B00", "#C0392B", "#1E1E1E", "#27AE60", "#2980B9"
                ].map((hex) => {
                  const isActive = menuStyle.primaryColor.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setMenuStyle({ ...menuStyle, primaryColor: hex, accentColor: hex, priceTextColor: hex })}
                      className={`w-full aspect-square rounded-full flex items-center justify-center transition-all ${isActive ? "ring-4 ring-primary/20 ring-offset-2 scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: hex }}
                    >
                      {isActive && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-outline-variant/30 group-hover:border-primary/40 transition-all shrink-0">
                  <div className="absolute inset-0" style={{ backgroundColor: menuStyle.primaryColor }} />
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

            {/* Tips */}
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
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
          <div className="p-6 border-t border-surface-container/50">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-4 bg-gradient-to-br from-primary to-primary-container rounded-2xl font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              Print Now
            </button>
            <p className="text-center text-[10px] text-secondary mt-3">Opens a clean print window</p>
          </div>
        </div>
      </div>

      {/* Hidden off-screen render at 1:1 scale — source for the print window */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", left: "-200vw", top: 0, width: BASE_W, height: BASE_H, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}
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

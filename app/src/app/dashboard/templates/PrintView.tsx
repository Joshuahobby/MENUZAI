"use client";

import { useState, useCallback } from "react";
import { TemplatePreview, type TplData, BASE_W } from "./TemplatePreview";
import { toast } from "sonner";

interface PrintViewProps {
  templateId: string;
  templateName: string;
  restaurantData: TplData;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: "Amber", hex: "#C5A059" },
  { name: "Orange", hex: "#FF6B00" },
  { name: "Crimson", hex: "#C0392B" },
  { name: "Ink", hex: "#1E1E1E" },
  { name: "Forest", hex: "#27AE60" },
  { name: "Ocean", hex: "#2980B9" },
];

export function PrintView({ templateId, templateName, restaurantData, onClose }: PrintViewProps) {
  const [primaryColor, setPrimaryColor] = useState("#C5A059");
  const [bgColor] = useState("");

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link copied to clipboard!");
    });
  }, []);

  return (
    <>
      {/* Print CSS — hides everything but the printable canvas */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-canvas { display: block !important; position: fixed !important; inset: 0 !important; z-index: 99999 !important; }
          #print-canvas > div { transform: none !important; width: 100% !important; height: 100% !important; }
        }
      `}</style>

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
              <h2 className="text-white font-bold text-lg leading-tight">{templateName}</h2>
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
                <span className="material-symbols-outlined text-base">print</span>
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Template preview — A4 portrait */}
          <div
            id="print-canvas"
            className="shadow-2xl shadow-black/50 rounded-xl overflow-hidden flex-shrink-0"
            style={{ maxHeight: "calc(100vh - 180px)", aspectRatio: `${BASE_W} / 990` }}
          >
            <div className="w-full h-full">
              <TemplatePreview
                templateId={templateId}
                containerWidth={Math.min(520, typeof window !== "undefined" ? window.innerWidth * 0.55 : 520)}
                data={restaurantData}
                primaryColor={primaryColor || undefined}
                backgroundColor={bgColor || undefined}
              />
            </div>
          </div>
        </div>

        {/* Right: Customisation panel */}
        <div className="w-72 bg-surface/95 backdrop-blur-2xl border-l border-surface-container/50 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-surface-container/50">
            <h3 className="font-[var(--font-headline)] font-bold text-base mb-1">Customise</h3>
            <p className="text-secondary text-xs">Adjust colors before printing</p>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Accent color */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Accent Color</label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {PRESET_COLORS.map((color) => {
                  const isActive = primaryColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setPrimaryColor(color.hex)}
                      className={`w-full aspect-square rounded-full flex items-center justify-center transition-all ${isActive ? "ring-4 ring-primary/20 ring-offset-2 scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {isActive && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-outline-variant/30 group-hover:border-primary/40 transition-all shrink-0">
                  <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Pick custom accent"
                  />
                </div>
                <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">Custom accent</span>
                <span className="text-[10px] font-mono text-secondary ml-auto">{primaryColor}</span>
              </label>
            </div>

            {/* Tips */}
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Print Tips</p>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">tips_and_updates</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">Set your browser to &quot;Background graphics: enabled&quot; for best results.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">picture_as_pdf</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">Choose &quot;Save as PDF&quot; as destination to get a digital file.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">straighten</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">For physical printing, use A4 or US Letter paper at 100% scale.</p>
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
            <p className="text-center text-[10px] text-secondary mt-3">Opens browser print dialog</p>
          </div>
        </div>
      </div>
    </>
  );
}

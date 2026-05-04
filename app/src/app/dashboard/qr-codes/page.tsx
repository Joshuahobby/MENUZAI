"use client";

import { useState, useRef, useEffect } from "react";
import { useMenu } from "@/context/MenuContext";
import { QRPosterRenderer } from "./QRPosterRenderer";
import type { QRPosterData, QRTemplate } from "@/types/menu";
import { toast } from "sonner";
import { toPng } from "html-to-image";

const TEMPLATES: QRTemplate[] = [
  { id: "classic-frame", name: "Classic Poster", thumbnail: "", layout: "portrait" },
  { id: "dark-premium", name: "Dark Premium", thumbnail: "", layout: "portrait" },
  { id: "elegant-minimal", name: "Elegant Minimal", thumbnail: "", layout: "portrait" },
];

const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800",
];

export default function QRCodesPage() {
  const { menuSlug, menuStatus, menuStyle, restaurantName } = useMenu();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://menuzai.com";
  
  const [tableNumber, setTableNumber] = useState("");
  const menuUrl = menuSlug && menuStatus === "published" 
    ? `${baseUrl}/menu/${menuSlug}${tableNumber ? `?table=${encodeURIComponent(tableNumber)}` : ''}?src=qr` 
    : "";

  const [posterData, setPosterData] = useState<QRPosterData>({
    templateId: "classic-frame",
    headline: "Scan to View Our Menu",
    subheadline: "Healthy & Delicious Food Delivered to Your Table",
    footer: "Thank you for visiting us! We hope you enjoy your meal.",
    backgroundImage: PRESET_IMAGES[0],
    primaryColor: menuStyle.primaryColor || "#FF6B00",
    textColor: "#1A1009",
    qrColor: "#000000",
  });

  const posterRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const downloadPoster = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, { 
        quality: 1.0,
        pixelRatio: 2, // High resolution for print
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${restaurantName || 'menu'}-qr-poster.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Poster exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export poster. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12 h-screen flex flex-col overflow-hidden">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Printable QR Designs</h1>
          <p className="text-secondary">Create and customize ready-to-print menu posters</p>
        </div>
        {!menuUrl && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-2 text-amber-700 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">warning</span>
            Publish menu first to link QR code
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-12 overflow-hidden">
        {/* Left: Customization Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 overflow-y-auto pr-4 hide-scrollbar">
          
          <section className="bg-surface-container-lowest p-6 rounded-[2rem] border border-surface-container/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary mb-4">Choose Template</h3>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPosterData({ ...posterData, templateId: t.id })}
                  className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${posterData.templateId === t.id ? "bg-primary/5 ring-2 ring-primary" : "bg-surface-container-low hover:bg-surface-container-high"}`}
                >
                  <div className={`w-full aspect-[1/1.4] rounded-lg border border-outline-variant/20 flex items-center justify-center ${t.id === 'classic-frame' ? 'bg-white' : t.id === 'dark-premium' ? 'bg-black' : 'bg-surface-container'}`}>
                    <span className="material-symbols-outlined opacity-30">description</span>
                  </div>
                  <span className="text-[10px] font-bold truncate w-full text-center">{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest p-6 rounded-[2rem] border border-surface-container/50 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Content</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 block">Headline</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                  value={posterData.headline}
                  onChange={(e) => setPosterData({ ...posterData, headline: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 block">Sub-headline</label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                  value={posterData.subheadline}
                  onChange={(e) => setPosterData({ ...posterData, subheadline: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 block">Footer / Address</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                  value={posterData.footer}
                  onChange={(e) => setPosterData({ ...posterData, footer: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 block">Table Number (URL Param)</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 05"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-6 rounded-[2rem] border border-surface-container/50 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Style</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 block">Brand Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded-full border-none p-0 overflow-hidden cursor-pointer"
                    value={posterData.primaryColor}
                    onChange={(e) => setPosterData({ ...posterData, primaryColor: e.target.value })}
                  />
                  <span className="text-xs font-mono font-bold self-center">{posterData.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 block">QR Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded-full border-none p-0 overflow-hidden cursor-pointer"
                    value={posterData.qrColor}
                    onChange={(e) => setPosterData({ ...posterData, qrColor: e.target.value })}
                  />
                  <span className="text-xs font-mono font-bold self-center">{posterData.qrColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3 block">Background Image</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setPosterData({ ...posterData, backgroundImage: img })}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${posterData.backgroundImage === img ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={img} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
                <button className="aspect-square rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center text-secondary hover:text-primary hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Preview & Actions */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center bg-surface-container/30 rounded-[3rem] p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-8 left-8 flex items-center gap-4">
             <span className="px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Preview</span>
          </div>
          
          <div className="w-full h-full flex flex-col items-center justify-center gap-8">
            <div className="w-full max-w-[400px] transform scale-90 lg:scale-100 transition-transform origin-center">
              <QRPosterRenderer
                id="printable-poster"
                data={posterData}
                url={menuUrl || "https://menuzai.com"}
              />
              {/* Hidden copy for high-res export */}
              <div className="fixed -left-[10000px] top-0">
                 <div ref={posterRef} className="w-[800px] h-[1131px]">
                   <QRPosterRenderer
                    data={posterData}
                    url={menuUrl || "https://menuzai.com"}
                    className="!shadow-none !rounded-none"
                  />
                 </div>
              </div>
            </div>

            <div className="flex gap-4 w-full max-w-sm shrink-0">
              <button
                onClick={downloadPoster}
                disabled={isExporting}
                className="flex-1 py-4 bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-black/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">download</span>
                )}
                <span>Download PNG</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-sm shadow-xl shadow-black/5 hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-2 border border-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print Poster</span>
              </button>
            </div>
            
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] opacity-50">Recommended: A4 or A5 Portrait</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-poster, #printable-poster * { visibility: visible; }
          #printable-poster {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            border: none;
            box-shadow: none;
            border-radius: 0;
            transform: none !important;
          }
        }
      `}} />
    </div>
  );
}

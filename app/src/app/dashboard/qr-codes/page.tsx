"use client";

import { useState, useRef, useEffect } from "react";
import { useMenu } from "@/context/MenuContext";
import { QRPosterRenderer } from "./QRPosterRenderer";
import type { QRPosterData, QRTemplate } from "@/types/menu";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

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
    logoUrl: menuStyle.logoUrl || "",
    primaryColor: menuStyle.primaryColor || "#FF6B00",
    textColor: "#1A1009",
    qrColor: "#000000",
  });

  // Update poster data when menu style changes
  useEffect(() => {
    setPosterData(prev => ({
      ...prev,
      logoUrl: menuStyle.logoUrl || "",
      primaryColor: menuStyle.primaryColor || "#FF6B00",
    }));
  }, [menuStyle.logoUrl, menuStyle.primaryColor]);

  const posterRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterData({ ...posterData, backgroundImage: reader.result as string });
        toast.success("Custom image uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPDF = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, { 
        quality: 1.0,
        pixelRatio: 3, // Very high res for PDF
        cacheBust: true,
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
      pdf.save(`${restaurantName || 'menu'}-qr-poster.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

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
    <div className="h-screen flex flex-col bg-[#FDFCFB] overflow-hidden">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[#F0EBE8] bg-white/80 backdrop-blur-md flex justify-between items-center shrink-0 z-20">
        <div>
          <h1 className="text-xl font-[var(--font-headline)] font-black tracking-tight text-[#1A1009]">QR Design Studio</h1>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] opacity-60">Create & Print Professional Menu Posters</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!menuUrl && (
            <div className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-amber-700 text-[10px] font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">warning</span>
              Menu Unscheduled
            </div>
          )}
          <button
            onClick={downloadPoster}
            disabled={isExporting}
            className="px-6 py-2.5 bg-white text-[#1A1009] border border-[#F0EBE8] rounded-full font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-surface-container/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">image</span>
            PNG
          </button>
          <button
            onClick={downloadPDF}
            disabled={isExporting}
            className="px-6 py-2.5 bg-[#1A1009] text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            )}
            Download PDF
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar: Controls */}
        <aside className="w-[320px] border-r border-[#F0EBE8] bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-10 hide-scrollbar">
            
            {/* Template Selection */}
            <section>
              <div className="mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1009]">Layout</h3>
              </div>
              <div className="flex gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPosterData({ ...posterData, templateId: t.id })}
                    className={`group relative flex-1 aspect-square rounded-2xl transition-all border-2 flex flex-col items-center justify-center p-2 ${
                      posterData.templateId === t.id 
                        ? "bg-[#1A1009]/5 border-[#1A1009]" 
                        : "bg-transparent border-transparent hover:bg-surface-container/20"
                    }`}
                  >
                    <div className={`w-full flex-1 rounded-lg border overflow-hidden transition-transform group-hover:scale-105 mb-1 ${
                      t.id === 'classic-frame' ? 'bg-white border-primary/20' : 
                      t.id === 'dark-premium' ? 'bg-black border-white/10' : 
                      'bg-surface-container-low border-outline-variant/20'
                    }`}>
                      {/* Abstract Icon for Template */}
                      {t.id === 'classic-frame' && (
                        <div className="w-full h-full flex flex-col">
                           <div className="h-2/5 bg-primary/20" />
                           <div className="flex-1 p-1 space-y-0.5">
                              <div className="h-0.5 w-full bg-black/10 rounded-full" />
                              <div className="h-2 w-2 bg-black/5 mx-auto rounded-full" />
                           </div>
                        </div>
                      )}
                      {t.id === 'dark-premium' && (
                        <div className="w-full h-full bg-black flex flex-col items-center justify-center p-1 space-y-1">
                           <div className="h-0.5 w-2/3 bg-white/20 rounded-full" />
                           <div className="h-3 w-3 border border-white/20 rounded-sm" />
                        </div>
                      )}
                      {t.id === 'elegant-minimal' && (
                        <div className="w-full h-full bg-white flex flex-col items-center justify-center p-1 space-y-1">
                           <div className="h-3 w-3 border-2 border-primary/20 rounded-lg" />
                           <div className="h-0.5 w-1/2 bg-black/10 rounded-full" />
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[7px] font-black uppercase tracking-widest ${posterData.templateId === t.id ? 'text-[#1A1009]' : 'text-secondary opacity-60'}`}>
                      {t.name.split(' ')[0]}
                    </span>

                    {posterData.templateId === t.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#1A1009] rounded-full flex items-center justify-center border-2 border-white">
                        <span className="material-symbols-outlined text-[10px] text-white">check</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Content Customization */}
            <section className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1009]">Customize Content</h3>
              
              <div className="space-y-5">
                <div className="group">
                  <label className="text-[9px] font-black text-secondary uppercase tracking-widest mb-2 block group-focus-within:text-primary transition-colors">Headline Text</label>
                  <input
                    className="w-full bg-surface-container/50 border-none rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all placeholder:opacity-30"
                    value={posterData.headline}
                    onChange={(e) => setPosterData({ ...posterData, headline: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-black text-secondary uppercase tracking-widest mb-2 block">Sub-headline</label>
                  <textarea
                    className="w-full bg-surface-container/50 border-none rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 h-16 resize-none transition-all"
                    value={posterData.subheadline}
                    onChange={(e) => setPosterData({ ...posterData, subheadline: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-secondary uppercase tracking-widest mb-2 block">Footer Message</label>
                  <textarea
                    className="w-full bg-surface-container/50 border-none rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 h-16 resize-none transition-all"
                    placeholder="e.g. Thank you for visiting!"
                    value={posterData.footer}
                    onChange={(e) => setPosterData({ ...posterData, footer: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-secondary uppercase tracking-widest mb-2 block">Table #</label>
                    <input
                      className="w-full bg-surface-container/50 border-none rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="e.g. 05"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-secondary uppercase tracking-widest mb-2 block text-right">Preview Size</label>
                    <div className="flex items-center justify-end h-10 gap-2">
                       <span className="text-[10px] font-black opacity-40">A5</span>
                       <div className="w-12 h-6 bg-surface-container rounded-full p-1 relative cursor-not-allowed">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full shadow-sm" />
                       </div>
                       <span className="text-[10px] font-black">A4</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Visual Branding */}
            <section className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1009]">Visual Branding</h3>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {["#FF6B00", "#1A1009", "#D4AF37", "#004d40", "#b71c1c"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setPosterData({ ...posterData, primaryColor: color })}
                      className={`w-6 h-6 rounded-full border-2 ${posterData.primaryColor === color ? 'border-primary' : 'border-white'} shadow-sm transition-transform hover:scale-110`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <div className="flex items-center justify-between p-4 bg-surface-container/30 rounded-3xl border border-surface-container/50">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#1A1009]">Custom Theme</p>
                    <p className="text-[9px] font-bold text-secondary opacity-60">Accent & QR Colors</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm p-0 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                      value={posterData.primaryColor}
                      onChange={(e) => setPosterData({ ...posterData, primaryColor: e.target.value })}
                    />
                    <input
                      type="color"
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm p-0 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                      value={posterData.qrColor}
                      onChange={(e) => setPosterData({ ...posterData, qrColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-secondary uppercase tracking-widest mb-3 block">Background Mood</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setPosterData({ ...posterData, backgroundImage: img })}
                      className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                        posterData.backgroundImage === img ? "border-primary scale-105 shadow-lg shadow-primary/10" : "border-transparent grayscale opacity-40 hover:opacity-100 hover:grayscale-0"
                      }`}
                    >
                      <img src={img} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-secondary hover:text-primary hover:border-primary transition-all gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span className="text-[8px] font-black uppercase">Upload</span>
                    <input 
                      id="image-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-[#F0EBE8] bg-surface-container-lowest/50 shrink-0">
             <button
              onClick={() => window.print()}
              className="w-full py-3.5 bg-white text-black border border-surface-container rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/5 hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print Poster
            </button>
          </div>
        </aside>

        {/* Right: Canvas Area */}
        <main className="flex-1 bg-[#FDFCFB] relative overflow-hidden flex flex-col">


          {/* Canvas Context */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12 perspective-1000 overflow-hidden">
            {/* The Poster Mockup */}
            <div className="relative group transition-all duration-700 hover:rotate-y-2 hover:scale-[1.01] h-full flex items-center justify-center">

              
              <div className="h-full max-h-[80vh] aspect-[1/1.414] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.12)] rounded-[1.5rem] relative border border-white/50 flex flex-col">
                <QRPosterRenderer
                  id="printable-poster"
                  data={posterData}
                  url={menuUrl || "https://menuzai.com"}
                  className="flex-1"
                />
              </div>


            </div>

            {/* Hidden copy for high-res export */}
            <div className="fixed -left-[10000px] top-0 pointer-events-none">
                <div ref={posterRef} className="w-[800px] h-[1131px]">
                  <QRPosterRenderer
                  data={posterData}
                  url={menuUrl || "https://menuzai.com"}
                  className="!shadow-none !rounded-none"
                />
                </div>
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-2 { transform: rotateY(2deg); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media print {
          /* Hide everything first */
          header, aside, main > div:not(.perspective-1000), .absolute, button, nav, .bottom-nav { 
            display: none !important; 
          }
          
          /* Ensure parent containers don't clip or have background */
          html, body, #__next, .h-screen, .flex-1, main { 
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Reset layout styles */
          .flex, .grid { display: block !important; }

          .perspective-1000 {
            perspective: none !important;
            padding: 0 !important;
            display: block !important;
          }

          .relative.group {
            transform: none !important;
            display: block !important;
          }

          #printable-poster {
            position: relative !important;
            width: 210mm !important; /* A4 Width */
            height: 297mm !important; /* A4 Height */
            left: 0 !important;
            top: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            transform: none !important;
            page-break-after: always !important;
          }

          /* Hide mockup elements */
          .bg-surface-container-highest\/30, .shadow-\[0_40px_100px_rgba\(0\,0\,0\,0\.12\)\], .rounded-\[1\.5rem\], .border-white\/50 {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}

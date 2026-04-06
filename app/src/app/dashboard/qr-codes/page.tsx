"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useMenu } from "@/context/MenuContext";

export default function QRCodesPage() {
  const { menuSlug, menuStatus } = useMenu();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://menuzai.com";
  const [tableNumber, setTableNumber] = useState("");
  const menuUrl = menuSlug && menuStatus === "published" 
    ? `${baseUrl}/menu/${menuSlug}${tableNumber ? `?table=${encodeURIComponent(tableNumber)}` : ''}` 
    : "";
    
  const [qrColor, setQrColor] = useState("#FF6B00");
  const [bgColor] = useState("#ffffff");
  const [showTableNum, setShowTableNum] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadPNG = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      // Create a canvas large enough for the QR code and text
      canvas.width = img.width + 40;
      canvas.height = img.height + (showTableNum && tableNumber ? 80 : 40);
      
      if (!ctx) return;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);

      // Add text if needed
      if (showTableNum && tableNumber) {
        ctx.fillStyle = qrColor;
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Table ${tableNumber}`, canvas.width / 2, canvas.height - 20);
      }

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `menu-qr${tableNumber ? `-table-${tableNumber}` : ""}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">QR Code Generator</h1>
        <p className="text-secondary">Generate a branded QR code for your digital menu</p>
      </div>

      {!menuUrl && (
        <div className="mb-8 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <span className="material-symbols-outlined text-primary text-3xl mb-2 block">info</span>
          <p className="font-bold text-sm">Publish your menu first to generate a QR code.</p>
          <p className="text-secondary text-xs mt-1">Go to the Menu Editor and click &quot;Publish Menu&quot;.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* QR Preview */}
        <div className="flex flex-col items-center">
          <div ref={qrRef} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-lg border border-surface-container/50 mb-8 flex flex-col items-center">
            <QRCodeSVG
              id="qr-code-svg"
              value={menuUrl || "https://menuzai.com"}
              size={280}
              fgColor={qrColor}
              bgColor={bgColor}
              level="H"
              includeMargin={true}
            />
            {showTableNum && tableNumber && (
              <p className="mt-4 text-2xl font-bold font-[var(--font-headline)] tracking-tight" style={{ color: qrColor }}>
                Table {tableNumber}
              </p>
            )}
            {showTableNum && !tableNumber && (
              <p className="mt-4 text-xl font-bold font-[var(--font-headline)] tracking-tight" style={{ color: qrColor }}>
                Scan to Order
              </p>
            )}
          </div>
          <p className="text-sm text-secondary text-center mb-6">
            &quot;Print this and place it on your tables&quot;
          </p>
          <div className="flex gap-4 w-full max-w-sm">
            <button onClick={downloadPNG} disabled={!menuUrl} className="flex-1 py-4 bg-gradient-to-br from-primary to-primary-container rounded-2xl font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none">
              <span className="material-symbols-outlined text-sm">download</span> Download PNG
            </button>
            <button onClick={() => window.print()} disabled={!menuUrl} className="flex-1 py-4 bg-surface-container-highest rounded-2xl font-bold text-on-surface hover:bg-surface-variant transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none">
              <span className="material-symbols-outlined text-sm">print</span> Print
            </button>
          </div>
        </div>

        {/* Customization */}
        <div className="space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-container/50">
            <h3 className="font-[var(--font-headline)] font-bold text-lg mb-6">Customization</h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">QR Code Color</label>
                <div className="grid grid-cols-4 gap-3">
                {["#FF6B00", "#1B5E20", "#0D47A1", "#3E2723"].map((color) => {
                  const colorClasses: Record<string, string> = {
                    "#FF6B00": "bg-[#FF6B00]",
                    "#1B5E20": "bg-[#1B5E20]",
                    "#0D47A1": "bg-[#0D47A1]",
                    "#3E2723": "bg-[#3E2723]",
                  };
                  return (
                    <button key={color} onClick={() => setQrColor(color)}
                      className={`aspect-square rounded-full border-4 transition-all ${colorClasses[color]} ${qrColor === color ? "border-primary-container scale-110" : "border-transparent hover:scale-105"}`}
                      title={`Select QR Color ${color}`}
                      aria-label={`Select QR Color ${color}`} />
                  );
                })}
              </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">Table Number (Optional)</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 12" 
                  value={tableNumber} 
                  onChange={(e) => setTableNumber(e.target.value)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Show Text Label</p>
                  <p className="text-xs text-secondary mt-0.5">Display table number below QR code</p>
                </div>
                <button
                  onClick={() => setShowTableNum(!showTableNum)}
                  className={`w-12 h-7 rounded-full transition-all relative ${showTableNum ? "bg-primary" : "bg-surface-container-highest"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${showTableNum ? "right-1" : "left-1"}`} />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">Menu URL</label>
                <div className="flex items-center gap-2 bg-surface-container-low rounded-xl p-3">
                  <span className="material-symbols-outlined text-secondary text-sm">link</span>
                  <input className="w-full bg-surface-container-low border-none py-1 px-2 text-sm focus:outline-none"
                placeholder="Publish menu first" value={menuUrl} readOnly 
                title="QR Code Link" aria-label="QR Code Link" />
                  <button onClick={() => navigator.clipboard.writeText(menuUrl)} className="text-primary text-xs font-bold hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors border-none cursor-pointer">Copy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #qr-code-svg, #qr-code-svg * { visibility: visible; }
          .font-\\[var\\(--font-headline\\)\\] { visibility: visible; }
          .bg-surface-container-lowest.p-8 {
            visibility: visible;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border: none;
            box-shadow: none;
          }
        }
      `}} />
    </div>
  );
}

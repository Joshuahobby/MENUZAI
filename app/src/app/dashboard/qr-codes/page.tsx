"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodesPage() {
  const [menuUrl] = useState("https://menuza.ai/menu/le-bistro");
  const [qrColor, setQrColor] = useState("#FF6B00");
  const [bgColor] = useState("#ffffff");

  const downloadPNG = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "menuzai-qr.png";
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* QR Preview */}
        <div className="flex flex-col items-center">
          <div className="bg-surface-container-lowest p-12 rounded-[2rem] shadow-lg border border-surface-container/50 mb-8">
            <QRCodeSVG
              id="qr-code-svg"
              value={menuUrl}
              size={280}
              fgColor={qrColor}
              bgColor={bgColor}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-secondary text-center mb-6">
            &quot;Print this and place it on your tables&quot;
          </p>
          <div className="flex gap-4 w-full max-w-sm">
            <button onClick={downloadPNG} className="flex-1 py-4 bg-gradient-to-br from-primary to-primary-container rounded-2xl font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">download</span> Download PNG
            </button>
            <button className="flex-1 py-4 bg-surface-container-highest rounded-2xl font-bold text-on-surface hover:bg-surface-variant transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Download PDF
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
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">Menu URL</label>
                <div className="flex items-center gap-2 bg-surface-container-low rounded-xl p-3">
                  <span className="material-symbols-outlined text-secondary text-sm">link</span>
                  <input className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                placeholder="https://menuzai.com/menu/the-bistro" value={menuUrl} readOnly 
                title="QR Code Link" aria-label="QR Code Link" />
                  <button className="text-primary text-xs font-bold hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors">Copy</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">Logo (Optional)</label>
                <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <span className="material-symbols-outlined text-primary text-2xl mb-2 block">add_photo_alternate</span>
                  <p className="text-sm text-secondary">Upload your logo to embed in QR</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

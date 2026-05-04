"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import type { QRPosterData } from "@/types/menu";

interface QRPosterRendererProps {
  data: QRPosterData;
  url: string;
  className?: string;
  id?: string;
}

export function QRPosterRenderer({ data, url, className = "", id }: QRPosterRendererProps) {
  const {
    templateId,
    headline,
    subheadline,
    footer,
    backgroundImage,
    logoUrl,
    primaryColor,
    textColor,
    qrColor,
  } = data;

  const renderTemplate = () => {
    switch (templateId) {
      case "classic-frame":
        return (
          <div className="w-full h-full bg-white flex flex-col relative" style={{ color: textColor }}>
            {/* Food Image with Curved Bottom */}
            <div className="h-[35%] w-full relative overflow-hidden shrink-0">
              {backgroundImage ? (
                <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-5xl">restaurant</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/10" />
              {/* Curved SVG Divider */}
              <div className="absolute -bottom-1 left-0 w-full text-white">
                <svg viewBox="0 0 1440 320" className="w-full fill-current">
                  <path d="M0,192L80,202.7C160,213,320,235,480,218.7C640,203,800,149,960,138.7C1120,128,1280,160,1360,176L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
                </svg>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-between p-6 lg:p-8 text-center relative z-10 bg-white">
              <div className="relative w-full">
                {/* Logo in Circle */}
                {logoUrl ? (
                  <div className="w-24 h-24 bg-white rounded-full p-2 shadow-2xl absolute -top-24 left-1/2 -translate-x-1/2 border-4 border-white overflow-hidden z-20">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                   <div className="w-24 h-24 bg-white rounded-full p-4 shadow-2xl absolute -top-24 left-1/2 -translate-x-1/2 border-4 border-white flex items-center justify-center z-20">
                    <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
                  </div>
                )}
                
                <div className="mt-1 space-y-1">
                  <h2 className="text-xl lg:text-xl font-[var(--font-headline)] font-black uppercase tracking-tight leading-none" style={{ color: primaryColor }}>
                    {headline}
                  </h2>
                  <div className="h-0.5 w-10 bg-primary/20 mx-auto rounded-full" />
                  <p className="text-[9px] lg:text-[10px] font-bold opacity-80 max-w-[85%] mx-auto leading-tight">{subheadline}</p>
                </div>
              </div>

              <div className="relative p-4 bg-white rounded-[2rem] shadow-2xl shadow-black/5 border border-surface-container/50">
                {/* Decorative Sparkles */}
                <span className="material-symbols-outlined absolute -top-4 -left-4 text-primary opacity-30 text-xl">star_rate</span>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-primary opacity-30 text-xl">star_rate</span>
                
                <QRCodeSVG
                  value={url}
                  size={140}
                  fgColor={qrColor}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {footer && (
                <div className="space-y-0.5">
                  <div className="h-[1px] w-6 bg-outline-variant/30 mx-auto mb-2" />
                  <p className="text-[9px] font-bold opacity-60 tracking-wider leading-tight px-4">
                    {footer}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "dark-premium":
        return (
          <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-between p-8 text-center bg-black">
            {backgroundImage && (
              <>
                <img src={backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
              </>
            )}
            
            <div className="relative z-10 flex flex-col items-center gap-6 w-full">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] w-6 bg-white/30" />
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">Restaurant</span>
                  <div className="h-[1px] w-6 bg-white/30" />
                </div>
                <h2 className="text-3xl font-[var(--font-headline)] font-black text-white uppercase tracking-tighter leading-none">
                  {headline}
                </h2>
                <p className="text-[11px] font-bold text-white/80 tracking-wide">{subheadline}</p>
              </div>

              <div className="relative group">
                {/* Dynamic corner brackets */}
                <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl opacity-80" />
                <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl opacity-80" />
                <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl opacity-80" />
                <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl opacity-80" />
                
                <div className="p-5 bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_0_80px_rgba(255,255,255,0.15)]">
                  <QRCodeSVG
                    value={url}
                    size={150}
                    fgColor={qrColor}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="mt-3 py-1.5 px-5 bg-black rounded-full shadow-lg shadow-black/20 group-hover:scale-105 transition-transform">
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Scan Now</span>
                  </div>
                </div>
              </div>

              {footer && (
                <div className="mt-2">
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest max-w-[80%] mx-auto leading-tight">
                    {footer}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "elegant-minimal":
        return (
          <div className="w-full h-full bg-surface-container-lowest flex flex-col items-center justify-center p-12 relative overflow-hidden" style={{ color: textColor }}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-container" />
            
            <div className="flex flex-col items-center gap-8 w-full">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-[1px] bg-outline-variant" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary">Welcome</span>
                  <div className="w-8 h-[1px] bg-outline-variant" />
                </div>
                <h2 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight mb-2">
                  {headline}
                </h2>
                <p className="text-xs font-medium text-secondary">{subheadline}</p>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl" />
                <div className="relative bg-white p-8 rounded-[3rem] shadow-xl border border-surface-container/50">
                  <QRCodeSVG
                    value={url}
                    size={160}
                    fgColor={qrColor}
                    level="H"
                    includeMargin={false}
                  />
                  {/* Corner marks style */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs font-black mb-3" style={{ color: primaryColor }}>SCAN TO VIEW</p>
                {footer && (
                  <p className="text-[9px] font-medium opacity-60 leading-tight px-6">
                    {footer}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a template</div>;
    }
  };

  return (
    <div id={id} className={`aspect-[1/1.414] shadow-2xl rounded-3xl overflow-hidden bg-white ${className}`}>
      {renderTemplate()}
    </div>
  );
}

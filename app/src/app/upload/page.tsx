"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import type { MenuItem, MenuStyle } from "@/types/menu";

type UploadState = "idle" | "uploading" | "extracting" | "done" | "error";

export default function UploadPage() {
  const { setMenuItems, setCategories, setRestaurantName, applyTemplate } = useMenu();
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [extractedCount, setExtractedCount] = useState({ items: 0, categories: 0 });
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File too large. Maximum size is 10MB.");
      setState("error");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Unsupported file type. Use JPG, PNG, WebP, GIF, or PDF.");
      setState("error");
      return;
    }

    setState("uploading");
    setProgress(20);

    const formData = new FormData();
    formData.append("file", file);

    setProgress(40);
    setState("extracting");

    try {
      const res = await fetch("/api/extract-menu", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Extraction failed");
      }

      const result = await res.json();

      setRestaurantName(result.restaurantName);
      setCategories(result.categories);
      setMenuItems(result.items as MenuItem[]);
      setExtractedCount({ items: result.items.length, categories: result.categories.length });

      if (result.suggestedTheme) {
        const styleMap: Record<string, Partial<MenuStyle>> = {
          "Classic Elegance": { primaryColor: "#1E1E1E", secondaryColor: "#FFFFFF", headlineFont: "Playfair Display", bodyFont: "Inter", borderRadius: "0.5rem" },
          "Modern Minimal": { primaryColor: "#1E1E1E", secondaryColor: "#FFFFFF", headlineFont: "Plus Jakarta Sans", bodyFont: "Inter", borderRadius: "0.5rem" },
          "Luxury Gold": { primaryColor: "#C5A059", secondaryColor: "#1E1E1E", headlineFont: "Playfair Display", bodyFont: "Inter", borderRadius: "2rem" },
          "Street Food": { primaryColor: "#FF6B00", secondaryColor: "#1E1E1E", headlineFont: "Poppins", bodyFont: "Montserrat", borderRadius: "1rem" },
          "Botanical Garden": { primaryColor: "#00C853", secondaryColor: "#351000", headlineFont: "Playfair Display", bodyFont: "Open Sans", borderRadius: "3rem" },
          "Neon Night": { primaryColor: "#7928CA", secondaryColor: "#0070F3", headlineFont: "Poppins", bodyFont: "Montserrat", borderRadius: "1.5rem" },
        };
        const themeStyle = styleMap[result.suggestedTheme];
        if (themeStyle) applyTemplate(themeStyle);
      }

      setProgress(100);
      setState("done");

      setTimeout(() => router.push("/ai-result"), 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-[var(--font-headline)] font-black tracking-tight text-primary-container">MENUZA AI</Link>
        <Link href="/onboarding" className="text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </Link>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="max-w-2xl w-full">
          {state === "idle" && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl lg:text-5xl font-[var(--font-headline)] font-extrabold tracking-tight mb-4">
                  Upload Your Menu
                </h1>
                <p className="text-secondary text-lg">Snap a photo of your menu or upload a file</p>
              </div>

              <div
                className={`border-2 border-dashed rounded-[2rem] p-16 text-center cursor-pointer transition-all ${dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-outline-variant/40 hover:border-primary/40 hover:bg-primary/5"}`}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif" onChange={onFileChange} id="menu-upload" title="Menu File Upload" aria-label="Menu File Upload" />
                <label htmlFor="menu-upload" className="cursor-pointer flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary text-5xl mb-4">cloud_upload</span>
                  <p className="font-[var(--font-headline)] font-bold text-on-surface text-lg">Drop your menu here</p>
                  <p className="text-secondary text-sm">PDF, JPEG, PNG or WebP (Max 10MB)</p>
                </label>
                <button type="button" className="mt-6 px-6 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  Browse Files
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: "image", label: "Image", desc: "JPG, PNG" },
                  { icon: "picture_as_pdf", label: "PDF", desc: "Document" },
                  { icon: "photo_camera", label: "Camera", desc: "Take Photo" },
                ].map((o) => (
                  <button key={o.label} type="button" onClick={() => fileRef.current?.click()}
                    className="p-6 bg-surface-container-lowest rounded-2xl text-center hover:bg-surface-container-low transition-colors border border-outline-variant/10 group">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block group-hover:scale-110 transition-transform">{o.icon}</span>
                    <p className="font-bold text-sm">{o.label}</p>
                    <p className="text-[10px] text-secondary">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(state === "uploading" || state === "extracting") && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto bg-primary-container/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                <span className="material-symbols-outlined text-primary-container text-5xl icon-fill">auto_awesome</span>
              </div>
              <h2 className="text-3xl font-[var(--font-headline)] font-extrabold mb-4">
                {state === "uploading" ? "Uploading your menu..." : "AI is extracting your menu..."}
              </h2>
              <p className="text-secondary text-lg">
                {state === "uploading" ? "Sending file to our servers" : "Extracting categories, items, and prices with AI"}
              </p>
              <div className="mt-8 w-64 h-2 bg-surface-container-highest rounded-full mx-auto overflow-hidden">
                <style>{`
                  .dynamic-progress-bar { width: ${progress}%; }
                `}</style>
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full dynamic-progress-bar"
                />
              </div>
            </div>
          )}

          {state === "done" && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto bg-tertiary/10 rounded-full flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-tertiary text-5xl icon-fill">check_circle</span>
              </div>
              <h2 className="text-3xl font-[var(--font-headline)] font-extrabold mb-4">Menu Extracted Successfully!</h2>
              <p className="text-secondary text-lg mb-8">{extractedCount.items} items found across {extractedCount.categories} categories</p>
              <Link href="/ai-result" className="px-8 py-4 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-lg">
                Review & Edit
              </Link>
            </div>
          )}

          {state === "error" && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto bg-error/10 rounded-full flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-error text-5xl">error</span>
              </div>
              <h2 className="text-3xl font-[var(--font-headline)] font-extrabold mb-4">Extraction Failed</h2>
              <p className="text-secondary text-lg mb-8">{errorMsg}</p>
              <button type="button" onClick={reset} className="px-8 py-4 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-lg">
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

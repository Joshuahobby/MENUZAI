"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMenu, MenuItem } from "@/context/MenuContext";

export default function UploadPage() {
  const { setMenuItems, setCategories, setRestaurantName } = useMenu();
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 25;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Simulate AI Data Extraction
        setRestaurantName("Le Bistro");
        setCategories([
          { id: "appetizers", name: "Appetizers", itemCount: 3 },
          { id: "main-courses", name: "Main Courses", itemCount: 5 },
          { id: "desserts", name: "Desserts", itemCount: 4 }
        ]);
        
        // We'll use mock items but filter for these categories
        const mockItems = [
          { id: "1", name: "Truffle Fries", price: 12, category: "appetizers", description: "Crispy fries with truffle oil", image: "", tags: ["Vegetarian"] },
          { id: "2", name: "Steak Frites", price: 28, category: "main-courses", description: "Prime ribeye with house sauce", image: "", tags: ["Best Seller"] },
          { id: "3", name: "Lava Cake", price: 10, category: "desserts", description: "Warm chocolate with vanilla ice cream", image: "", tags: ["Sweet"] },
        ];
        setMenuItems(mockItems as MenuItem[]);

        setTimeout(() => {
          router.push("/ai-result");
        }, 800);
      }
      setUploadProgress(currentProgress);
    }, 150);
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
          {uploadProgress === 0 && (
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
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(); }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={handleUpload} id="menu-upload" title="Menu File Upload" aria-label="Menu File Upload" />
                <label htmlFor="menu-upload" className="cursor-pointer flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary text-5xl mb-4 group-hover:scale-110 transition-transform">cloud_upload</span>
                  <p className="font-[var(--font-headline)] font-bold text-on-surface text-lg">Drop your menu here</p>
                  <p className="text-secondary text-sm">PDF, JPEG or PNG (Max 10MB)</p>
                </label>
                <button className="mt-6 px-6 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  Browse Files
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: "image", label: "Image", desc: "JPG, PNG" },
                  { icon: "picture_as_pdf", label: "PDF", desc: "Document" },
                  { icon: "text_snippet", label: "Text", desc: "TXT, CSV" },
                ].map((o) => (
                  <button key={o.label} onClick={handleUpload}
                    className="p-6 bg-surface-container-lowest rounded-2xl text-center hover:bg-surface-container-low transition-colors border border-outline-variant/10 group">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block group-hover:scale-110 transition-transform">{o.icon}</span>
                    <p className="font-bold text-sm">{o.label}</p>
                    <p className="text-[10px] text-secondary">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto bg-primary-container/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                <span className="material-symbols-outlined text-primary-container text-5xl icon-fill">auto_awesome</span>
              </div>
              <h2 className="text-3xl font-[var(--font-headline)] font-extrabold mb-4">MENUZAI is reading your menu...</h2>
              <p className="text-secondary text-lg">Extracting categories, items, and prices with AI</p>
              <div className="mt-8 w-64 h-2 bg-surface-container-highest rounded-full mx-auto overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 rounded-full" 
                  ref={(el) => {
                    if (el) {
                      el.style.width = `${uploadProgress}%`;
                    }
                  }} 
                />
              </div>
            </div>
          )}

          {uploadProgress === 100 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto bg-tertiary/10 rounded-full flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-tertiary text-5xl icon-fill">check_circle</span>
              </div>
              <h2 className="text-3xl font-[var(--font-headline)] font-extrabold mb-4">Menu Extracted Successfully!</h2>
              <p className="text-secondary text-lg mb-8">12 items found across 4 categories</p>
              <Link href="/ai-result" className="px-8 py-4 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-lg">
                Review & Edit
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { templates } from "@/data/mockData";
import type { MenuItem } from "@/types/menu";

type UploadState = "idle" | "extracting" | "done" | "error";

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXTRACTING_STEPS = [
  "Reading menu text...",
  "Analyzing dish details...",
  "Organizing categories...",
  "Identifying ingredients...",
  "Detecting prices...",
  "Picking a color theme...",
  "Finalizing your menu..."
];

export default function UploadPage() {
  const { setMenuItems, setCategories, setRestaurantName, applyTemplate } = useMenu();
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [extractedCount, setExtractedCount] = useState({ items: 0, categories: 0 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Rotate extraction messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === "extracting") {
      interval = setInterval(() => {
        setCurrentStepIndex(prev => (prev + 1) % EXTRACTING_STEPS.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter(f => VALID_TYPES.includes(f.type) && f.size <= MAX_SIZE);
    setSelectedFiles(prev => {
      const merged = [...prev, ...valid];
      return merged.slice(0, MAX_FILES);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleExtract = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      if (!VALID_TYPES.includes(file.type)) {
        setErrorMsg(`Unsupported type: ${file.name}. Use JPG, PNG, WebP, or GIF.`);
        setState("error");
        return;
      }
      if (file.size > MAX_SIZE) {
        setErrorMsg(`${file.name} exceeds 10MB.`);
        setState("error");
        return;
      }
    }

    setState("extracting");
    setProgress(20);

    const formData = new FormData();
    if (selectedFiles.length === 1) {
      formData.append("file", selectedFiles[0]);
    } else {
      selectedFiles.forEach((f, i) => formData.append(`file_${i}`, f));
    }

    setProgress(40);

    try {
      const res = await fetch("/api/extract-menu", { method: "POST", body: formData });
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
        const match = templates.find(t => t.name.toLowerCase() === result.suggestedTheme.toLowerCase());
        if (match) applyTemplate(match.config);
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
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
    setErrorMsg("");
    setSelectedFiles([]);
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
                <p className="text-secondary text-lg">Upload up to {MAX_FILES} pages — we&apos;ll extract and merge them all</p>
              </div>

              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all ${dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-outline-variant/40 hover:border-primary/40 hover:bg-primary/5"}`}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  onChange={onFileChange}
                  id="menu-upload"
                  title="Menu File Upload"
                  aria-label="Menu File Upload"
                />
                <label htmlFor="menu-upload" className="cursor-pointer flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary text-5xl mb-4">cloud_upload</span>
                  <p className="font-[var(--font-headline)] font-bold text-on-surface text-lg">Drop menu photos here</p>
                  <p className="text-secondary text-sm">JPG, PNG, WebP or GIF · Max 10MB each · Up to {MAX_FILES} images</p>
                </label>
                <button type="button" className="mt-6 px-6 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  Browse Files
                </button>
              </div>

              {/* Selected files preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">
                    {selectedFiles.length} of {MAX_FILES} images selected
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="relative group bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-28 object-cover"
                        />
                        <div className="p-2">
                          <p className="text-[10px] font-bold text-secondary truncate">{file.name}</p>
                          <p className="text-[10px] text-secondary opacity-60">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </div>
                    ))}
                    {selectedFiles.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="h-full min-h-28 border-2 border-dashed border-outline-variant/40 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >
                        <span className="material-symbols-outlined text-primary text-2xl">add</span>
                        <span className="text-[10px] font-bold text-secondary">Add more</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleExtract}
                    className="w-full py-4 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
                  >
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Extract Menu{selectedFiles.length > 1 ? ` from ${selectedFiles.length} Images` : ""}
                  </button>
                </div>
              )}
            </div>
          )}

          {state === "extracting" && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto bg-primary-container/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                <span className="material-symbols-outlined text-primary-container text-5xl icon-fill">auto_awesome</span>
              </div>
              <h2 className="text-3xl font-[var(--font-headline)] font-extrabold mb-4">
                AI is reading your menu…
              </h2>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <p className="text-lg font-bold tracking-tight">
                    {EXTRACTING_STEPS[currentStepIndex]}
                  </p>
                </div>
                <p className="text-secondary text-sm opacity-70">
                  {selectedFiles.length > 1
                    ? `Processing ${selectedFiles.length} images and merging results`
                    : "This might take a moment depending on the menu size"}
                </p>
              </div>
              <div className="mt-8 w-64 h-2 bg-surface-container-highest rounded-full mx-auto overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  ref={(el) => { if (el) el.style.width = `${progress}%`; }}
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

"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { templates } from "@/data/mockData";
import type { MenuItem } from "@/types/menu";

if (typeof globalThis !== "undefined" && !globalThis.DOMMatrix) {
  // @ts-expect-error polyfill for Next.js SSR where Turbopack evaluates pdfjs-dist
  globalThis.DOMMatrix = class DOMMatrix {} as unknown;
}

type UploadState = "idle" | "extracting" | "done" | "error";

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export default function UploadPage() {
  const { setMenuItems, setCategories, setRestaurantName, applyTemplate, restaurantId } = useMenu();
  const backHref = restaurantId ? "/dashboard/editor" : "/onboarding";
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Preparing extraction...");
  const [errorMsg, setErrorMsg] = useState("");
  const [extractedCount, setExtractedCount] = useState({ items: 0, categories: 0 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = async (incoming: File[]) => {
    const oversized = incoming.filter(f => f.size > MAX_SIZE);
    const invalid = incoming.filter(f => !VALID_TYPES.includes(f.type) && f.size <= MAX_SIZE);

    if (oversized.length > 0) {
      setErrorMsg(`${oversized[0].name} exceeds 10 MB.`);
      setState("error");
      return;
    }
    if (invalid.length > 0) {
      setErrorMsg(`${invalid[0].name}: unsupported type. Use JPG, PNG, WebP, GIF, or PDF.`);
      setState("error");
      return;
    }

    setIsProcessingPdf(true);
    try {
      const valid = incoming.filter(f => VALID_TYPES.includes(f.type) && f.size <= MAX_SIZE);
      const processedFiles: File[] = [];

      for (const file of valid) {
        if (file.type === "application/pdf") {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const numPages = Math.min(pdf.numPages, MAX_FILES);

          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) continue;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // @ts-expect-error pdfjs-dist type mismatch with canvasContext
            await page.render({ canvasContext: context, viewport }).promise;

            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
            if (blob) {
              processedFiles.push(new File([blob], `${file.name.replace(/\.pdf$/i, '')}_page${i}.jpg`, { type: "image/jpeg" }));
            }
          }
        } else {
          processedFiles.push(file);
        }
      }

      setSelectedFiles(prev => {
        const merged = [...prev, ...processedFiles];
        return merged.slice(0, MAX_FILES);
      });
    } catch (err) {
      console.error("PDF processing failed", err);
      setErrorMsg("Failed to read PDF. Please try a different file or use an image.");
      setState("error");
    } finally {
      setIsProcessingPdf(false);
    }
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
        setErrorMsg(`${file.name} exceeds 10 MB.`);
        setState("error");
        return;
      }
    }

    setState("extracting");
    setCurrentStep("Preparing extraction...");
    setProgress(5);

    const formData = new FormData();
    if (selectedFiles.length === 1) {
      formData.append("file", selectedFiles[0]);
    } else {
      selectedFiles.forEach((f, i) => formData.append(`file_${i}`, f));
    }

    try {
      const res = await fetch("/api/extract-menu", { method: "POST", body: formData });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Extraction failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: "progress" | "result" | "error";
              step?: string;
              pct?: number;
              data?: {
                restaurantName?: string;
                categories?: { id: string; name: string }[];
                items?: MenuItem[];
                suggestedTheme?: string;
              };
              error?: string;
            };

            if (event.type === "progress") {
              if (event.pct !== undefined) setProgress(event.pct);
              if (event.step) setCurrentStep(event.step);
            } else if (event.type === "result" && event.data) {
              const result = event.data;
              if (result.restaurantName) setRestaurantName(result.restaurantName);
              if (result.categories) setCategories(result.categories as Parameters<typeof setCategories>[0]);
              if (result.items) {
                setMenuItems(result.items as MenuItem[]);
                setExtractedCount({
                  items: result.items.length,
                  categories: result.categories?.length ?? 0,
                });
              }
              if (result.suggestedTheme) {
                const match = templates.find(t =>
                  t.name.toLowerCase() === result.suggestedTheme!.toLowerCase()
                );
                if (match) applyTemplate(match.config);
              }
              setProgress(100);
              setState("done");
              router.push("/ai-result");
            } else if (event.type === "error") {
              throw new Error(event.error ?? "Extraction failed");
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Extraction failed") {
              // JSON parse error — ignore malformed SSE line
            } else {
              throw parseErr;
            }
          }
        }
      }
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
      <header className="w-full sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-black/5 px-4 sm:px-8 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
          </div>
          <span className="font-headline font-black text-base tracking-tight">
            MENUZA <span className="text-primary">AI</span>
          </span>
        </Link>
        <Link href={backHref} className="text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">arrow_back</span> Back
        </Link>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6 py-16">
        <div className="max-w-xl w-full">
          {state === "idle" && (
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">AI Extraction</p>
                <h1 className="text-4xl font-headline font-extrabold tracking-tight mb-3">
                  Upload your menu
                </h1>
                <p className="text-secondary">Up to {MAX_FILES} pages — we&apos;ll extract and merge them all.</p>
              </div>

              {/* Drop zone */}
              <div className="relative">
                <div
                  className={`border-2 border-dashed rounded-3xl p-6 sm:p-12 text-center cursor-pointer transition-colors ${
                    dragActive ? "border-primary bg-primary/3" : "border-black/10 hover:border-primary/40 hover:bg-primary/3"
                  }`}
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => !isProcessingPdf && fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
                    onChange={onFileChange}
                    id="menu-upload"
                    title="Menu File Upload"
                    aria-label="Menu File Upload"
                  />
                  <label htmlFor="menu-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
                    <div>
                      <p className="font-bold text-on-surface">Drop menu photos or PDF here</p>
                      <p className="text-secondary text-sm mt-1">JPG, PNG, WebP, GIF or PDF · Max 10 MB each</p>
                    </div>
                  </label>
                  <button
                    type="button"
                    disabled={isProcessingPdf}
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-[2rem] hover:bg-[#a04100] transition-colors disabled:opacity-50"
                  >
                    {isProcessingPdf ? "Processing PDF…" : "Browse Files"}
                  </button>
                </div>

                {/* PDF processing spinner overlay */}
                {isProcessingPdf && (
                  <div className="absolute inset-0 rounded-3xl bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-none">
                    <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
                    <p className="text-sm font-semibold text-primary">Converting PDF pages…</p>
                  </div>
                )}
              </div>

              {/* Selected files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest">
                    {selectedFiles.length} of {MAX_FILES} selected
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="relative group bg-surface-container-lowest rounded-2xl overflow-hidden border border-black/6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-28 object-cover" />
                        <div className="p-2">
                          <p className="text-[10px] font-medium text-secondary truncate">{file.name}</p>
                          <p className="text-[10px] text-secondary/50">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                        className="min-h-28 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/3 transition-colors"
                      >
                        <span className="material-symbols-outlined text-primary text-xl">add</span>
                        <span className="text-[10px] font-medium text-secondary">Add more</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleExtract}
                    className="w-full py-4 bg-primary text-white font-bold rounded-[2rem] hover:bg-[#a04100] transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    <span className="sm:hidden">Extract ({selectedFiles.length})</span>
                    <span className="hidden sm:inline">
                      Extract Menu{selectedFiles.length > 1 ? ` from ${selectedFiles.length} images` : ""}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {state === "extracting" && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto bg-primary/8 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-primary text-3xl animate-pulse">auto_awesome</span>
              </div>
              <h2 className="text-3xl font-headline font-extrabold mb-3">
                AI is reading your menu…
              </h2>
              <div className="flex flex-col items-center gap-1.5 mb-8">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <p className="text-sm font-semibold">{currentStep}</p>
                </div>
                <p className="text-secondary text-xs">
                  {selectedFiles.length > 1 ? `Processing ${selectedFiles.length} images` : "This might take a moment"}
                </p>
              </div>
              <div className="w-48 h-1 bg-black/6 rounded-full mx-auto overflow-hidden">
                <div
                  className="bg-primary h-full transition-colors duration-500 rounded-full"
                  ref={(el) => { if (el) el.style.width = `${progress}%`; }}
                />
              </div>
            </div>
          )}

          {state === "done" && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto bg-tertiary/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-tertiary text-3xl">check</span>
              </div>
              <h2 className="text-3xl font-headline font-extrabold mb-3">Extraction complete</h2>
              <p className="text-secondary mb-8">{extractedCount.items} items across {extractedCount.categories} categories</p>
              <Link href="/ai-result" className="inline-block px-8 py-3.5 bg-primary text-white font-bold rounded-[2rem] hover:bg-[#a04100] transition-colors">
                Review & Edit
              </Link>
            </div>
          )}

          {state === "error" && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto bg-error-container/50 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-error/60 text-3xl">error_outline</span>
              </div>
              <h2 className="text-3xl font-headline font-extrabold mb-3">Extraction failed</h2>
              <p className="text-secondary mb-8 text-sm">{errorMsg}</p>
              <button type="button" onClick={reset} className="px-8 py-3.5 bg-primary text-white font-bold rounded-[2rem] hover:bg-[#a04100] transition-colors">
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

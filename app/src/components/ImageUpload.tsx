"use client";

import { useState, useRef } from "react";
import NextImage from "next/image";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ImageUploadProps {
  currentUrl: string;
  onUpload: (url: string) => void;
  userId: string;
  /** Optional: prefix folder inside the user's bucket folder */
  folder?: string;
}

export function ImageUpload({ currentUrl, onUpload, userId, folder = "items" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;

    setUploading(true);
    const uploadToast = toast.loading("Uploading image...");

    const { error } = await supabase.storage
      .from("menu-images")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.dismiss(uploadToast);
      toast.error("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    toast.dismiss(uploadToast);
    toast.success("Image uploaded!");
    onUpload(data.publicUrl);
    setUploading(false);

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="relative group">
      {/* Image preview */}
      <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-surface-container-low">
        {currentUrl ? (
          <NextImage
            src={currentUrl}
            alt="Uploaded image"
            fill
            sizes="(max-width: 420px) 100vw, 420px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-secondary/20">add_photo_alternate</span>
            <span className="text-xs font-medium text-secondary/30 mt-1">No image</span>
          </div>
        )}
        {/* Overlay on hover/empty */}
        <div className={`absolute inset-0 flex items-center justify-center transition-colors ${uploading ? "bg-black/50" : currentUrl ? "bg-black/0 group-hover:bg-black/40" : "bg-black/0 group-hover:bg-black/10"}`}>
          {uploading ? (
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className={`transition-opacity flex flex-col items-center gap-2 ${currentUrl ? "opacity-0 group-hover:opacity-100 text-white" : "opacity-100 text-secondary/50 group-hover:text-secondary"}`}
              title={currentUrl ? "Change image" : "Upload image"}
            >
              <span className="material-symbols-outlined text-3xl drop-shadow">add_photo_alternate</span>
              <span className="text-xs font-bold drop-shadow">{currentUrl ? "Change Photo" : "Upload Image"}</span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        title="Upload image"
      />
    </div>
  );
}

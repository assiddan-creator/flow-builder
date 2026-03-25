"use client";

import { useRef } from "react";

const ACCENT = "#f59e0b";

export interface ImageUploadSlotProps {
  label: string;
  value: string | null;
  onChange: (dataUri: string | null) => void;
}

export default function ImageUploadSlot({ label, value, onChange }: ImageUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      onChange(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      onChange(r);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
      <span className="text-[10px] text-[#888] text-center leading-tight">{label}</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: "8px",
            }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/75 text-white text-sm font-semibold leading-none flex items-center justify-center hover:bg-red-600/90"
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#333] bg-[#141414] rounded-xl hover:border-[#f59e0b60] transition-colors text-[#666]"
          style={{ height: "120px" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-[10px] px-1 text-center" style={{ color: ACCENT }}>
            + הוסף
          </span>
        </button>
      )}
    </div>
  );
}

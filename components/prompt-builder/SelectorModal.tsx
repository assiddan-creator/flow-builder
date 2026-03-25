"use client";

import { useEffect, useMemo, useState } from "react";

const ACCENT = "#f59e0b";

function gradientForLabel(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) >>> 0;
  }
  const h1 = h % 360;
  const h2 = (h1 + 47) % 360;
  return `linear-gradient(145deg, hsl(${h1}, 42%, 18%), hsl(${h2}, 50%, 28%))`;
}

export interface SelectorModalProps {
  open: boolean;
  onClose: () => void;
  /** Shown in header, e.g. "Shot Type / Angle" */
  sectionTitle: string;
  options: readonly string[];
  onSelect: (value: string) => void;
}

export default function SelectorModal({
  open,
  onClose,
  sectionTitle,
  options,
  onSelect,
}: SelectorModalProps) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [...options];
    return options.filter((o) => o.toLowerCase().includes(s));
  }, [options, q]);

  if (!open) return null;

  const count = options.length;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-[#2a2a2a] shadow-2xl overflow-hidden"
        style={{ background: "#141414" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#2a2a2a] shrink-0">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-white leading-snug">
              SELECT {sectionTitle.toUpperCase()} // {count} OPTIONS AVAILABLE
            </p>
            <p className="text-[10px] text-[#666] mt-1">
              {filtered.length} shown{q.trim() ? ` (search: “${q.trim()}”)` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-[#333] text-[#888] hover:text-white hover:border-[#444] transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#f59e0b60]"
            autoFocus
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  onClose();
                }}
                className="group text-left rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#1e1e1e] hover:border-[#f59e0b80] transition-colors focus:outline-none focus:ring-2 focus:ring-[#f59e0b40]"
              >
                <div
                  className="h-[88px] w-full"
                  style={{ background: gradientForLabel(opt) }}
                />
                <div className="px-2 py-2 min-h-[52px] flex items-end">
                  <span className="text-[10px] leading-tight font-semibold text-white uppercase tracking-wide line-clamp-3">
                    {opt}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-[#555] py-12">No matches</p>
          )}
        </div>
      </div>
    </div>
  );
}

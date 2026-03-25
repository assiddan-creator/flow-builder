"use client";

import { useEffect, useRef, useState } from "react";
import { useFlowStore } from "@/store/flowStore";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

function KeyInput({
  label,
  placeholder,
  value,
  saved,
  onSave,
  accentColor,
  link,
  linkLabel,
}: {
  label: string;
  placeholder: string;
  value: string;
  saved: string;
  onSave: (v: string) => void;
  accentColor: string;
  link: string;
  linkLabel: string;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="text-xs text-[#888]">{label}</label>
      <div className="relative">
        <input
          type="password"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none transition-colors pr-8"
          style={{ outlineColor: accentColor }}
          onFocus={(e) => (e.target.style.borderColor = accentColor)}
          onBlur={(e) => (e.target.style.borderColor = "#333")}
        />
        {local && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#22c55e]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        )}
      </div>

      <button
        onClick={() => onSave(local)}
        className="w-full py-2 rounded-lg text-xs font-semibold transition-colors"
        style={{ background: accentColor }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Save Key
      </button>

      {saved && (
        <p className="text-[11px] text-[#22c55e] flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          API key saved
        </p>
      )}

      <div className="p-2.5 bg-[#111] rounded-lg border border-[#222]">
        <p className="text-[11px] text-[#555] leading-relaxed">
          Get your key at{" "}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: accentColor }}
          >
            {linkLabel}
          </a>
          . Stored locally, never shared.
        </p>
      </div>
    </div>
  );
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const apiKey = useFlowStore((s) => s.apiKey);
  const setApiKey = useFlowStore((s) => s.setApiKey);
  const geminiApiKey = useFlowStore((s) => s.geminiApiKey);
  const setGeminiApiKey = useFlowStore((s) => s.setGeminiApiKey);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div
        ref={panelRef}
        className="relative h-full w-80 bg-[#161616] border-l border-[#2a2a2a] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
            <h2 className="text-sm font-semibold text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* ── Section 1: Replicate ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              <h3 className="text-xs font-semibold text-[#a78bfa] uppercase tracking-wide">Replicate</h3>
              {apiKey && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] ml-auto" />}
            </div>

            <KeyInput
              label="Replicate API Key"
              placeholder="r8_…"
              value={apiKey}
              saved={apiKey}
              onSave={setApiKey}
              accentColor="#a78bfa"
              link="https://replicate.com/account/api-tokens"
              linkLabel="replicate.com"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-[#222]" />

          {/* ── Section 2: Google Gemini ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <circle cx="12" cy="12" r="10" stroke="#4285f4"/>
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10" stroke="#34a853"/>
                <path d="M22 12c0 5.523-4.477 10-10 10" stroke="#fbbc05"/>
                <path d="M12 7v5l3 3" stroke="#ea4335" strokeLinecap="round"/>
              </svg>
              <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4285f4" }}>
                Google Gemini
              </h3>
              {geminiApiKey && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] ml-auto" />}
            </div>

            <KeyInput
              label="Gemini API Key"
              placeholder="AIza…"
              value={geminiApiKey}
              saved={geminiApiKey}
              onSave={setGeminiApiKey}
              accentColor="#4285f4"
              link="https://aistudio.google.com/app/apikey"
              linkLabel="aistudio.google.com"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-[#222]" />

          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h3 className="text-xs font-semibold text-[#378ADD] uppercase tracking-wide">About</h3>
            </div>
            <div className="p-3 bg-[#111] rounded-lg border border-[#222] space-y-2">
              <p className="text-xs font-semibold text-white">Flow Builder</p>
              <p className="text-[11px] text-[#555] leading-relaxed">
                Visual AI campaign creation tool. Build multi-step workflows with Replicate and Google Gemini.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["React Flow", "Replicate", "Gemini", "Next.js 14"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[10px] text-[#555]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

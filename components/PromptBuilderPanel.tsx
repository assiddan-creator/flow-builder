"use client";

import { useCallback, useEffect, useState } from "react";
import { useFlowStore } from "@/store/flowStore";
import { runGeneration } from "@/lib/runGeneration";
import { downloadImage } from "@/lib/downloadImage";
import SelectorModal from "./prompt-builder/SelectorModal";
import ImageUploadSlot from "./prompt-builder/ImageUploadSlot";
import { usePromptBuilder } from "./prompt-builder/usePromptBuilder";
import {
  SHOT_TYPES,
  LIGHTING_OPTIONS,
  CAMERA_BODIES,
  FOCAL_LENGTHS,
  LENS_TYPES,
  MOVIE_LOOKS,
} from "./prompt-builder/constants";

const ACCENT = "#f59e0b";
const BG = "#0f0f0f";
const CARD = "#1a1a1a";

type ModalKey = "shot" | "lighting" | "camera" | "focal" | "lens" | "movie" | null;

function Tag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium text-white border border-[#333] bg-[#252525] max-w-full"
      style={{ borderColor: `${ACCENT}40` }}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-[#888] hover:text-white"
        aria-label="Remove"
      >
        ×
      </button>
    </span>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] p-3" style={{ background: CARD }}>
      <h3 className="text-xs font-semibold text-white mb-2" style={{ color: ACCENT }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function PromptBuilderPanel() {
  const open = useFlowStore((s) => s.promptBuilderOpen);
  const togglePromptBuilder = useFlowStore((s) => s.togglePromptBuilder);

  const pb = usePromptBuilder();
  const [modal, setModal] = useState<ModalKey>(null);
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !modal) togglePromptBuilder();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, modal, togglePromptBuilder]);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pb.builtPrompt);
    } catch {
      /* ignore */
    }
  }, [pb.builtPrompt]);

  const sendToNode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pb.builtPrompt);
    } catch {
      /* ignore */
    }
    togglePromptBuilder();
  }, [pb.builtPrompt, togglePromptBuilder]);

  const handleGenerate = async () => {
    setGenError(null);
    setResultUrl(null);
    setGenerating(true);
    try {
      const defaultModel =
        pb.provider === "gemini" ? pb.GEMINI_MODELS[0].value : pb.REPLICATE_MODELS[0].value;
      const url = await runGeneration({
        provider: pb.provider,
        model: pb.model || defaultModel,
        prompt: pb.builtPrompt,
        inputImages: pb.referenceImages,
      });
      setResultUrl(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "gemini-key-missing") {
        setGenError("הגדר מפתח Gemini בהגדרות");
      } else if (msg === "replicate-key-missing") {
        setGenError("Set Replicate API key in Settings");
      } else {
        setGenError(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col"
      style={{ background: BG }}
    >
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a] bg-[#0a0a0a]/90">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white tracking-tight">Prompt Builder</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#f59e0b40]" style={{ color: ACCENT }}>
            PRO
          </span>
        </div>
        <button
          type="button"
          onClick={() => togglePromptBuilder()}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#333] text-[#888] hover:text-white hover:border-[#444] transition-colors"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* LEFT — form */}
        <aside
          className="w-[480px] shrink-0 border-r border-[#2a2a2a] overflow-y-auto p-4 space-y-3"
          style={{ background: BG }}
        >
          <SectionCard title="נושא ופעולה">
            <textarea
              value={pb.subjectAction}
              onChange={(e) => pb.setSubjectAction(e.target.value)}
              rows={4}
              placeholder="לדוגמה: אישה צעירה עומדת בגשם..."
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] resize-none focus:outline-none focus:border-[#f59e0b60]"
            />
          </SectionCard>

          <SectionCard title="זווית צילום">
            <button
              type="button"
              onClick={() => setModal("shot")}
              className="w-full py-2.5 rounded-lg text-xs font-semibold border border-[#333] bg-[#111] text-white hover:border-[#f59e0b60] transition-colors"
            >
              בחר זווית… ({SHOT_TYPES.length})
            </button>
            {pb.shotType && (
              <div className="mt-2">
                <Tag label={pb.shotType} onRemove={() => pb.setShotType(null)} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="מקור תאורה">
            <button
              type="button"
              onClick={() => setModal("lighting")}
              className="w-full py-2.5 rounded-lg text-xs font-semibold border border-[#333] bg-[#111] text-white hover:border-[#f59e0b60] transition-colors"
            >
              בחר תאורה… ({LIGHTING_OPTIONS.length})
            </button>
            {pb.lighting && (
              <div className="mt-2">
                <Tag label={pb.lighting} onRemove={() => pb.setLighting(null)} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="גוף מצלמה">
            <button
              type="button"
              onClick={() => setModal("camera")}
              className="w-full py-2.5 rounded-lg text-xs font-semibold border border-[#333] bg-[#111] text-white hover:border-[#f59e0b60] transition-colors"
            >
              בחר מצלמה… ({CAMERA_BODIES.length})
            </button>
            {pb.cameraBody && (
              <div className="mt-2">
                <Tag label={pb.cameraBody} onRemove={() => pb.setCameraBody(null)} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="אורך מוקד">
            <button
              type="button"
              onClick={() => setModal("focal")}
              className="w-full py-2.5 rounded-lg text-xs font-semibold border border-[#333] bg-[#111] text-white hover:border-[#f59e0b60] transition-colors"
            >
              בחר אורך מוקד… ({FOCAL_LENGTHS.length})
            </button>
            {pb.focalLength && (
              <div className="mt-2">
                <Tag label={pb.focalLength} onRemove={() => pb.setFocalLength(null)} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="סוג עדשה">
            <button
              type="button"
              onClick={() => setModal("lens")}
              className="w-full py-2.5 rounded-lg text-xs font-semibold border border-[#333] bg-[#111] text-white hover:border-[#f59e0b60] transition-colors"
            >
              בחר עדשה… ({LENS_TYPES.length})
            </button>
            {pb.lensType && (
              <div className="mt-2">
                <Tag label={pb.lensType} onRemove={() => pb.setLensType(null)} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="לוק סרט">
            <button
              type="button"
              onClick={() => setModal("movie")}
              className="w-full py-2.5 rounded-lg text-xs font-semibold border border-[#333] bg-[#111] text-white hover:border-[#f59e0b60] transition-colors"
            >
              בחר סרט… ({MOVIE_LOOKS.length}+)
            </button>
            {pb.movieLook && (
              <div className="mt-2">
                <Tag label={pb.movieLook} onRemove={() => pb.setMovieLook(null)} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="תמונות רפרנס">
            <div className="flex gap-2">
              <ImageUploadSlot
                label="פנים של הדמות"
                value={pb.faceRef}
                onChange={pb.setFaceRef}
              />
              <ImageUploadSlot
                label="בגדים של הדמות"
                value={pb.outfitRef}
                onChange={pb.setOutfitRef}
              />
              <ImageUploadSlot
                label="רפרנס גלובלי"
                value={pb.globalRef}
                onChange={pb.setGlobalRef}
              />
            </div>
          </SectionCard>
        </aside>

        {/* RIGHT — output */}
        <main className="flex-1 flex flex-col min-w-0 p-5 overflow-y-auto" style={{ background: BG }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>
            Constructed prompt
          </p>
          <pre className="flex-1 min-h-[200px] max-h-[40vh] overflow-auto rounded-xl border border-[#2a2a2a] bg-[#111] p-4 text-xs text-[#ccc] whitespace-pre-wrap font-mono leading-relaxed mb-4">
            {pb.builtPrompt}
          </pre>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={copyPrompt}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#333] bg-[#1a1a1a] text-white hover:border-[#f59e0b60]"
            >
              העתק פרומפט
            </button>
            <button
              type="button"
              onClick={sendToNode}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#333] bg-[#1a1a1a] text-white hover:border-[#f59e0b60]"
            >
              שלח לנוד
            </button>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>
            Provider &amp; model
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex rounded-xl overflow-hidden border border-[#2a2a2a]">
              <button
                type="button"
                onClick={() => pb.setProviderAndModel("replicate")}
                className="px-4 py-2 text-xs font-semibold transition-colors"
                style={{
                  background: pb.provider === "replicate" ? `${ACCENT}30` : "#111",
                  color: pb.provider === "replicate" ? ACCENT : "#666",
                }}
              >
                Replicate
              </button>
              <button
                type="button"
                onClick={() => pb.setProviderAndModel("gemini")}
                className="px-4 py-2 text-xs font-semibold transition-colors"
                style={{
                  background: pb.provider === "gemini" ? `${ACCENT}30` : "#111",
                  color: pb.provider === "gemini" ? ACCENT : "#666",
                }}
              >
                Gemini
              </button>
            </div>
            {pb.provider === "replicate" ? (
              <select
                value={pb.model}
                onChange={(e) => pb.setModel(e.target.value)}
                className="bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f59e0b60]"
              >
                {pb.REPLICATE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={pb.model}
                onChange={(e) => pb.setModel(e.target.value)}
                className="bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f59e0b60]"
              >
                {pb.GEMINI_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={handleGenerate}
            className="w-full max-w-md py-4 rounded-2xl text-sm font-bold text-black disabled:opacity-50 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: ACCENT }}
          >
            {generating ? "יוצר…" : "צור תמונה"}
          </button>

          {genError && (
            <p className="mt-3 text-sm text-red-400 max-w-md">{genError}</p>
          )}

          {resultUrl && (
            <div className="mt-6 w-full max-w-2xl">
              <div className="w-full rounded-2xl overflow-hidden border border-[#2a2a2a] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="Result"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    objectFit: "contain",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => void downloadImage(resultUrl)}
                className="w-full mt-2"
                style={{
                  background: "#2a2a2a",
                  color: "white",
                  border: "1px solid #3a3a3a",
                  padding: "6px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                הורד תמונה ↓
              </button>
            </div>
          )}
        </main>
      </div>

      {modal === "shot" && (
        <SelectorModal
          open
          onClose={() => setModal(null)}
          sectionTitle="Shot Type / Angle"
          options={[...SHOT_TYPES]}
          onSelect={(v) => pb.setShotType(v)}
        />
      )}
      {modal === "lighting" && (
        <SelectorModal
          open
          onClose={() => setModal(null)}
          sectionTitle="Lighting Source"
          options={[...LIGHTING_OPTIONS]}
          onSelect={(v) => pb.setLighting(v)}
        />
      )}
      {modal === "camera" && (
        <SelectorModal
          open
          onClose={() => setModal(null)}
          sectionTitle="Camera Body"
          options={[...CAMERA_BODIES]}
          onSelect={(v) => pb.setCameraBody(v)}
        />
      )}
      {modal === "focal" && (
        <SelectorModal
          open
          onClose={() => setModal(null)}
          sectionTitle="Focal Length"
          options={[...FOCAL_LENGTHS]}
          onSelect={(v) => pb.setFocalLength(v)}
        />
      )}
      {modal === "lens" && (
        <SelectorModal
          open
          onClose={() => setModal(null)}
          sectionTitle="Lens Type"
          options={[...LENS_TYPES]}
          onSelect={(v) => pb.setLensType(v)}
        />
      )}
      {modal === "movie" && (
        <SelectorModal
          open
          onClose={() => setModal(null)}
          sectionTitle="Movie Look / Aesthetic"
          options={[...MOVIE_LOOKS]}
          onSelect={(v) => pb.setMovieLook(v)}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useFlowStore } from "@/store/flowStore";

type TagKey =
  | "דמות"
  | "בגדים"
  | "מוצר"
  | "חילוץ"
  | "וידאו"
  | "רקע"
  | "איכות";

const TAG_STYLES: Record<TagKey, { bg: string; text: string }> = {
  "דמות":  { bg: "#1a3a2a", text: "#4ade80" },
  "בגדים": { bg: "#3a1a2a", text: "#f472b6" },
  "מוצר":  { bg: "#1a2a3a", text: "#60a5fa" },
  "חילוץ": { bg: "#3a2a1a", text: "#fbbf24" },
  "וידאו": { bg: "#2a1a3a", text: "#a78bfa" },
  "רקע":   { bg: "#1a3a3a", text: "#2dd4bf" },
  "איכות": { bg: "#2a2a2a", text: "#9ca3af" },
};

interface Preset {
  tag: TagKey;
  title: string;
  prompt: string;
}

const PRESETS: { category: string; items: Preset[] }[] = [
  {
    category: "הכנת הדמות",
    items: [
      {
        tag: "דמות",
        title: 'דמות על רקע לבן — גוף מלא',
        prompt: "place the character from @character in front of white background, full body shot, make him the outfit from @outfit, add black glasses, dont wear cap everything else same",
      },
      {
        tag: "דמות",
        title: "שינוי תנוחה — יד על ירך",
        prompt: "change the subject pose: one hand is on her hip",
      },
      {
        tag: "דמות",
        title: "תנוחת פאדל / טניס",
        prompt: "change the subject pose to padel / tennis form",
      },
      {
        tag: "דמות",
        title: "דמות מחזיקה מוצר",
        prompt: "make the product float in his hand",
      },
      {
        tag: "דמות",
        title: "דמות יושבת — ספה / כורסא",
        prompt: "change the subject pose: sitting on a luxury sofa, relaxed and natural, legs crossed, looking at camera, same outfit and face",
      },
      {
        tag: "דמות",
        title: "קלוז-אפ פנים — אמינות",
        prompt: "close-up portrait shot, subject looking directly at camera with a confident natural expression, soft studio lighting, shallow depth of field, same face and outfit",
      },
    ],
  },
  {
    category: "החלפת בגדים",
    items: [
      {
        tag: "בגדים",
        title: "החלפת אאוטפיט — שמור פרצוף",
        prompt: "change the outfit to this (see image 2). important: keep the same face and detail of the racket",
      },
      {
        tag: "חילוץ",
        title: "חילוץ פריטי לבוש על רקע לבן",
        prompt: "extract every outfit item from this and put it on a white background",
      },
      {
        tag: "בגדים",
        title: "שינוי צבע מחבט — כחול",
        prompt: "change the racket color to blue (hex color #d2e4f1)",
      },
      {
        tag: "בגדים",
        title: "שינוי צבע מחבט — ורוד בייבי",
        prompt: "change the racket color to soft baby pink (hex color #f1acbf)",
      },
      {
        tag: "בגדים",
        title: "החלפת חולצה — שמור גוף ופנים",
        prompt: "replace only the shirt with a clean white fitted t-shirt. keep the exact same face, body position, pants, shoes and background. do not change anything else",
      },
      {
        tag: "בגדים",
        title: "הסר לוגו / כיתוב מבגד",
        prompt: "remove all logos, text and graphics from the clothing. keep the exact same garment shape, color and texture. clean and blank fabric only",
      },
    ],
  },
  {
    category: "צילום מוצר",
    items: [
      {
        tag: "מוצר",
        title: "מוצר — צילום סטודיו מסחרי",
        prompt: "Ultra realistic commercial product photography of a sleek aluminum soda can placed in the center foreground, slightly tilted toward the camera. Background is a bold solid red gradient studio backdrop with soft vignette.",
      },
      {
        tag: "מוצר",
        title: "פרפיום — שיש, אור זהוב",
        prompt: "A luxury perfume bottle placed on a white marble surface, soft cinematic lighting, golden hour glow, photorealistic, ultra-detailed, editorial style, 4K",
      },
      {
        tag: "מוצר",
        title: "מוצר על רקע שחור — יוקרה",
        prompt: "product placed on a black reflective surface, dramatic side lighting, deep shadows, luxury editorial photography, ultra-sharp focus, 4K commercial photography",
      },
      {
        tag: "מוצר",
        title: "מוצר בטבע — קסם טבעי",
        prompt: "product placed on a mossy rock surrounded by lush green nature, soft natural light filtering through trees, photorealistic, lifestyle photography, 4K",
      },
      {
        tag: "רקע",
        title: "החלפת רקע — סטודיו לבן",
        prompt: "replace the background with a clean pure white studio background. keep the subject perfectly intact with natural edge detail. professional product photography style",
      },
      {
        tag: "רקע",
        title: "החלפת רקע — עיר בלילה",
        prompt: "replace the background with a cinematic nighttime city street with bokeh lights. keep the subject sharp and perfectly intact. moody fashion photography atmosphere",
      },
    ],
  },
  {
    category: "דמות עם מוצר",
    items: [
      {
        tag: "דמות",
        title: "אישה אלגנטית — ללא מוצר",
        prompt: "An elegant woman in her late 20s, wearing a black silk dress, seated in a luxury interior, looking slightly away from camera, soft studio lighting, neutral background, photorealistic, editorial fashion photography, 4K",
      },
      {
        tag: "דמות",
        title: "אישה מחזיקה מוצר — בוטיק יוקרה",
        prompt: "An elegant woman in a black silk dress holding the Noir perfume bottle, standing inside a luxury boutique with warm golden lighting, shallow depth of field, cinematic editorial photography, photorealistic, 4K",
      },
    ],
  },
  {
    category: "וידאו",
    items: [
      {
        tag: "וידאו",
        title: "חשיפת מוצר דרמטית — קולה",
        prompt: "A dramatic cinematic product reveal of a soda can in the center of a studio scene. The can suddenly bursts open with a powerful splash of cola liquid, creating slow motion droplets and fizzy carbonation particles",
      },
      {
        tag: "וידאו",
        title: "קאמרה פוש-אין — פרפיום",
        prompt: "Slow cinematic camera push-in, woman gently brings the Noir perfume bottle closer, subtle hair movement from a soft breeze, warm golden light shift across the frame, luxury fashion ad feel, smooth motion",
      },
      {
        tag: "וידאו",
        title: "360 סיבוב מוצר — רקע לבן",
        prompt: "smooth 360 degree product rotation on a white studio background, clean professional commercial feel, soft even lighting, no shadows, seamless loop",
      },
      {
        tag: "וידאו",
        title: "ווקינג שוט — מסלול אופנה",
        prompt: "subject walking confidently toward camera on a fashion runway or city street, slow motion, cinematic 24fps feel, shallow depth of field background blur, editorial fashion video",
      },
    ],
  },
  {
    category: "שדרוג איכות",
    items: [
      {
        tag: "איכות",
        title: "חידוד כללי — פרטי עור ובד",
        prompt: "enhance the image quality. sharpen skin details, fabric texture and hair. preserve all colors and composition exactly. photorealistic enhancement only",
      },
      {
        tag: "איכות",
        title: "תיקון תאורה — בהיר ונקי",
        prompt: "fix the lighting to be bright, clean and even. remove harsh shadows from face. keep all other elements exactly the same. professional studio lighting result",
      },
    ],
  },
];

function PresetCard({ preset }: { preset: Preset }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagStyle = TAG_STYLES[preset.tag] || TAG_STYLES["איכות"];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preset.prompt);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = preset.prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full text-left p-3 rounded-xl border transition-all duration-150 group relative"
      style={{
        background: "#111",
        borderColor: copied ? "#22c55e" : "#222",
        boxShadow: copied ? "0 0 0 1px #22c55e40" : "none",
      }}
    >
      {/* Tag + copy feedback row */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: tagStyle.bg, color: tagStyle.text }}
        >
          {preset.tag}
        </span>
        <span
          className="text-[10px] font-medium transition-colors"
          style={{ color: copied ? "#22c55e" : "#444" }}
        >
          {copied ? "Copied! ✓" : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:stroke-white transition-colors">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </span>
      </div>

      {/* Title */}
      <p className="text-[12px] font-semibold text-white mb-1 leading-snug" dir="rtl">
        {preset.title}
      </p>

      {/* Prompt preview — 2 lines max */}
      <p className="text-[10px] text-[#555] leading-relaxed line-clamp-2">
        {preset.prompt}
      </p>
    </button>
  );
}

export default function PresetsPanel() {
  const open = useFlowStore((s) => s.presetsPanelOpen);
  const toggle = useFlowStore((s) => s.togglePresetsPanel);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) toggle();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, toggle]);

  return (
    <>
      {/* Backdrop — only blocks canvas interaction, doesn't visually dim */}
      {open && (
        <div
          className="fixed inset-0 z-[9990]"
          onClick={toggle}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-[9995] flex flex-col"
        style={{
          width: 320,
          background: "#1a1a1a",
          borderLeft: "1px solid #2a2a2a",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: open ? "-8px 0 32px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <h2 className="text-sm font-semibold text-white">Presets</h2>
            <span className="text-[10px] text-[#444] ml-1">26 prompts</span>
          </div>
          <button
            onClick={toggle}
            className="text-[#555] hover:text-white transition-colors p-1 rounded"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Hint */}
        <div className="px-4 py-2.5 border-b border-[#1e1e1e] flex-shrink-0">
          <p className="text-[10px] text-[#444] leading-relaxed">
            Click any card to copy the prompt. Paste it into a Prompt node on the canvas.
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}
        >
          {PRESETS.map((group) => (
            <div key={group.category}>
              {/* Category header */}
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className="text-[10px] font-semibold text-[#555] uppercase tracking-widest" dir="rtl">
                  {group.category}
                </span>
                <div className="flex-1 h-px bg-[#222]" />
                <span className="text-[9px] text-[#333]">{group.items.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-1.5">
                {group.items.map((preset) => (
                  <PresetCard key={preset.title} preset={preset} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

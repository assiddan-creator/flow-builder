"use client";

import { useFlowStore, type NodeType } from "@/store/flowStore";
import { useReactFlow } from "@xyflow/react";

const NODES: { type: NodeType; label: string; color: string; icon: React.ReactNode }[] = [
  {
    type: "imageGenNode",
    label: "Image Gen",
    color: "#378ADD",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    type: "editImageNode",
    label: "Edit Image",
    color: "#f472b6",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
  },
  {
    type: "videoGenNode",
    label: "Video Gen",
    color: "#34d399",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
  {
    type: "uploadNode",
    label: "Upload",
    color: "#f59e0b",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    type: "textNode",
    label: "Prompt",
    color: "#a78bfa",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="17" y1="10" x2="3" y2="10"/>
        <line x1="21" y1="6" x2="3" y2="6"/>
        <line x1="21" y1="14" x2="3" y2="14"/>
        <line x1="17" y1="18" x2="3" y2="18"/>
      </svg>
    ),
  },
];

export default function Toolbar() {
  const addNode = useFlowStore((s) => s.addNode);
  const { getViewport } = useReactFlow();

  const handleAdd = (type: NodeType) => {
    const viewport = getViewport();
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;
    const offset = Math.random() * 80 - 40;
    addNode(type, { x: centerX + offset, y: centerY + offset });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-3 py-2 shadow-2xl">
        {NODES.map((node) => (
          <button
            key={node.type}
            onClick={() => handleAdd(node.type)}
            title={`Add ${node.label} node`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: `${node.color}18`,
              color: node.color,
              border: `1px solid ${node.color}30`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = `${node.color}30`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = node.color;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = `${node.color}18`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${node.color}30`;
            }}
          >
            {node.icon}
            <span>{node.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

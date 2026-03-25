"use client";

import { useEffect, useRef } from "react";
import { useFlowStore, type NodeType } from "@/store/flowStore";
import { useReactFlow } from "@xyflow/react";
import { getDownstreamNodes, getNodeInputs } from "@/lib/graphUtils";
import { generateImage, generateVideo, toBase64DataURI } from "@/lib/replicate";

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId?: string;
  onClose: () => void;
  flowPosition?: { x: number; y: number };
}

const ADD_NODES: { type: NodeType; label: string; color: string }[] = [
  { type: "imageGenNode", label: "Image Gen", color: "#378ADD" },
  { type: "editImageNode", label: "Edit Image", color: "#f472b6" },
  { type: "videoGenNode", label: "Video Gen", color: "#34d399" },
  { type: "uploadNode", label: "Upload", color: "#f59e0b" },
  { type: "textNode", label: "Text/Prompt", color: "#a78bfa" },
];

export default function ContextMenu({
  x,
  y,
  nodeId,
  onClose,
  flowPosition,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const addNode = useFlowStore((s) => s.addNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleAddNode = (type: NodeType) => {
    if (flowPosition) {
      addNode(type, flowPosition);
    }
    onClose();
  };

  const handleRunFromHere = async () => {
    if (!nodeId) return;
    onClose();

    const apiKey = localStorage.getItem("replicate-api-key") || "";
    if (!apiKey) {
      alert("Please set your Replicate API key in Settings");
      return;
    }

    const downstream = getDownstreamNodes(nodeId, nodes, edges);

    for (const node of downstream) {
      const inputs = getNodeInputs(node.id, nodes, edges);

      if (node.type === "uploadNode" || node.type === "textNode") continue;

      updateNodeData(node.id, { isRunning: true, isDone: false });

      try {
        if (node.type === "imageGenNode") {
          const inputImages: string[] = [];
          if (inputs.referenceImage) {
            const b64 = await toBase64DataURI(inputs.referenceImage);
            if (b64) inputImages.push(b64);
          }
          const url = await generateImage({
            model: (node.data.model as string) || "google/nano-banana-2",
            prompt: inputs.prompt || (node.data.prompt as string) || "",
            input_images: inputImages,
            apiKey,
          });
          const hist = [url, ...((node.data.history as string[]) || [])].slice(0, 5);
          updateNodeData(node.id, {
            outputImage: url,
            history: hist,
            historyIndex: 0,
            isRunning: false,
            isDone: true,
          });
        } else if (node.type === "editImageNode") {
          if (!inputs.baseImage) {
            updateNodeData(node.id, { isRunning: false });
            continue;
          }
          const inputImages: string[] = [];
          const baseB64 = await toBase64DataURI(inputs.baseImage);
          if (baseB64) inputImages.push(baseB64);
          if (inputs.referenceImage) {
            const refB64 = await toBase64DataURI(inputs.referenceImage);
            if (refB64) inputImages.push(refB64);
          }
          const url = await generateImage({
            model: (node.data.model as string) || "google/nano-banana-2",
            prompt: inputs.prompt || (node.data.prompt as string) || "",
            input_images: inputImages,
            apiKey,
          });
          const hist = [url, ...((node.data.history as string[]) || [])].slice(0, 5);
          updateNodeData(node.id, {
            outputImage: url,
            history: hist,
            historyIndex: 0,
            isRunning: false,
            isDone: true,
          });
        } else if (node.type === "videoGenNode") {
          const url = await generateVideo({
            model: (node.data.model as string) || "kwaivgi/kling-v1-5-pro",
            start_frame_url: inputs.startFrame,
            prompt: inputs.prompt || (node.data.prompt as string) || "",
            duration: (node.data.duration as string) || "5",
            apiKey,
          });
          updateNodeData(node.id, {
            outputVideo: url,
            isRunning: false,
            isDone: true,
          });
        }
      } catch (err) {
        updateNodeData(node.id, { isRunning: false, isDone: false });
        console.error(`Node ${node.id} failed:`, err);
      }
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {nodeId ? (
        <>
          <div className="px-3 py-1.5 text-[10px] text-[#555] uppercase tracking-widest font-medium">
            Node Actions
          </div>
          <button
            onClick={handleRunFromHere}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[#378ADD20] hover:text-accent transition-colors text-left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Run from here
          </button>
          <div className="h-px bg-[#2a2a2a] my-1" />
          <button
            onClick={() => { deleteNode(nodeId); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#ef444420] transition-colors text-left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
            Delete node
          </button>
        </>
      ) : (
        <>
          <div className="px-3 py-1.5 text-[10px] text-[#555] uppercase tracking-widest font-medium">
            Add Node
          </div>
          {ADD_NODES.map((n) => (
            <button
              key={n.type}
              onClick={() => handleAddNode(n.type)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[#2a2a2a] transition-colors text-left"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: n.color }}
              />
              {n.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

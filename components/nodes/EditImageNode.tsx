"use client";

import { useCallback, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import type { NodeData } from "@/store/flowStore";
import { runGeneration, type Provider } from "@/lib/runGeneration";
import { downloadImage } from "@/lib/downloadImage";

const REPLICATE_MODELS = [
  { value: "google/nano-banana-2", label: "Nano Banana 2" },
  { value: "black-forest-labs/flux-2-pro", label: "Flux 2 Pro" },
  { value: "bytedance/seedream-5-lite", label: "Seedream 5 Lite" },
];

const GEMINI_MODELS = [
  { value: "gemini-3.1-flash-image-preview", label: "Nano Banana 2 (מהיר)" },
  { value: "gemini-2.5-flash-image", label: "Nano Banana (איכות)" },
];

const SpinnerIcon = () => (
  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

export default function EditImageNode({ id, data }: NodeProps) {
  const nodeData = data as NodeData;
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);

  const history = (nodeData.history as string[]) || [];
  const historyIndex = (nodeData.historyIndex as number) ?? -1;
  const provider = (nodeData.provider as Provider) || "replicate";

  const promptFromNode = useMemo(() => {
    const edge = edges.find((e) => e.target === id && e.targetHandle === "prompt");
    if (!edge) return "";
    const src = nodes.find((n) => n.id === edge.source);
    if (!src || src.type !== "textNode") return "";
    const d = src.data as NodeData;
    return String(d.text ?? d.prompt ?? "");
  }, [edges, nodes, id]);

  const localPromptText = (nodeData.prompt as string) || "";

  // Collect connected images for indicator
  const connectedImages = edges
    .filter((e) => e.target === id)
    .map((e) => {
      const src = nodes.find((n) => n.id === e.source);
      return (src?.data?.imageData as string) ?? null;
    })
    .filter((img): img is string => !!img);

  const missingKey =
    typeof window !== "undefined"
      ? provider === "gemini"
        ? !localStorage.getItem("gemini-api-key")
        : !localStorage.getItem("replicate-api-key")
      : false;

  const handleProviderChange = (p: Provider) => {
    const newModel = p === "gemini" ? GEMINI_MODELS[0].value : REPLICATE_MODELS[0].value;
    updateNodeData(id, { provider: p, model: newModel });
  };

  const handleRun = useCallback(async () => {
    const currentProvider = (nodeData.provider as Provider) || "replicate";

    // Snapshot current graph
    const currentEdges = useFlowStore.getState().edges;
    const currentNodes = useFlowStore.getState().nodes;

    const inputImages = currentEdges
      .filter((e) => e.target === id)
      .map((e) => {
        const src = currentNodes.find((n) => n.id === e.source);
        return (src?.data?.imageData as string) ?? null;
      })
      .filter((img): img is string => !!img);

    if (inputImages.length === 0) {
      alert("Connect at least one image node (Upload or Image Gen) before running");
      return;
    }

    updateNodeData(id, { isRunning: true, isDone: false });

    try {
      const defaultModel =
        currentProvider === "gemini" ? GEMINI_MODELS[0].value : REPLICATE_MODELS[0].value;

      const pe = currentEdges.find((e) => e.target === id && e.targetHandle === "prompt");
      const srcPrompt = pe ? currentNodes.find((n) => n.id === pe.source) : undefined;
      let promptFromRun = "";
      if (srcPrompt?.type === "textNode") {
        const d = srcPrompt.data as NodeData;
        promptFromRun = String(d.text ?? d.prompt ?? "");
      }
      const localP = (nodeData.prompt as string) || "";
      const finalPrompt = promptFromRun || localP;

      const outputUrl = await runGeneration({
        provider: currentProvider,
        model: (nodeData.model as string) || defaultModel,
        prompt: finalPrompt,
        inputImages,
      });

      const newHistory = [outputUrl, ...history].slice(0, 5);
      updateNodeData(id, {
        outputImage: outputUrl,
        imageData: outputUrl,
        history: newHistory,
        historyIndex: 0,
        isRunning: false,
        isDone: true,
      });
    } catch (err) {
      updateNodeData(id, { isRunning: false, isDone: false });
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "gemini-key-missing") {
        alert("הגדר מפתח Gemini בהגדרות (Settings → Google Gemini)");
      } else if (msg === "replicate-key-missing") {
        alert("Please set your Replicate API key in Settings");
      } else {
        alert(`Error: ${msg}`);
      }
    }
  }, [id, nodeData, updateNodeData, history]);

  const prevHistory = useCallback(() => {
    const newIndex = Math.min(historyIndex + 1, history.length - 1);
    updateNodeData(id, { historyIndex: newIndex, outputImage: history[newIndex] });
  }, [id, historyIndex, history, updateNodeData]);

  const nextHistory = useCallback(() => {
    const newIndex = Math.max(historyIndex - 1, 0);
    updateNodeData(id, { historyIndex: newIndex, outputImage: history[newIndex] });
  }, [id, historyIndex, history, updateNodeData]);

  return (
    <div
      className={`w-[220px] rounded-xl border bg-node-bg text-white overflow-visible select-none ${
        nodeData.isRunning ? "node-running" : ""
      } ${nodeData.isDone && !nodeData.isRunning ? "node-done" : ""}`}
      style={{ borderColor: "#2a2a2a" }}
    >
      {/* Input handles */}
      <Handle type="target" position={Position.Top} id="prompt" style={{ top: -5, left: "40%" }} title="Prompt" />
      <Handle type="target" position={Position.Left} id="base" style={{ left: -5, top: "35%" }} title="Base image (required)" />
      <Handle type="target" position={Position.Left} id="reference" style={{ left: -5, top: "65%" }} title="Reference image (optional)" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
        <span className="text-[#f472b6]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </span>
        <span className="text-xs font-semibold text-[#f472b6] uppercase tracking-wide">Edit Image</span>
        {nodeData.isRunning && <span className="ml-auto text-[#f472b6]"><SpinnerIcon /></span>}
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">

        {/* Provider toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[#2a2a2a]">
          <button
            onClick={() => handleProviderChange("replicate")}
            className="flex-1 py-1.5 text-[10px] font-semibold transition-colors nodrag"
            style={{
              background: provider === "replicate" ? "#a78bfa" : "#111",
              color: provider === "replicate" ? "#fff" : "#555",
            }}
          >
            Replicate
          </button>
          <button
            onClick={() => handleProviderChange("gemini")}
            className="flex-1 py-1.5 text-[10px] font-semibold transition-colors nodrag"
            style={{
              background: provider === "gemini" ? "#4285f4" : "#111",
              color: provider === "gemini" ? "#fff" : "#555",
            }}
          >
            Gemini
          </button>
        </div>

        {/* Model selector — Replicate or Gemini */}
        {provider === "replicate" ? (
          <select
            value={(nodeData.model as string) || REPLICATE_MODELS[0].value}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent nodrag appearance-none cursor-pointer"
          >
            {REPLICATE_MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        ) : (
          <select
            value={(nodeData.model as string) || GEMINI_MODELS[0].value}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none nodrag appearance-none cursor-pointer"
            style={{ borderColor: "#4285f440" }}
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}

        {/* Missing key warning */}
        {missingKey && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#3a2a1a] border border-[#fbbf2440] rounded-lg">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-[10px] text-[#fbbf24]">
              {provider === "gemini" ? "הגדר מפתח Gemini בהגדרות" : "Set Replicate key in Settings"}
            </span>
          </div>
        )}

        {/* Connection status */}
        <div className={`flex items-center gap-1.5 text-[9px] ${connectedImages.length > 0 ? "text-[#22c55e]" : "text-[#555]"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connectedImages.length > 0 ? "bg-[#22c55e]" : "bg-[#333]"}`} />
          {connectedImages.length > 0
            ? `${connectedImages.length} image${connectedImages.length > 1 ? "s" : ""} connected`
            : "No images connected"}
        </div>

        {/* Prompt */}
        {promptFromNode ? (
          <div className="space-y-1">
            <p className="text-[9px] text-[#60a5fa] font-medium">פרומפט מחובר</p>
            <textarea
              readOnly
              value={promptFromNode}
              placeholder="Describe the edit…"
              rows={3}
              className="w-full bg-[#1a2433] border border-[#334155] rounded-lg px-2 py-2 text-xs text-[#cbd5e1] resize-none cursor-default nodrag"
            />
          </div>
        ) : (
          <textarea
            value={localPromptText}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            placeholder="Describe the edit… e.g. 'place this person in a futuristic city'"
            rows={3}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-xs text-white placeholder-[#555] resize-none focus:outline-none focus:border-accent transition-colors nodrag"
          />
        )}

        {/* Run */}
        <button
          onClick={handleRun}
          disabled={!!nodeData.isRunning}
          className="w-full py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors nodrag"
          style={{ background: provider === "gemini" ? "#4285f4" : "#f472b6" }}
        >
          {nodeData.isRunning ? "Editing…" : "Run"}
        </button>

        {/* Preview + download */}
        {nodeData.outputImage && (
          <div className="w-full space-y-1">
            <div className="w-full rounded-lg overflow-hidden bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nodeData.outputImage as string}
                alt="Edited"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            </div>
            {history.length > 1 && (
              <div className="flex justify-end gap-1 items-center">
                <button onClick={prevHistory} disabled={historyIndex >= history.length - 1}
                  className="w-5 h-5 flex items-center justify-center bg-black/70 rounded text-white disabled:opacity-30 hover:bg-black nodrag">
                  ‹
                </button>
                <span className="text-[9px] text-white/70">{historyIndex + 1}/{history.length}</span>
                <button onClick={nextHistory} disabled={historyIndex <= 0}
                  className="w-5 h-5 flex items-center justify-center bg-black/70 rounded text-white disabled:opacity-30 hover:bg-black nodrag">
                  ›
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => void downloadImage(nodeData.outputImage as string)}
              className="nodrag w-full"
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
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="output" style={{ right: -5, top: "50%" }} />
    </div>
  );
}

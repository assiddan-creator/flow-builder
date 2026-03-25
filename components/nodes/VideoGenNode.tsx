"use client";

import { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import type { NodeData } from "@/store/flowStore";
import { generateVideo } from "@/lib/replicate";

const MODELS = [
  { value: "kwaivgi/kling-v1-5-pro", label: "Kling v1.5 Pro" },
  { value: "wan-video/wan2.1-t2v-480p", label: "Wan 2.1 T2V" },
];

const DURATIONS = ["3", "5", "10"];

const SpinnerIcon = () => (
  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

export default function VideoGenNode({ id, data }: NodeProps) {
  const nodeData = data as NodeData;
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const handleRun = useCallback(async () => {
    const apiKey = localStorage.getItem("replicate-api-key") || "";
    if (!apiKey) {
      alert("Please set your Replicate API key in Settings (gear icon)");
      return;
    }

    updateNodeData(id, { isRunning: true, isDone: false });

    try {
      const inputs = (nodeData.inputImages as NodeData["inputImages"]) || {};

      const outputUrl = await generateVideo({
        model: (nodeData.model as string) || "kwaivgi/kling-v1-5-pro",
        start_frame_url: inputs.startFrame,
        prompt: (nodeData.prompt as string) || "",
        duration: (nodeData.duration as string) || "5",
        apiKey,
      });

      updateNodeData(id, {
        outputVideo: outputUrl,
        isRunning: false,
        isDone: true,
      });
    } catch (err) {
      updateNodeData(id, { isRunning: false, isDone: false });
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [id, nodeData, updateNodeData]);

  return (
    <div
      className={`w-[220px] rounded-xl border bg-node-bg text-white overflow-hidden select-none ${
        nodeData.isRunning ? "node-running" : ""
      } ${nodeData.isDone && !nodeData.isRunning ? "node-done" : ""}`}
      style={{ borderColor: "#2a2a2a" }}
    >
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="startFrame"
        style={{ left: -5, top: "50%" }}
        title="Start frame image"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
        <span className="text-[#34d399]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </span>
        <span className="text-xs font-semibold text-[#34d399] uppercase tracking-wide">Video Gen</span>
        {nodeData.isRunning && (
          <span className="ml-auto text-[#34d399]"><SpinnerIcon /></span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* Model */}
        <select
          value={(nodeData.model as string) || "kwaivgi/kling-v1-5-pro"}
          onChange={(e) => updateNodeData(id, { model: e.target.value })}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent nodrag appearance-none"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Duration */}
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => updateNodeData(id, { duration: d })}
              className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors nodrag ${
                nodeData.duration === d
                  ? "bg-[#34d399] text-[#0a0a0a]"
                  : "bg-[#111] border border-[#333] text-[#888] hover:border-[#34d399] hover:text-white"
              }`}
            >
              {d}s
            </button>
          ))}
        </div>

        {/* Motion prompt */}
        <textarea
          value={(nodeData.prompt as string) || ""}
          onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
          placeholder="Describe the motion… e.g. 'camera slowly zooms in'"
          rows={3}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-xs text-white placeholder-[#555] resize-none focus:outline-none focus:border-accent transition-colors nodrag"
        />

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={!!nodeData.isRunning}
          className="w-full py-1.5 rounded-lg text-xs font-semibold bg-[#34d399] text-[#0a0a0a] hover:bg-[#10b981] disabled:opacity-50 disabled:cursor-not-allowed transition-colors nodrag"
        >
          {nodeData.isRunning ? "Generating…" : "Run"}
        </button>

        {/* Video preview */}
        {nodeData.outputVideo && (
          <video
            src={nodeData.outputVideo as string}
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: "120px" }}
          />
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ right: -5, top: "50%" }}
      />
    </div>
  );
}

"use client";

import { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import type { NodeData } from "@/store/flowStore";

const ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export default function TextNode({ id, data }: NodeProps) {
  const nodeData = data as NodeData;
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);
  const updateAll = useFlowStore((s) => s.updateNodeData);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      updateNodeData(id, { prompt: value, label: value.slice(0, 30) || "Prompt" });

      // Propagate to connected image gen nodes
      const connected = edges
        .filter((edge) => edge.source === id && edge.targetHandle === "prompt")
        .map((edge) => edge.target);

      for (const targetId of connected) {
        const targetNode = nodes.find((n) => n.id === targetId);
        if (targetNode?.type === "imageGenNode" || targetNode?.type === "editImageNode") {
          updateAll(targetId, { prompt: value });
        }
      }
    },
    [id, updateNodeData, edges, nodes, updateAll]
  );

  return (
    <div
      className={`w-[220px] rounded-xl border bg-node-bg text-white overflow-hidden select-none ${
        nodeData.isRunning ? "node-running" : ""
      }`}
      style={{ borderColor: "#2a2a2a" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
        <span className="text-[#a78bfa]">{ICON}</span>
        <span className="text-xs font-semibold text-[#a78bfa] uppercase tracking-wide">Prompt</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <textarea
          value={(nodeData.prompt as string) || ""}
          onChange={handleChange}
          placeholder="Write your prompt here…"
          rows={4}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-xs text-white placeholder-[#555] resize-none focus:outline-none focus:border-accent transition-colors nodrag"
        />
        {nodeData.prompt && (
          <p className="mt-1 text-[10px] text-[#555] truncate">
            {(nodeData.prompt as string).length} chars
          </p>
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

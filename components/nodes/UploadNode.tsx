"use client";

import { useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import type { NodeData } from "@/store/flowStore";

const ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function UploadNode({ id, data }: NodeProps) {
  const nodeData = data as NodeData;
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const dataUri = await fileToBase64(file);
        // Save as both uploadedFile (display) and imageData (read by downstream nodes)
        updateNodeData(id, { uploadedFile: dataUri, imageData: dataUri, isDone: true });
      } catch {
        alert("Failed to read file");
      }

      // Reset so re-uploading same file fires onChange
      e.target.value = "";
    },
    [id, updateNodeData]
  );

  return (
    <div
      className={`w-[220px] rounded-xl border bg-node-bg text-white overflow-visible select-none ${
        nodeData.isRunning ? "node-running" : ""
      } ${nodeData.isDone && !nodeData.isRunning ? "node-done" : ""}`}
      style={{ borderColor: "#2a2a2a" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
        <span className="text-[#f59e0b]">{ICON}</span>
        <span className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wide">Upload</span>
      </div>

      {/* Body */}
      <div className="p-3">
        {nodeData.uploadedFile ? (
          <div className="relative group w-full">
            <div className="w-full rounded-lg overflow-hidden bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nodeData.uploadedFile as string}
                alt="Uploaded"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-xs text-white nodrag"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#3a3a3a] rounded-lg hover:border-accent hover:bg-[#378ADD10] transition-colors text-[#666] hover:text-accent nodrag"
            style={{ height: "120px" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="text-xs">Click to upload</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
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

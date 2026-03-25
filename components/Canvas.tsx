"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useFlowStore } from "@/store/flowStore";
import UploadNode from "./nodes/UploadNode";
import TextNode from "./nodes/TextNode";
import ImageGenNode from "./nodes/ImageGenNode";
import EditImageNode from "./nodes/EditImageNode";
import VideoGenNode from "./nodes/VideoGenNode";
import Toolbar from "./Toolbar";
import ContextMenu from "./ContextMenu";
import SettingsPanel from "./SettingsPanel";
import PresetsPanel from "./PresetsPanel";
import PromptBuilderPanel from "./PromptBuilderPanel";

const nodeTypes = {
  uploadNode: UploadNode,
  textNode: TextNode,
  imageGenNode: ImageGenNode,
  editImageNode: EditImageNode,
  videoGenNode: VideoGenNode,
};

interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  flowPosition?: { x: number; y: number };
}

export default function Canvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const apiKey = useFlowStore((s) => s.apiKey);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const togglePresetsPanel = useFlowStore((s) => s.togglePresetsPanel);
  const presetsPanelOpen = useFlowStore((s) => s.presetsPanelOpen);
  const togglePromptBuilder = useFlowStore((s) => s.togglePromptBuilder);
  const promptBuilderOpen = useFlowStore((s) => s.promptBuilderOpen);
  const { screenToFlowPosition } = useReactFlow();

  const handlePaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault();
      const clientX = "clientX" in e ? e.clientX : 0;
      const clientY = "clientY" in e ? e.clientY : 0;
      const rfPos = screenToFlowPosition({ x: clientX, y: clientY });
      setContextMenu({
        x: clientX,
        y: clientY,
        flowPosition: rfPos,
      });
    },
    [screenToFlowPosition]
  );

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, node: Node) => {
      e.preventDefault();
      e.stopPropagation();
      const clientX = "clientX" in e ? e.clientX : 0;
      const clientY = "clientY" in e ? e.clientY : 0;
      setContextMenu({
        x: clientX,
        y: clientY,
        nodeId: node.id,
      });
    },
    []
  );

  return (
    <div className="w-screen h-screen bg-canvas relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        deleteKeyCode="Delete"
        fitView={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1e1e1e"
        />
        <Controls position="bottom-right" />
        <MiniMap
          position="top-right"
          style={{ marginTop: 60 }}
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              uploadNode: "#f59e0b",
              textNode: "#a78bfa",
              imageGenNode: "#378ADD",
              editImageNode: "#f472b6",
              videoGenNode: "#34d399",
            };
            return colors[node.type || ""] || "#555";
          }}
          maskColor="rgba(10,10,10,0.8)"
        />
      </ReactFlow>

      {/* Top-left stats */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#1a1a1a]/90 border border-[#2a2a2a] rounded-xl px-3 py-1.5">
          <span className="text-[10px] text-[#555] uppercase tracking-widest font-medium">Flow Builder</span>
        </div>
        <div className="flex items-center gap-2 bg-[#1a1a1a]/90 border border-[#2a2a2a] rounded-xl px-3 py-1.5">
          <span className="text-[11px] text-[#555]">
            <span className="text-white font-medium">{nodes.length}</span> nodes
          </span>
          <span className="text-[#333]">·</span>
          <span className="text-[11px] text-[#555]">
            <span className="text-white font-medium">{edges.length}</span> connections
          </span>
        </div>
      </div>

      {/* Top-right buttons */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Prompt Builder */}
        <button
          onClick={togglePromptBuilder}
          className="flex items-center gap-2 bg-[#1a1a1a]/90 border rounded-xl px-3 py-1.5 text-[#888] hover:text-white transition-colors"
          style={{ borderColor: promptBuilderOpen ? "#f59e0b" : "#2a2a2a" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span className="text-xs" style={{ color: promptBuilderOpen ? "#f59e0b" : undefined }}>
            Prompt Builder
          </span>
        </button>

        {/* Presets button */}
        <button
          onClick={togglePresetsPanel}
          className="flex items-center gap-2 bg-[#1a1a1a]/90 border rounded-xl px-3 py-1.5 text-[#888] hover:text-white transition-colors"
          style={{ borderColor: presetsPanelOpen ? "#a78bfa" : "#2a2a2a" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className="text-xs" style={{ color: presetsPanelOpen ? "#a78bfa" : undefined }}>
            Presets ✦
          </span>
        </button>

        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 bg-[#1a1a1a]/90 border border-[#2a2a2a] rounded-xl px-3 py-1.5 text-[#888] hover:text-white hover:border-[#3a3a3a] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
          </svg>
          <span className="text-xs">Settings</span>
          {apiKey && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" title="API key set" />
          )}
        </button>
      </div>

      {/* Empty state hint */}
      {nodes.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#2a2a2a] flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <p className="text-[#333] text-sm font-medium">Add a node to get started</p>
            <p className="text-[#222] text-xs">Use the toolbar below or right-click on the canvas</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <Toolbar />

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          flowPosition={contextMenu.flowPosition}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Settings panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Presets panel */}
      <PresetsPanel />

      {/* Prompt Builder full-screen */}
      <PromptBuilderPanel />
    </div>
  );
}

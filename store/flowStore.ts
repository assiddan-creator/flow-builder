import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";

export type NodeType =
  | "uploadNode"
  | "textNode"
  | "imageGenNode"
  | "editImageNode"
  | "videoGenNode";

export interface NodeData {
  label?: string;
  prompt?: string;
  model?: string;
  provider?: "replicate" | "gemini";
  aspectRatio?: string;
  duration?: string;
  inputImages?: { prompt?: string; reference?: string; base?: string; startFrame?: string };
  outputImage?: string;
  outputVideo?: string;
  history?: string[];
  historyIndex?: number;
  isRunning?: boolean;
  isDone?: boolean;
  uploadedFile?: string;
  imageData?: string;       // base64 data URI or URL — read by downstream nodes
  [key: string]: unknown;
}

export interface FlowNode extends Node {
  type: NodeType;
  data: NodeData;
}

interface FlowState {
  nodes: FlowNode[];
  edges: Edge[];
  apiKey: string;
  geminiApiKey: string;
  presetsPanelOpen: boolean;
  promptBuilderOpen: boolean;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  setApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  getNodeById: (id: string) => FlowNode | undefined;
  togglePresetsPanel: () => void;
  togglePromptBuilder: () => void;
}

let nodeCounter = 1;

const defaultData: Record<NodeType, NodeData> = {
  uploadNode: { label: "Upload", isRunning: false, isDone: false },
  textNode: { label: "Prompt", prompt: "", isRunning: false, isDone: false },
  imageGenNode: {
    label: "Image Gen",
    model: "google/nano-banana-2",
    provider: "replicate",
    prompt: "",
    history: [],
    historyIndex: -1,
    isRunning: false,
    isDone: false,
  },
  editImageNode: {
    label: "Edit Image",
    model: "google/nano-banana-2",
    provider: "replicate",
    prompt: "",
    history: [],
    historyIndex: -1,
    isRunning: false,
    isDone: false,
  },
  videoGenNode: {
    label: "Video Gen",
    model: "kwaivgi/kling-v1-5-pro",
    duration: "5",
    prompt: "",
    isRunning: false,
    isDone: false,
  },
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  apiKey:
    typeof window !== "undefined"
      ? localStorage.getItem("replicate-api-key") || ""
      : "",
  geminiApiKey:
    typeof window !== "undefined"
      ? localStorage.getItem("gemini-api-key") || ""
      : "",
  presetsPanelOpen: false,
  promptBuilderOpen: false,

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) =>
    set((state) => {
      const newEdges = addEdge(
        { ...connection, animated: false, style: { stroke: "#378ADD", strokeWidth: 2 } },
        state.edges
      );

      // Auto-propagate prompt from text node to image gen node
      const sourceNode = state.nodes.find((n) => n.id === connection.source);
      const targetNode = state.nodes.find((n) => n.id === connection.target);

      let updatedNodes = state.nodes;

      if (
        sourceNode?.type === "textNode" &&
        targetNode?.type === "imageGenNode" &&
        connection.targetHandle === "prompt"
      ) {
        updatedNodes = updatedNodes.map((n) =>
          n.id === targetNode.id
            ? { ...n, data: { ...n.data, prompt: sourceNode.data.prompt || "" } }
            : n
        );
      }

      if (
        sourceNode?.type === "uploadNode" &&
        targetNode?.type === "editImageNode"
      ) {
        updatedNodes = updatedNodes.map((n) =>
          n.id === targetNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  inputImages: {
                    ...n.data.inputImages,
                    reference: sourceNode.data.uploadedFile || "",
                  },
                },
              }
            : n
        );
      }

      return { edges: newEdges, nodes: updatedNodes };
    }),

  addNode: (type, position) => {
    const id = `${type}-${nodeCounter++}`;
    const newNode: FlowNode = {
      id,
      type,
      position,
      data: { ...defaultData[type] },
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },

  updateNodeData: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter(
        (e) => e.source !== id && e.target !== id
      ),
    })),

  setApiKey: (key) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("replicate-api-key", key);
    }
    set({ apiKey: key });
  },

  setGeminiApiKey: (key) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gemini-api-key", key);
    }
    set({ geminiApiKey: key });
  },

  getNodeById: (id) => get().nodes.find((n) => n.id === id),

  togglePresetsPanel: () =>
    set((state) => ({ presetsPanelOpen: !state.presetsPanelOpen })),

  togglePromptBuilder: () =>
    set((state) => ({ promptBuilderOpen: !state.promptBuilderOpen })),
}));

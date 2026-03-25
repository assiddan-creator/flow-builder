import type { Edge } from "@xyflow/react";
import type { FlowNode } from "@/store/flowStore";

/**
 * Returns nodes in topological order starting from the given node,
 * traversing only downstream (successor) nodes.
 */
export function getDownstreamNodes(
  startId: string,
  nodes: FlowNode[],
  edges: Edge[]
): FlowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  // BFS from startId
  const visited = new Set<string>();
  const queue: string[] = [startId];
  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    order.push(current);
    for (const neighbor of adjacency.get(current) || []) {
      if (!visited.has(neighbor)) queue.push(neighbor);
    }
  }

  // Return nodes in BFS order, filtering to valid nodes
  return order.map((id) => nodeMap.get(id)).filter(Boolean) as FlowNode[];
}

/**
 * Returns the upstream input data for a node based on its connected edges.
 */
export function getNodeInputs(
  nodeId: string,
  nodes: FlowNode[],
  edges: Edge[]
): { prompt?: string; referenceImage?: string; baseImage?: string; startFrame?: string } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const incoming = edges.filter((e) => e.target === nodeId);

  const result: { prompt?: string; referenceImage?: string; baseImage?: string; startFrame?: string } = {};

  for (const edge of incoming) {
    const sourceNode = nodeMap.get(edge.source);
    if (!sourceNode) continue;

    if (sourceNode.type === "textNode") {
      result.prompt = sourceNode.data.prompt as string;
    }

    if (
      sourceNode.type === "uploadNode" ||
      sourceNode.type === "imageGenNode" ||
      sourceNode.type === "editImageNode"
    ) {
      const imageUrl =
        (sourceNode.data.outputImage as string) ||
        (sourceNode.data.uploadedFile as string);

      if (!imageUrl) continue;

      const handle = edge.targetHandle;

      if (handle === "reference") {
        result.referenceImage = imageUrl;
      } else if (handle === "base") {
        result.baseImage = imageUrl;
      } else if (handle === "startFrame") {
        result.startFrame = imageUrl;
      } else {
        // default: assign to reference
        result.referenceImage = imageUrl;
      }
    }
  }

  return result;
}

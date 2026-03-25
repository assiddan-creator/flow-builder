"use client";

import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";

// Canvas uses browser APIs, so load client-side only
const Canvas = dynamic(() => import("@/components/Canvas"), { ssr: false });

export default function Home() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

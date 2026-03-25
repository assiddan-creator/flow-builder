import { toBase64DataURI } from "./replicate";

export type Provider = "replicate" | "gemini";

/**
 * Converts an array of image sources (URLs or data URIs) to base64 data URIs.
 * Needed because Replicate and Gemini both require base64 inline data.
 */
async function toBase64Array(images: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const img of images) {
    if (!img) continue;
    try {
      const b64 = await toBase64DataURI(img);
      if (b64) results.push(b64);
    } catch {
      // skip images that fail to convert
    }
  }
  return results;
}

export interface RunGenerationParams {
  provider: Provider;
  model: string;
  prompt: string;
  /** Raw image sources — URLs or data URIs. Will be converted to base64 automatically. */
  inputImages: string[];
}

export async function runGeneration({
  provider,
  model,
  prompt,
  inputImages,
}: RunGenerationParams): Promise<string> {
  // Always send base64 data URIs — convert URLs via proxy if needed
  const base64Images = await toBase64Array(inputImages);

  if (provider === "gemini") {
    const apiKey = localStorage.getItem("gemini-api-key") || "";
    if (!apiKey) throw new Error("gemini-key-missing");

    const res = await fetch("/api/gemini/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, input_images: base64Images, apiKey, model }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const { output_url } = await res.json();
    return output_url as string;
  } else {
    const apiKey = localStorage.getItem("replicate-api-key") || "";
    if (!apiKey) throw new Error("replicate-key-missing");

    const res = await fetch("/api/replicate/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, input_images: base64Images, apiKey }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const { output_url } = await res.json();
    return output_url as string;
  }
}
